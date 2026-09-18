const xlsx = require('xlsx');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(process.cwd(), '.env') });

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const VARIANT_PATTERNS = [
  { regex: /\(([^)]+)\)\s*$/, group: 1 },
  { regex: /\[([^\]]+)\]\s*$/, group: 1 },
  { regex: /\s+-\s+(\d+\s*(?:P|piece|pieces|stick|sticks|scoops?|scoop)?)\s*$/i, group: 1 },
];

function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''); }
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

async function run() {
  const wb = xlsx.readFile('./data/Cake_Box_Kakinada_Menu.xlsx');
  const rows = xlsx.utils.sheet_to_json(wb.Sheets['Menu']);
  const map = new Map();
  for (const row of rows) {
    const orig = row.Item && row.Item.toString().trim();
    if (!orig) continue;
    const price = Number(row['Price (INR)']);
    const cat = (row.Category && row.Category.toString().trim()) || 'Uncategorised';
    const desc = (row.Description && row.Description.toString().trim()) || '';
    const { baseName, variantLabel } = extractVariant(orig);
    const slug = slugify(baseName);
    if (!map.has(slug)) map.set(slug, { baseName, cat, desc, variants: [] });
    map.get(slug).variants.push({ orig, price, variantLabel });
  }

  const skip = new Set();
  const conflicts = [];
  for (const [slug, p] of map.entries()) {
    const ul = p.variants.filter(function(v) { return v.variantLabel === null; });
    if (ul.length > 1 && new Set(ul.map(function(v) { return v.price; })).size > 1) {
      skip.add(slug);
      conflicts.push({ slug, ul, cat: p.cat });
    }
  }

  const eligible = [];
  for (const entry of map.entries()) {
    if (!skip.has(entry[0])) eligible.push(entry);
  }

  console.log('=== IMPORT STARTING ===');
  console.log('Eligible products: ' + eligible.length);
  console.log('Conflicts skipped: ' + skip.size + ' (' + conflicts.map(function(c){return c.slug;}).join(', ') + ')');
  console.log('');

  // Upsert categories
  const cats = [];
  eligible.forEach(function(e) { if (!cats.includes(e[1].cat)) cats.push(e[1].cat); });
  const catMap = new Map();
  for (let i = 0; i < cats.length; i++) {
    const name = cats[i];
    const slug = slugify(name);
    const r = await supabase.from('categories').upsert({ name, slug, display_order: i, is_active: true }, { onConflict: 'slug' }).select('id').single();
    if (r.error) { console.error('CAT ERROR ' + name + ': ' + r.error.message); process.exit(1); }
    catMap.set(name, r.data.id);
    console.log('CAT OK: ' + name);
  }
  console.log('');

  // Upsert products; insert variants using select-then-insert (idempotent, no constraint required)
  let prodOk = 0, varOk = 0, varSkipped = 0, errs = 0;

  for (const [slug, prod] of eligible) {
    const categoryId = catMap.get(prod.cat);
    const origNames = prod.variants.map(function(v){ return v.orig; }).join(' | ');
    const src = 'Cake Box Kakinada menu (original Excel name(s): ' + origNames + ')';

    const pr = await supabase.from('products').upsert({
      category_id: categoryId, name: prod.baseName, slug,
      short_description: prod.desc, currency: 'INR', availability: 'AVAILABLE',
      source: src, last_verified: new Date().toISOString()
    }, { onConflict: 'slug' }).select('id').single();

    if (pr.error) { console.error('PROD ERROR "' + prod.baseName + '": ' + pr.error.message); errs++; continue; }
    prodOk++;
    const productId = pr.data.id;

    for (const v of prod.variants) {
      const variantName = v.variantLabel !== null ? v.variantLabel : prod.baseName;
      const variantType = v.variantLabel !== null ? 'Portion' : 'Standard';
      const varSrc = 'Cake Box Kakinada menu (original Excel name: "' + v.orig + '")';

      // Check if variant already exists (idempotent without DB unique constraint)
      const existing = await supabase.from('product_variants')
        .select('id')
        .eq('product_id', productId)
        .eq('name', variantName)
        .maybeSingle();

      if (existing.error) { console.error('VAR CHECK ERROR "' + variantName + '": ' + existing.error.message); errs++; continue; }

      if (existing.data) {
        // Variant exists — update price/source to stay current
        const upd = await supabase.from('product_variants').update({
          price: v.price, variant_type: variantType, source: varSrc,
          availability: 'AVAILABLE', last_verified: new Date().toISOString()
        }).eq('id', existing.data.id);
        if (upd.error) { console.error('VAR UPD ERROR "' + variantName + '": ' + upd.error.message); errs++; }
        else { varSkipped++; }
      } else {
        // Insert new variant
        const ins = await supabase.from('product_variants').insert({
          product_id: productId, name: variantName, variant_type: variantType,
          price: v.price, availability: 'AVAILABLE', source: varSrc,
          last_verified: new Date().toISOString()
        });
        if (ins.error) { console.error('VAR INS ERROR "' + variantName + '" for "' + prod.baseName + '": ' + ins.error.message); errs++; }
        else { varOk++; }
      }
    }
  }

  console.log('');
  console.log('=== IMPORT COMPLETE ===');
  console.log('Categories upserted : ' + cats.length);
  console.log('Products upserted   : ' + prodOk);
  console.log('Variants inserted   : ' + varOk);
  console.log('Variants updated    : ' + varSkipped);
  console.log('Conflicts skipped   : ' + skip.size);
  console.log('Errors              : ' + errs);
  if (conflicts.length > 0) {
    console.log('');
    console.log('ACTION REQUIRED - Owner must verify before import:');
    conflicts.forEach(function(c) {
      console.log('  ' + c.slug + ' (cat:' + c.cat + ')');
      c.ul.forEach(function(v) { console.log('    "' + v.orig + '" @INR' + v.price); });
    });
  }
}
run().catch(function(e){ console.error('FATAL:', e); process.exit(1); });
