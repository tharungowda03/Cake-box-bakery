/**
 * import-menu.ts
 * Phase 3 — Idempotent Catalogue Import
 *
 * Rules:
 * 1. Implicit variants are only extracted when the source name contains
 *    explicit size/portion/quantity markers such as (500gms), [1 Scoop], - 6P.
 * 2. Single-price products with no variant marker get ONE variant row whose
 *    name equals the product name (never "Default", "Variant 1", etc.).
 * 3. Products with identical normalised names, no explicit variant markers,
 *    and conflicting prices are SKIPPED and logged for manual verification.
 * 4. All original Excel Item names are preserved in the source field.
 */

import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Variant pattern list — only explicit size/portion/count markers qualify
const VARIANT_PATTERNS = [
  { regex: /\(([^)]+)\)\s*$/, group: 1 },
  { regex: /\[([^\]]+)\]\s*$/, group: 1 },
  { regex: /\s+-\s+(\d+\s*(?:P|piece|pieces|stick|sticks|scoops?|scoop)?)\s*$/i, group: 1 },
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function extractVariant(originalName) {
  for (const { regex, group } of VARIANT_PATTERNS) {
    const match = originalName.match(regex);
    if (match) {
      const variantLabel = match[group].trim();
      const baseName = originalName.slice(0, match.index).trim();
      if (baseName.length > 0) return { baseName, variantLabel };
    }
  }
  return { baseName: originalName, variantLabel: null };
}

