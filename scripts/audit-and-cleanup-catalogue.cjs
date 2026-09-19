/**
 * scripts/audit-and-cleanup-catalogue.cjs
 *
 * 1. Audits all products, variants, and product images in Supabase.
 * 2. Identifies visual image duplicate groups.
 * 3. Classifies products:
 *    - KEEP_UNIQUE: Distinct product, keeps unique image.
 *    - KEEP_PRODUCT_DIFFERENT_IMAGE_NEEDED: Genuine product, but duplicate image removed so it uses clean placeholder until owner photo upload.
 *    - REMOVE_FROM_PUBLIC_MENU: Redundant/duplicate item marked as availability = 'HIDDEN'.
 * 4. Ensures 1-to-1 unique image mapping for publicly visible products.
 * 5. Backs up affected records before applying updates.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Specific redundant products to hide from public menu
// These are exact duplicate items or redundant legacy pricing entries
const PRODUCTS_TO_HIDE = [
  'alfredo',              // Redundant duplicate of 'alfredo-pasta' (₹200 vs ₹260)
  'arrabiata',            // Redundant duplicate of 'arrabbiata-pasta' (₹220 vs ₹280)
  'veg-momos-5-pieces',   // Redundant duplicate of 'veg-momos' in Momos category
  'mango',                // Redundant duplicate in Sundaes & Desserts of 'mango-ice-cream'
  'black-current',        // Redundant duplicate in Sundaes & Desserts of 'blackcurrant-ice-cream'
  'caramel-nuts',         // Redundant duplicate in Sundaes & Desserts of 'caramel-nuts-ice-cream'
];

async function run() {
  console.log('=== PART 1 & 2: AUDITING CATALOGUE & IMAGES ===\n');

  // 1. Fetch products, variants, images, categories, orders
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('*, category:categories(name), product_variants(*), product_images(*)');

  if (pErr) throw pErr;

  const { data: orderItems } = await supabase.from('order_items').select('product_id');
  const orderedProductIds = new Set((orderItems || []).map(oi => oi.product_id));

  console.log(`Loaded ${products.length} products from Supabase.`);
  console.log(`Historical ordered products: ${orderedProductIds.size} (all will be strictly protected)`);

  // 2. Compute visual image hash for each image
  const imgDir = path.join(__dirname, '..', 'client', 'public', 'images', 'products');
  const fileHashMap = new Map();
  const hashToProducts = new Map();

  products.forEach(p => {
    const img = p.product_images && p.product_images[0];
    if (img && img.storage_path) {
      const fPath = path.join(imgDir, img.storage_path);
      if (fs.existsSync(fPath)) {
        const buf = fs.readFileSync(fPath);
        const hash = crypto.createHash('md5').update(buf).digest('hex');
        fileHashMap.set(img.id, hash);
        if (!hashToProducts.has(hash)) hashToProducts.set(hash, []);
        hashToProducts.get(hash).push(p);
      }
    }
  });

  console.log(`Found ${hashToProducts.size} unique image hashes across ${products.length} products.`);

  // 3. Classify all products
  const classificationReport = [];
  const assignedImageHashes = new Set(); // Track unique image assignment for publicly visible products
  const updatesToApply = {
    hideProductIds: [],
    removeImageIds: [],
    keepWithUniqueImage: []
  };

  for (const p of products) {
    const isHiddenCandidate = PRODUCTS_TO_HIDE.includes(p.slug);
    const img = p.product_images && p.product_images[0];
    const hash = img ? fileHashMap.get(img.id) : null;
    const isOrdered = orderedProductIds.has(p.id);

    let classification = 'KEEP_UNIQUE';
    let reason = '';

    if (isHiddenCandidate) {
      if (isOrdered) {
        classification = 'REMOVE_FROM_PUBLIC_MENU';
        reason = 'Duplicate item marked HIDDEN (historical order preserved)';
      } else {
        classification = 'REMOVE_FROM_PUBLIC_MENU';
        reason = 'Redundant menu item safely hidden to declutter catalogue';
      }
      updatesToApply.hideProductIds.push(p.id);
      if (img) updatesToApply.removeImageIds.push(img.id);
    } else {
      // Product remains in public menu
      if (!hash) {
        classification = 'KEEP_PRODUCT_DIFFERENT_IMAGE_NEEDED';
        reason = 'No image assigned - uses aesthetic category placeholder';
      } else if (!assignedImageHashes.has(hash)) {
        // First product to claim this image
        assignedImageHashes.add(hash);
        classification = 'KEEP_UNIQUE';
        reason = 'Primary representative item for this unique visual asset';
        updatesToApply.keepWithUniqueImage.push(p.name);
      } else {
        // Visual hash was already claimed by another product in this group!
        // To ensure strict uniqueness, remove duplicate image assignment so it uses proper placeholder
        classification = 'KEEP_PRODUCT_DIFFERENT_IMAGE_NEEDED';
        reason = 'Shares visual photo with another item; duplicate image unassigned so it uses clean placeholder';
        if (img) updatesToApply.removeImageIds.push(img.id);
      }
    }

    classificationReport.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category ? p.category.name : 'Uncategorized',
      price: p.product_variants[0] ? p.product_variants[0].price : 'N/A',
      currentAvailability: p.availability,
      imageFile: img ? img.storage_path : 'None',
      classification,
      reason
    });
  }

  // 4. Save Backup & Audit Report
  const backupData = {
    timestamp: new Date().toISOString(),
    totalProducts: products.length,
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      availability: p.availability,
      images: p.product_images
    }))
  };

  const backupPath = path.join(__dirname, '..', 'data', 'catalogue_backup_before_cleanup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`Saved pre-cleanup backup to: ${backupPath}`);

  const reportPath = path.join(__dirname, '..', 'data', 'catalogue_cleanup_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(classificationReport, null, 2));
  console.log(`Saved classification report to: ${reportPath}`);

  // Summary counts
  const counts = {
    KEEP_UNIQUE: classificationReport.filter(r => r.classification === 'KEEP_UNIQUE').length,
    KEEP_PRODUCT_DIFFERENT_IMAGE_NEEDED: classificationReport.filter(r => r.classification === 'KEEP_PRODUCT_DIFFERENT_IMAGE_NEEDED').length,
    REMOVE_FROM_PUBLIC_MENU: classificationReport.filter(r => r.classification === 'REMOVE_FROM_PUBLIC_MENU').length
  };

  console.log('\n=== CLASSIFICATION BREAKDOWN ===');
  console.log(`Total Products                      : ${products.length}`);
  console.log(`KEEP_UNIQUE (with distinct image)   : ${counts.KEEP_UNIQUE}`);
  console.log(`KEEP_PRODUCT_DIFFERENT_IMAGE_NEEDED: ${counts.KEEP_PRODUCT_DIFFERENT_IMAGE_NEEDED}`);
  console.log(`REMOVE_FROM_PUBLIC_MENU (HIDDEN)    : ${counts.REMOVE_FROM_PUBLIC_MENU}`);
  console.log(`Total Publicly Visible Products     : ${counts.KEEP_UNIQUE + counts.KEEP_PRODUCT_DIFFERENT_IMAGE_NEEDED}`);

  // 5. Apply Database Changes Safely
  console.log('\n=== PART 4 & 6: APPLYING DATABASE UPDATES ===');

  // Mark redundant products as HIDDEN
  if (updatesToApply.hideProductIds.length > 0) {
    for (const hid of updatesToApply.hideProductIds) {
      const { error: hErr } = await supabase
        .from('products')
        .update({ availability: 'HIDDEN' })
        .eq('id', hid);
      if (hErr) console.error(`Error hiding product ${hid}:`, hErr);
    }
    console.log(`[OK] Marked ${updatesToApply.hideProductIds.length} redundant products as availability = 'HIDDEN'.`);
  }

  // Remove duplicate image records so public items have 100% unique image assignments or clean placeholders
  if (updatesToApply.removeImageIds.length > 0) {
    for (const imgId of updatesToApply.removeImageIds) {
      const { error: dErr } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imgId);
      if (dErr) console.error(`Error removing image record ${imgId}:`, dErr);
    }
    console.log(`[OK] Removed ${updatesToApply.removeImageIds.length} duplicate/redundant image associations.`);
  }

  // 6. Final verification of public catalogue
  const { data: publicProds } = await supabase
    .from('products')
    .select('id, name, slug, availability, product_images(*)')
    .neq('availability', 'HIDDEN');

  const publicImages = [];
  publicProds.forEach(p => {
    if (p.product_images && p.product_images.length > 0) {
      publicImages.push(p.product_images[0].storage_path);
    }
  });

  const uniquePublicImages = new Set(publicImages);
  console.log('\n=== FINAL VERIFICATION ===');
  console.log(`Public Products in Storefront       : ${publicProds.length}`);
  console.log(`Public Products with Images         : ${publicImages.length}`);
  console.log(`Unique Image Assignments in Public  : ${uniquePublicImages.size}`);
  console.log(`Public Products with Placeholders   : ${publicProds.length - publicImages.length}`);
  console.log(`Image Duplication in Public Menu    : ${publicImages.length - uniquePublicImages.size} (0 means 100% unique!)`);
}

run().catch(err => {
  console.error('Audit and cleanup error:', err);
  process.exit(1);
});
