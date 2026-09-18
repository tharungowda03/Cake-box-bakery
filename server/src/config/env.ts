import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Determine the path to the root .env file
// __dirname will be either in src/config or dist/config
const isDist = __dirname.includes('dist');
const envPath = isDist 
  ? path.resolve(__dirname, '../../../.env') 
  : path.resolve(__dirname, '../../../.env'); // in both src/config and dist/config, we go up three levels (src/config -> src -> server -> root)

if (!fs.existsSync(envPath)) {
  console.warn(`[Env] Root .env file not found at ${envPath}`);
}

dotenv.config({ path: envPath });

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const config = {
  port: process.env.PORT || 3000,
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
};
