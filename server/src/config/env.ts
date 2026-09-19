import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Look for .env in current working directory and parent directories (for local development)
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
];

let loadedEnv = false;
for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedEnv = true;
    break;
  }
}

// In production environments (like Render), environment variables are provided
// directly by the platform into process.env without requiring a .env file on disk.
if (!loadedEnv) {
  dotenv.config();
}

const getEnv = (name: string, fallbackName?: string): string => {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}${fallbackName ? ` (or ${fallbackName})` : ''}. ` +
      `Please configure this in your Render dashboard environment variables.`
    );
  }
  return value;
};

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  supabaseUrl: getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL'),
  supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  geminiApiKey: getEnv('GEMINI_API_KEY'),
  frontendUrl: process.env.FRONTEND_URL,
};