async function runImport() {
  console.log('Cake Box Kakinada - Phase 3 Catalogue Import\n');

  const excelPath = path.join(__dirname, '..', 'data', 'Cake_Box_Kakinada_Menu.xlsx');
  if (!fs.existsSync(excelPath)) { console.error('Excel not found: ' + excelPath); process.exit(1); }

  const workbook = xlsx.readFile(excelPath);
  const menuSheet = workbook.Sheets['Menu'];
  if (!menuSheet) { console.error("Sheet 'Menu' not found."); process.exit(1); }

  const rows = xlsx.utils.sheet_to_json(menuSheet);
  console.log('Source rows: ' + rows.length + '\n');

  // Build products map
  const productsMap = new Map();
  for (const row of rows) {
    const originalName = row.Item?.toString().trim();
    if (!originalName) continue;
    const price = Number(row['Price (INR)']);
    const category = row.Category?.toString().trim() || 'Uncategorised';
    const description = row.Description?.toString().trim() || '';
    const { baseName, variantLabel } = extractVariant(originalName);
    const slug = slugify(baseName);
    if (!productsMap.has(slug)) {
      productsMap.set(slug, { baseName, category, description, variants: [] });
    }
    productsMap.get(slug).variants.push({ originalName, price, variantLabel });
  }

  // Identify conflicts
  const slugsToSkip = new Set();
  const conflicts = new Map();
  for (const [slug, prod] of productsMap.entries()) {
    const unlabelled = prod.variants.filter(v => v.variantLabel === null);
    if (unlabelled.length > 1) {
      const uniquePrices = new Set(unlabelled.map(v => v.price));
      if (uniquePrices.size > 1) {
        slugsToSkip.add(slug);
        conflicts.set(slug, {
          names: unlabelled.map(v => v.originalName),
          prices: unlabelled.map(v => v.price),
          category: prod.category,
        });
      }
    }
  }

  const eligible = [...productsMap.entries()].filter(([s]) => !slugsToSkip.has(s));
  const totalVariants = eligible.reduce((sum, [, p]) => sum + p.variants.length, 0);

  console.log('Pre-Import Audit');
  console.log('  Total source rows   : ' + rows.length);
  console.log('  Products normalised : ' + productsMap.size);
  console.log('  Conflicts skipped   : ' + slugsToSkip.size);
  console.log('  Products to import  : ' + eligible.length);
  console.log('  Variant rows        : ' + totalVariants);
  console.log('');

  if (conflicts.size > 0) {
    console.log('CONFLICTS (require manual owner verification before import):');
    for (const [slug, c] of conflicts.entries()) {
      console.log('  slug: ' + slug + ' | category: ' + c.category);
      c.names.forEach((n, i) => console.log('    Row: "' + n + '" @ INR ' + c.prices[i]));
    }
    console.log('');
  }

  // Show inferred variants
  const withVariants = eligible.filter(([, p]) => p.variants.some(v => v.variantLabel !== null));
  if (withVariants.length > 0) {
    console.log('Inferred Variants (from explicit size/portion markers):');
    for (const [, prod] of withVariants) {
      prod.variants.filter(v => v.variantLabel !== null).forEach(v => {
        console.log('  "' + prod.baseName + '" -> variant "' + v.variantLabel + '" @ INR ' + v.price);
        console.log('    (source: "' + v.originalName + '")');
      });
    }
    console.log('');
  }

  // Upsert categories
  const eligibleCategories = [...new Set(eligible.map(([, p]) => p.category))];
  console.log('Upserting ' + eligibleCategories.length + ' categories...');
  const categoriesMap = new Map();

  for (let i = 0; i < eligibleCategories.length; i++) {
    const name = eligibleCategories[i];
    const slug = slugify(name);
    const { data, error } = await supabase
      .from('categories')
      .upsert({ name, slug, display_order: i, is_active: true }, { onConflict: 'slug' })
      .select('id')
      .single();
    if (error) { console.error('ERROR upserting category "' + name + '": ' + error.message); process.exit(1); }
    categoriesMap.set(name, data.id);
    console.log('  OK: ' + name);
  }
  console.log('');

  // Upsert products and variants
  console.log('Upserting ' + eligible.length + ' products...');
  let productsOk = 0, variantsOk = 0, errs = 0;

  for (const [slug, prod] of eligible) {
    const categoryId = categoriesMap.get(prod.category);
    if (!categoryId) {
      console.error('No category ID for "' + prod.category + '"');
      errs++;
      continue;
    }

    const originalNames = prod.variants.map(v => v.originalName).join(' | ');
    const sourceString = 'Cake Box Kakinada menu (original Excel name(s): ' + originalNames + ')';

    const { data: productData, error: productError } = await supabase
      .from('products')
      .upsert({
        category_id: categoryId,
        name: prod.baseName,
        slug,
        short_description: prod.description,
        currency: 'INR',
        availability: 'AVAILABLE',
        source: sourceString,
        last_verified: new Date().toISOString(),
      }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (productError) {
      console.error('ERROR product "' + prod.baseName + '": ' + productError.message);
      errs++;
      continue;
    }
    productsOk++;

    for (const v of prod.variants) {
      // RULE: No "Default"/"Variant N" labels.
      // If explicit variant label found (e.g. "1 Scoop", "500gms") -> use it.
      // If single-option product -> use the product base name itself.
      const variantName = v.variantLabel !== null ? v.variantLabel : prod.baseName;
      const variantType = v.variantLabel !== null ? 'Portion' : 'Standard';
      const variantSource = 'Cake Box Kakinada menu (original Excel name: "' + v.originalName + '")';

      const { error: variantError } = await supabase
        .from('product_variants')
        .upsert({
          product_id: productData.id,
          name: variantName,
          variant_type: variantType,
          price: v.price,
          availability: 'AVAILABLE',
          source: variantSource,
          last_verified: new Date().toISOString(),
        }, { onConflict: 'product_id,name' });

      if (variantError) {
        console.error('ERROR variant "' + variantName + '" for "' + prod.baseName + '": ' + variantError.message);
        errs++;
      } else {
        variantsOk++;
      }
    }
  }

  console.log('');
  console.log('Import Complete');
  console.log('  Categories : ' + eligibleCategories.length);
  console.log('  Products   : ' + productsOk);
  console.log('  Variants   : ' + variantsOk);
  console.log('  Skipped    : ' + slugsToSkip.size + ' (conflicts)');
  console.log('  Errors     : ' + errs);
  if (slugsToSkip.size > 0) {
    console.log('\nACTION REQUIRED: Owner must verify the following before they can be imported:');
    for (const [slug, c] of conflicts.entries()) {
      console.log('  ' + c.names.join(' / ') + ' (slug: ' + slug + ')');
    }
  }
}

runImport().catch(err => { console.error('Fatal:', err); process.exit(1); });
