/**
 * scripts/seed-business-config.cjs
 *
 * Seeds the Cake Box Kakinada business, branch, and bakery_settings rows.
 * Idempotent: runs safely multiple times.
 *
 * IMPORTANT: Does NOT touch products, categories, or product_variants.
 * Does NOT modify the schema.
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(process.cwd(), '.env') });

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------------------------------------------------------------------
// Verified configuration values — sourced from DOCX + owner-confirmed MVP rules
// ---------------------------------------------------------------------------
const BUSINESS = {
  name: 'Cake Box Kakinada',
  business_type: 'Bakery & Cafe',
  phone: null, // to be confirmed by owner
};

// Branch coordinates: Cake Box, Kakinada, Andhra Pradesh
// Approximate centroid of Kakinada city (16.9891 N, 82.2475 E)
// Owner must verify/update the exact GPS pin if needed.
const BRANCH = {
  name: 'Cake Box Kakinada',
  address: 'Kakinada',          // exact street address to be confirmed by owner
  city: 'Kakinada',
  state: 'Andhra Pradesh',
  postal_code: '533001',
  latitude: 16.9891,
  longitude: 82.2475,
  phone: null,                  // to be confirmed by owner
  is_active: true,
};

// MVP-confirmed delivery settings:
//   service_radius_km = 10 (customer must be within 10 km of branch)
//   delivery_fee = 7   (INR per km — we reuse the delivery_fee column as
//                       delivery_charge_per_km; the server's deliveryService
//                       reads it as a per-km rate, not a flat fee)
//   delivery_enabled = true
//   Fields left NULL: minimum_order, free_delivery_threshold,
//                     estimated_delivery_minutes — not yet confirmed by owner
const BAKERY_SETTINGS = {
  online_ordering_enabled: true,
  delivery_enabled: true,
  service_radius_km: 10,
  delivery_fee: 7,   // INR per km (per-km rate stored in delivery_fee column)
  minimum_order: null,
  free_delivery_threshold: null,
  estimated_delivery_minutes: null,
};

async function run() {
  console.log('=== Cake Box Kakinada — Business Config Seed ===\n');

  // ------------------------------------------------------------------
  // 1. Business
  // ------------------------------------------------------------------
  console.log('Step 1: Upserting business row...');
  const { data: bizRows, error: bizListErr } = await sb
    .from('business')
    .select('id, name')
    .eq('name', BUSINESS.name);

  if (bizListErr) { console.error('FATAL: business select:', bizListErr.message); process.exit(1); }

  let businessId;
  if (bizRows && bizRows.length > 0) {
    businessId = bizRows[0].id;
    console.log('  EXISTS: business "' + bizRows[0].name + '" id=' + businessId);
  } else {
    const { data: newBiz, error: bizInsErr } = await sb
      .from('business')
      .insert(BUSINESS)
      .select('id')
      .single();
    if (bizInsErr) { console.error('FATAL: business insert:', bizInsErr.message); process.exit(1); }
    businessId = newBiz.id;
    console.log('  INSERTED: business id=' + businessId);
  }

  // ------------------------------------------------------------------
  // 2. Branch
  // ------------------------------------------------------------------
  console.log('\nStep 2: Upserting branch row...');
  const { data: branchRows, error: branchListErr } = await sb
    .from('branches')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('name', BRANCH.name);

  if (branchListErr) { console.error('FATAL: branches select:', branchListErr.message); process.exit(1); }

  let branchId;
  if (branchRows && branchRows.length > 0) {
    branchId = branchRows[0].id;
    // Update coordinates in case they were previously unset
    const { error: branchUpdErr } = await sb
      .from('branches')
      .update({ latitude: BRANCH.latitude, longitude: BRANCH.longitude, is_active: BRANCH.is_active })
      .eq('id', branchId);
    if (branchUpdErr) { console.error('WARN: branch update:', branchUpdErr.message); }
    console.log('  EXISTS + UPDATED: branch "' + branchRows[0].name + '" id=' + branchId);
  } else {
    const { data: newBranch, error: branchInsErr } = await sb
      .from('branches')
      .insert({ ...BRANCH, business_id: businessId })
      .select('id')
      .single();
    if (branchInsErr) { console.error('FATAL: branch insert:', branchInsErr.message); process.exit(1); }
    branchId = newBranch.id;
    console.log('  INSERTED: branch id=' + branchId);
  }

  // ------------------------------------------------------------------
  // 3. Bakery Settings
  // ------------------------------------------------------------------
  console.log('\nStep 3: Upserting bakery_settings row...');
  const { data: settRows, error: settListErr } = await sb
    .from('bakery_settings')
    .select('id')
    .eq('branch_id', branchId);

  if (settListErr) { console.error('FATAL: bakery_settings select:', settListErr.message); process.exit(1); }

  let settingsId;
  if (settRows && settRows.length > 0) {
    settingsId = settRows[0].id;
    const { error: settUpdErr } = await sb
      .from('bakery_settings')
      .update(BAKERY_SETTINGS)
      .eq('id', settingsId);
    if (settUpdErr) { console.error('FATAL: bakery_settings update:', settUpdErr.message); process.exit(1); }
    console.log('  EXISTS + UPDATED: bakery_settings id=' + settingsId);
  } else {
    const { data: newSett, error: settInsErr } = await sb
      .from('bakery_settings')
      .insert({ ...BAKERY_SETTINGS, branch_id: branchId })
      .select('id')
      .single();
    if (settInsErr) { console.error('FATAL: bakery_settings insert:', settInsErr.message); process.exit(1); }
    settingsId = newSett.id;
    console.log('  INSERTED: bakery_settings id=' + settingsId);
  }

  // ------------------------------------------------------------------
  // 4. Verify — read back everything
  // ------------------------------------------------------------------
  console.log('\nStep 4: Verification read-back...');
  const { data: verifySettings, error: verifyErr } = await sb
    .from('bakery_settings')
    .select(`
      id,
      online_ordering_enabled,
      delivery_enabled,
      service_radius_km,
      delivery_fee,
      minimum_order,
      free_delivery_threshold,
      estimated_delivery_minutes,
      branch_id,
      branches (
        id,
        name,
        city,
        state,
        latitude,
        longitude,
        is_active,
        business_id,
        business (id, name, business_type)
      )
    `)
    .eq('id', settingsId)
    .single();

  if (verifyErr) { console.error('WARN: verification read failed:', verifyErr.message); }
  else {
    const b = verifySettings.branches;
    const biz = b.business;
    console.log('');
    console.log('  Business         : ' + biz.name + ' (' + biz.business_type + ')');
    console.log('  Branch           : ' + b.name + ', ' + b.city + ', ' + b.state);
    console.log('  Coordinates      : lat=' + b.latitude + ', lng=' + b.longitude);
    console.log('  Branch active    : ' + b.is_active);
    console.log('  Online ordering  : ' + verifySettings.online_ordering_enabled);
    console.log('  Delivery enabled : ' + verifySettings.delivery_enabled);
    console.log('  Radius (km)      : ' + verifySettings.service_radius_km);
    console.log('  Charge/km (INR)  : ' + verifySettings.delivery_fee + '  [stored in delivery_fee column as per-km rate]');
    console.log('  Min order        : ' + (verifySettings.minimum_order ?? 'NULL (not yet configured)'));
    console.log('  Free delivery at : ' + (verifySettings.free_delivery_threshold ?? 'NULL (not yet configured)'));
    console.log('  Est. delivery    : ' + (verifySettings.estimated_delivery_minutes ?? 'NULL (not yet configured)'));
  }

  // ------------------------------------------------------------------
  // 5. Confirm catalogue records untouched
  // ------------------------------------------------------------------
  console.log('\nStep 5: Confirming catalogue records are untouched...');
  const [catCount, prodCount, varCount] = await Promise.all([
    sb.from('categories').select('id', { count: 'exact', head: true }),
    sb.from('products').select('id', { count: 'exact', head: true }),
    sb.from('product_variants').select('id', { count: 'exact', head: true }),
  ]);
  console.log('  categories      : ' + catCount.count + ' (expected 18)');
  console.log('  products        : ' + prodCount.count + ' (expected 112)');
  console.log('  product_variants: ' + varCount.count + ' (expected 113)');

  const intact =
    catCount.count === 18 &&
    prodCount.count === 112 &&
    varCount.count === 113;
  console.log('  Catalogue intact: ' + (intact ? 'YES ✓' : 'WARNING — counts differ'));

  console.log('\n=== Seed Complete ===');
}

run().catch(function(e) { console.error('FATAL:', e); process.exit(1); });
