import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  const tables = [
    'business', 'branches', 'business_hours', 'categories', 'products', 
    'product_variants', 'product_images', 'profiles', 'addresses', 
    'bakery_settings', 'orders', 'order_items', 'custom_orders'
  ];
  
  console.log("1. Verifying Tables:");
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`[ ] Table ${table} error: ${error.message}`);
    } else {
      console.log(`[x] Table ${table} exists`);
    }
  }

  console.log("\n2. Verifying Storage Buckets:");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.log(`Error fetching buckets: ${bucketsError.message}`);
  } else {
    const bucketNames = buckets.map(b => b.name);
    console.log(`[x] product-images: ${bucketNames.includes('product-images')}`);
    console.log(`[x] custom-cake-references: ${bucketNames.includes('custom-cake-references')}`);
  }
}

verify();
