const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log('=== REMOTE SUPABASE VERIFICATION ===\n');

  const [catR, prodR, varR] = await Promise.all([
    sb.from('categories').select('id, name, slug, is_active', { count: 'exact' }),
    sb.from('products').select('id, name, slug, availability, category_id', { count: 'exact' }),
    sb.from('product_variants').select('id, name, price, variant_type, availability, product_id', { count: 'exact' }),
  ]);

  if (catR.error)  { console.error('categories error:', catR.error.message);  process.exit(1); }
  if (prodR.error) { console.error('products error:',   prodR.error.message); process.exit(1); }
  if (varR.error)  { console.error('variants error:',   varR.error.message);  process.exit(1); }

  console.log('--- Row Counts ---');
  console.log('categories      : ' + catR.count);
  console.log('products        : ' + prodR.count);
  console.log('product_variants: ' + varR.count);
  console.log('');

  console.log('--- Categories (' + catR.count + ') ---');
  const sortedCats = (catR.data || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  sortedCats.forEach(function(c) {
    console.log('  [' + (c.is_active ? 'ACTIVE' : 'INACTIVE') + '] ' + c.name + ' (slug: ' + c.slug + ')');
  });
  console.log('');

  console.log('--- Pink Sauce Pasta Exclusion Check ---');
  const pspCheck = await sb.from('products').select('id, name, slug').ilike('name', '%pink%sauce%');
  if (!pspCheck.data || pspCheck.data.length === 0) {
    console.log('  CONFIRMED: Pink Sauce Pasta is NOT in products table.');
  } else {
    console.log('  WARNING: Found matching row(s):');
    pspCheck.data.forEach(function(r) { console.log('    ' + r.name + ' (slug: ' + r.slug + ')'); });
  }
  console.log('');

  const allVariants = varR.data || [];
  const standardCount = allVariants.filter(function(v) { return v.variant_type === 'Standard'; }).length;
  const portionCount  = allVariants.filter(function(v) { return v.variant_type === 'Portion'; }).length;
  console.log('--- Variant Type Breakdown ---');
  console.log('  Standard (single-option, name mirrors product): ' + standardCount);
  console.log('  Portion  (explicit size/count extracted):       ' + portionCount);
  console.log('');

  console.log('--- Forbidden Label Check ---');
  const forbidden = ['Default', 'Variant 1', 'Variant 2', 'Variant 3'];
  let foundForbidden = false;
  forbidden.forEach(function(label) {
    const found = allVariants.filter(function(v) { return v.name === label; });
    if (found.length > 0) {
      console.log('  WARNING: ' + found.length + ' variant(s) with forbidden label: ' + label);
      foundForbidden = true;
    }
  });
  if (!foundForbidden) console.log('  CONFIRMED: No Default/Variant-N labels present.');
  console.log('');

  const allProducts = prodR.data || [];
  const portions = allVariants.filter(function(v) { return v.variant_type === 'Portion'; });
  console.log('--- Inferred Portion Variants (' + portions.length + ') ---');
  portions.forEach(function(v) {
    const prod = allProducts.find(function(p) { return p.id === v.product_id; });
    console.log('  "' + (prod ? prod.name : '?') + '" -> "' + v.name + '" @ INR ' + v.price);
  });
  console.log('');

  const varProductIds = new Set(allVariants.map(function(v) { return v.product_id; }));
  const orphans = allProducts.filter(function(p) { return !varProductIds.has(p.id); });
  console.log('--- Orphan Products (no variants): ' + orphans.length + ' ---');
  if (orphans.length === 0) {
    console.log('  NONE - every product has at least one variant.');
  } else {
    orphans.forEach(function(p) { console.log('  ' + p.name + ' (slug: ' + p.slug + ')'); });
  }
  console.log('');

  console.log('--- Availability Check (products) ---');
  const hidden = allProducts.filter(function(p) { return p.availability === 'HIDDEN'; });
  const unavail = allProducts.filter(function(p) { return p.availability === 'UNAVAILABLE'; });
  const avail   = allProducts.filter(function(p) { return p.availability === 'AVAILABLE'; });
  console.log('  AVAILABLE  : ' + avail.length);
  console.log('  UNAVAILABLE: ' + unavail.length);
  console.log('  HIDDEN     : ' + hidden.length);
  console.log('');

  console.log('=== VERIFICATION COMPLETE ===');
}

verify().catch(function(e) { console.error('FATAL:', e); process.exit(1); });
