/**
 * scripts/import-product-images.cjs
 *
 * Downloads curated high-definition food photography for each item from the CSV,
 * saves local copies to `client/public/images/products/<filename>`,
 * uploads to Supabase Storage bucket `product-images`,
 * and registers/updates them in the `public.product_images` table.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const VARIANT_PATTERNS = [
  { regex: /\(([^)]+)\)\s*$/, group: 1 },
  { regex: /\[([^\]]+)\]\s*$/, group: 1 },
  { regex: /\s+-\s+(\d+\s*(?:P|piece|pieces|stick|sticks|scoops?|scoop)?)\s*$/i, group: 1 },
];

function extractVariant(n) {
  for (const { regex, group } of VARIANT_PATTERNS) {
    const m = n.match(regex);
    if (m) {
      const lbl = m[group].trim();
      const base = n.slice(0, m.index).trim();
      if (base) return { baseName: base, variantLabel: lbl };
    }
  }
  return { baseName: n, variantLabel: null };
}

function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// Curated Unsplash photo IDs for each filename
const PHOTO_MAP = {
  'apricot_delight.jpg': 'photo-1509440159596-0249088772ff',
  'choco_mousse.jpg': 'photo-1541781774459-bb2af2f05b55',
  'rainbow_pastry.jpg': 'photo-1558301211-0d8c8ddee6ec',
  'honey_trat.jpg': 'photo-1509440159596-0249088772ff',
  'tres_leches.jpg': 'photo-1464349095431-e9a21285b5f3',
  'choco_lava.jpg': 'photo-1624353365286-3f8d62daad51',
  'brownie.jpg': 'photo-1606313564200-e75d5e30476c',
  'death_by_chocolate_500gms.jpg': 'photo-1578985545062-69928b1d9587',
  'malai_biscoff.jpg': 'photo-1587314168485-3236d6710814',
  'passion_delight.jpg': 'photo-1505976378723-9726b54e9bb9',
  'vanilla_cake.jpg': 'photo-1563729784474-d77dbb933a9e',
  'strawberry_cake.jpg': 'photo-1565958011703-44f9829ba187',
  'rasmalai_cake.jpg': 'photo-1588195538326-c5b1e9f80a1b',
  'mango_cake.jpg': 'photo-1534432182912-63863115e106',
  'blackcurrant_cake.jpg': 'photo-1562440499-64c9a111f713',
  'chocochips.jpg': 'photo-1606890737304-57a1ca8a5b62',
  'dutch_truffle_cake.jpg': 'photo-1578985545062-69928b1d9587',
  'butterscotch_cake.jpg': 'photo-1542826438-bd32f43d626f',
  'semi_fondant_cakes.jpg': 'photo-1535254973040-607b474cb50d',
  'tiramisu_cake.jpg': 'photo-1533134242443-d4fd215305ad',
  'gulab_jamun_cake.jpg': 'photo-1519869325930-281384150729',
  'black_forest_cake.jpg': 'photo-1606890737304-57a1ca8a5b62',
  'fondant_cake_full.jpg': 'photo-1535254973040-607b474cb50d',
  'rasgulla_cake.jpg': 'photo-1588195538326-c5b1e9f80a1b',
  'white_forest_cake.jpg': 'photo-1563729784474-d77dbb933a9e',
  'photo_cakes.jpg': 'photo-1562777717-dc6984f65a63',
  'rainbow_cake.jpg': 'photo-1558301211-0d8c8ddee6ec',
  'pineapple_cake.jpg': 'photo-1557308536-ee471ef2c390',
  'extra_designs.jpg': 'photo-1513519245088-0e12902e5a38',
  'extra_milkmaid.jpg': 'photo-1550617931-e17a7b70dce2',
  'litchi_cake.jpg': 'photo-1563729784474-d77dbb933a9e',
  'butterfly_and_balls.jpg': 'photo-1513519245088-0e12902e5a38',
  'swiss_chocolate_cake.jpg': 'photo-1578985545062-69928b1d9587',
  'drawing_cake.jpg': 'photo-1535254973040-607b474cb50d',
  'blueberry_cake.jpg': 'photo-1562440499-64c9a111f713',
  'oreo_cake.jpg': 'photo-1588195538326-c5b1e9f80a1b',
  'choco_almond_cake.jpg': 'photo-1606890737304-57a1ca8a5b62',
  'milky_butterscotch.jpg': 'photo-1542826438-bd32f43d626f',
  'pineapple_with_milk_maid.jpg': 'photo-1557308536-ee471ef2c390',
  'hazelnut_cream.jpg': 'photo-1578985545062-69928b1d9587',
  'fresh_fruits.jpg': 'photo-1519869325930-281384150729',
  'honey_almond.jpg': 'photo-1509440159596-0249088772ff',
  'american_red_velvet.jpg': 'photo-1586788680434-30d324b2d46f',
  'choco_red_velvet.jpg': 'photo-1586788680434-30d324b2d46f',
  'celebrations.jpg': 'photo-1535254973040-607b474cb50d',
  'kitkat_chocolate.jpg': 'photo-1578985545062-69928b1d9587',
  'cafe_delight.jpg': 'photo-1533134242443-d4fd215305ad',
  'fruits_and_nuts.jpg': 'photo-1519869325930-281384150729',
  'classic_italian_pizza.jpg': 'photo-1604382355076-af4b0eb60143',
  'margherita_pizza.jpg': 'photo-1574071318508-1cdbab80d002',
  'corn_pizza.jpg': 'photo-1513104890138-7c749659a591',
  'cake_box_veg_special_pizza.jpg': 'photo-1565299624946-b28f40a0ae38',
  'corn_paneer_pizza.jpg': 'photo-1513104890138-7c749659a591',
  'farm_house_pizza.jpg': 'photo-1574071318508-1cdbab80d002',
  'paneer_masala_pizza.jpg': 'photo-1565299624946-b28f40a0ae38',
  'tandoori_paneer_pizza.jpg': 'photo-1565299624946-b28f40a0ae38',
  'cheese_corn_ball_6p.jpg': 'photo-1541592106381-b31e9677c0e5',
  'veg_manchurian.jpg': 'photo-1563379091339-03b21ab4a4f8',
  'crispy_veg.jpg': 'photo-1541592106381-b31e9677c0e5',
  'veg_65.jpg': 'photo-1567188040759-fb8a883dc6d8',
  'mushroom_65.jpg': 'photo-1546069901-ba9599a7e63c',
  'butter_garlic_mushrooms.jpg': 'photo-1546069901-ba9599a7e63c',
  'mushroom_manchurian.jpg': 'photo-1563379091339-03b21ab4a4f8',
  'chilli_mushroom.jpg': 'photo-1546069901-ba9599a7e63c',
  'schezwan_mushroom.jpg': 'photo-1546069901-ba9599a7e63c',
  'badam_milk.jpg': 'photo-1544787219-7f47ccb76574',
  'doughnut_eggless_1_piece.jpg': 'photo-1527515637462-cff94eecc1ac',
  'well_cake.jpg': 'photo-1563729784474-d77dbb933a9e',
  'alfredo.jpg': 'photo-1645112411341-6c4fd023714a',
  'alfredo_pasta.jpg': 'photo-1645112411341-6c4fd023714a',
  'arrabiata.jpg': 'photo-1551183053-bf91a1d81141',
  'arrabbiata_pasta.jpg': 'photo-1551183053-bf91a1d81141',
  'pink_sauce_pasta.jpg': 'photo-1621996346565-e3d5d6281691',
  'blackcurrant_ice_cream_1_scoop.jpg': 'photo-1488900128323-21503983a07e',
  'caramel_nuts_ice_cream_1_scoop.jpg': 'photo-1501443762994-82bd5dace89a',
  'mango_ice_cream_1_scoop.jpg': 'photo-1488900128323-21503983a07e',
  'vanilla_ice_cream_1_scoop.jpg': 'photo-1501443762994-82bd5dace89a',
  'chocolate_ice_cream_1_scoop.jpg': 'photo-1570197788417-0e82375c9371',
  'strawberry_ice_cream_1_scoop.jpg': 'photo-1488900128323-21503983a07e',
  'thums_up_250_ml.jpg': 'photo-1622483767028-3f66f32aef97',
  'litchi_milkshake.jpg': 'photo-1572490122747-3968b75cc699',
  'sprite_250_ml.jpg': 'photo-1622483767028-3f66f32aef97',
  'kinley_1_0_l.jpg': 'photo-1523362628745-0c100150b504',
  'pista_punch.jpg': 'photo-1572490122747-3968b75cc699',
  'veg_momos_5_pieces.jpg': 'photo-1541696432-82c6da8ce7bf',
  'peanut_biscuits.jpg': 'photo-1499636136210-6f4ee915583e',
  'warm_biscuits.jpg': 'photo-1499636136210-6f4ee915583e',
  'stick_paneer_5_stick.jpg': 'photo-1567188040759-fb8a883dc6d8',
  'chilli_garlic_paneer.jpg': 'photo-1567188040759-fb8a883dc6d8',
  'butter_garlic_paneer.jpg': 'photo-1567188040759-fb8a883dc6d8',
  'schezwan_paneer.jpg': 'photo-1567188040759-fb8a883dc6d8',
  'paneer_majestic.jpg': 'photo-1567188040759-fb8a883dc6d8',
  'chili_paneer.jpg': 'photo-1567188040759-fb8a883dc6d8',
  'paneer_manchurian.jpg': 'photo-1563379091339-03b21ab4a4f8',
  'paneer_65.jpg': 'photo-1567188040759-fb8a883dc6d8',
  'potato_cheese_blast_burger.jpg': 'photo-1550547660-d9450f859349',
  'paneer_patty_burger.jpg': 'photo-1568901346375-23c9450c58cd',
  'cake_box_special_double_patty_mega_burger.jpg': 'photo-1586190848861-99aa4a171e90',
  'veg_patty_burger.jpg': 'photo-1568901346375-23c9450c58cd',
  'classic_burger.jpg': 'photo-1568901346375-23c9450c58cd',
  'mango.jpg': 'photo-1488900128323-21503983a07e',
  'black_current.jpg': 'photo-1488900128323-21503983a07e',
  'caramel_nuts.jpg': 'photo-1501443762994-82bd5dace89a',
  'milk_butterscotch_pastry.jpg': 'photo-1542826438-bd32f43d626f',
  'honey_almond_pastry.jpg': 'photo-1509440159596-0249088772ff',
  'black_forest_pastry.jpg': 'photo-1606890737304-57a1ca8a5b62',
  'whole_wheat_bread.jpg': 'photo-1509440159596-0249088772ff',
  'dry_cake.jpg': 'photo-1563729784474-d77dbb933a9e',
  'veg_momos.jpg': 'photo-1541696432-82c6da8ce7bf',
  'paneer_momos.jpg': 'photo-1541696432-82c6da8ce7bf',
  'corn_cheese_sandwich.jpg': 'photo-1528735602780-2552fd46c7af',
  'mushroom_sandwich.jpg': 'photo-1528735602780-2552fd46c7af',
  'paneer_sandwich.jpg': 'photo-1528735602780-2552fd46c7af',
  'paneer_makhani_sandwich.jpg': 'photo-1528735602780-2552fd46c7af',
};

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    let inQuotes = false;
    let field = '';
    const fields = [];
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(field);
        field = '';
      } else {
        field += char;
      }
    }
    fields.push(field);
    if (fields.length >= 6) {
      rows.push({
        item: fields[0].trim(),
        price: fields[1].trim(),
        desc: fields[2].trim(),
        cat: fields[3].trim(),
        filename: fields[4].trim(),
        searchUrl: fields[5].trim()
      });
    }
  }
  return rows;
}

// Download buffer cache by photoId to avoid redundant downloads
const bufferCache = new Map();

async function fetchImageBuffer(photoId) {
  if (bufferCache.has(photoId)) return bufferCache.get(photoId);
  const url = `https://images.unsplash.com/${photoId}?w=800&auto=format&fit=crop&q=80`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status} fetching ${url}`);
  const arrayBuf = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  bufferCache.set(photoId, buf);
  return buf;
}

async function main() {
  console.log('=== STARTING PRODUCT IMAGES IMPORT ===');

  // 1. Target local directory
  const localDir = path.join(__dirname, '..', 'client', 'public', 'images', 'products');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
    console.log('Created directory:', localDir);
  }

  // 2. Fetch all products from DB
  const { data: dbProds, error: pErr } = await supabase.from('products').select('id, name, slug');
  if (pErr) {
    console.error('Error fetching products:', pErr);
    process.exit(1);
  }
  console.log(`Loaded ${dbProds.length} products from Supabase.`);

  const dbBySlug = new Map();
  const dbByName = new Map();
  dbProds.forEach(p => {
    dbBySlug.set(p.slug, p);
    dbByName.set(p.name.toLowerCase().trim(), p);
  });

  // 3. Read CSV
  const csvPath = path.join(__dirname, '..', 'data', 'Cake_Box_Kakinada_Menu_Images.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csvContent);
  console.log(`Read ${rows.length} rows from CSV.`);

  // Map each product to its image info
  const productItemMap = new Map();
  rows.forEach(r => {
    const { baseName } = extractVariant(r.item);
    const slug = slugify(baseName);
    const itemSlug = slugify(r.item);
    const product = dbBySlug.get(slug) || dbBySlug.get(itemSlug) || dbByName.get(baseName.toLowerCase()) || dbByName.get(r.item.toLowerCase());
    if (product && !productItemMap.has(product.id)) {
      productItemMap.set(product.id, { product, csvRow: r });
    }
  });

  console.log(`Matched ${productItemMap.size} unique products in database.`);

  let downloadedCount = 0;
  let uploadedCount = 0;
  let tableUpsertCount = 0;
  let errorCount = 0;

  for (const [productId, { product, csvRow }] of productItemMap.entries()) {
    const filename = csvRow.filename;
    const photoId = PHOTO_MAP[filename] || 'photo-1578985545062-69928b1d9587';
    const localFilePath = path.join(localDir, filename);

    try {
      // 1. Fetch Image
      const buf = await fetchImageBuffer(photoId);

      // 2. Save locally if not exists
      if (!fs.existsSync(localFilePath)) {
        fs.writeFileSync(localFilePath, buf);
        downloadedCount++;
      }

      // 3. Upload to Supabase Storage bucket 'product-images'
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(filename, buf, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (upErr) {
        console.warn(`Storage upload warning for ${filename}:`, upErr.message);
      } else {
        uploadedCount++;
      }

      // Public URL
      const { data: pubData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filename);
      
      const publicUrl = pubData.publicUrl;

      // 4. Upsert into public.product_images
      // Check if product already has primary image
      const { data: existing, error: exErr } = await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error: updErr } = await supabase
          .from('product_images')
          .update({
            storage_path: filename,
            public_url: publicUrl,
            alt_text: product.name,
            is_primary: true,
            display_order: 0
          })
          .eq('id', existing.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            storage_path: filename,
            public_url: publicUrl,
            alt_text: product.name,
            is_primary: true,
            display_order: 0
          });
        if (insErr) throw insErr;
      }

      tableUpsertCount++;
      console.log(`[OK] [${tableUpsertCount}/${productItemMap.size}] ${product.name} -> ${filename}`);
    } catch (err) {
      console.error(`[ERROR] ${product.name} (${filename}):`, err.message);
      errorCount++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total Products Matched: ${productItemMap.size}`);
  console.log(`Local Files Saved     : ${downloadedCount}`);
  console.log(`Storage Uploads       : ${uploadedCount}`);
  console.log(`DB Records Upserted   : ${tableUpsertCount}`);
  console.log(`Errors                : ${errorCount}`);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
