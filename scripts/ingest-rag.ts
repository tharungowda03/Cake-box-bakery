/**
 * scripts/ingest-rag.ts
 *
 * RAG ingestion script for Cake Box Kakinada.
 *
 * Reads:
 *   - data/Cake_Box_Kakinada_Ecommerce_Master_Information.docx  → business info / policies / FAQs
 *   - data/Cake_Box_Kakinada_Menu.xlsx                          → product/category reference text
 *
 * Chunks text, embeds with Gemini gemini-embedding-2 (768 dimensions), and upserts into rag_knowledge_base.
 *
 * USAGE:
 *   npx tsx scripts/ingest-rag.ts
 *
 * Prerequisites:
 *   1. Migration 003_rag_knowledge_base.sql must be applied to the Supabase database first.
 *   2. .env at project root must contain SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY.
 *
 * This script is idempotent — it deletes all existing chunks for each source before re-inserting.
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// ─── Load env from project root ──────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error(`[Ingest] .env not found at ${envPath}`);
  process.exit(1);
}
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error('[Ingest] Missing required environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChunkToInsert {
  source: string;
  chunk_type: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Split text into overlapping chunks of ~maxWords words.
 */
function chunkText(text: string, maxWords = 250, overlapWords = 30): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const end = Math.min(i + maxWords, words.length);
    const chunk = words.slice(i, end).join(' ').trim();
    if (chunk.length > 40) {
      chunks.push(chunk);
    }
    i += maxWords - overlapWords;
  }
  return chunks;
}

/**
 * Rate-limited embedding with retry.
 */
async function embedWithRetry(text: string, attempt = 1): Promise<number[]> {
  try {
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });

    const values = result.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      throw new Error('Gemini embedding returned empty values.');
    }
    return values;
  } catch (err: any) {
    if (attempt < 4) {
      const delay = attempt * 2000;
      console.warn(`\n[Ingest] Embedding failed (attempt ${attempt}), retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      return embedWithRetry(text, attempt + 1);
    }
    throw err;
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Document Parsers ─────────────────────────────────────────────────────────

async function parseDocx(filePath: string): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

function parseXlsx(filePath: string): string {
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(filePath);
  const lines: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    lines.push(`=== Sheet: ${sheetName} ===`);
    for (const row of rows) {
      const clean = row.map((c: any) => String(c).trim()).filter(Boolean);
      if (clean.length > 0) {
        lines.push(clean.join(' | '));
      }
    }
  }

  return lines.join('\n');
}

// ─── Ingestion Logic ──────────────────────────────────────────────────────────

async function deleteExistingChunks(source: string) {
  const { error } = await supabase
    .from('rag_knowledge_base')
    .delete()
    .eq('source', source);

  if (error) {
    throw new Error(`Failed to delete existing chunks for source "${source}": ${error.message}`);
  }
}

async function ingestSource(
  source: string,
  chunkType: string,
  rawText: string,
  metadata?: Record<string, any>
) {
  console.log(`\n[Ingest] Processing source: ${source}`);
  console.log(`[Ingest] Text length: ${rawText.length} chars`);

  // Delete existing to ensure idempotency
  await deleteExistingChunks(source);
  console.log(`[Ingest] Cleared existing chunks for ${source}`);

  // Chunk the text
  const chunks = chunkText(rawText, 250, 30);
  console.log(`[Ingest] Generated ${chunks.length} chunks`);

  // Embed and collect
  const toInsert: ChunkToInsert[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`\r[Ingest] Embedding chunk ${i + 1}/${chunks.length}...`);

    const embedding = await embedWithRetry(chunk);
    toInsert.push({
      source,
      chunk_type: chunkType,
      content: chunk,
      embedding,
      metadata: { ...metadata, chunk_index: i },
    });

    // Throttle to avoid rate limits (250ms between embeddings)
    await sleep(250);
  }
  console.log(`\n[Ingest] All chunks embedded for ${source}`);

  // Batch insert (25 at a time)
  const BATCH = 25;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error } = await supabase.from('rag_knowledge_base').insert(batch);
    if (error) {
      throw new Error(`[Ingest] Insert batch failed: ${error.message}`);
    }
    inserted += batch.length;
    console.log(`[Ingest] Inserted ${inserted}/${toInsert.length} chunks`);
  }

  console.log(`[Ingest] ✅ ${source}: ${toInsert.length} chunks ingested`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Cake Box Kakinada — RAG Ingestion ===');
  console.log('Supabase URL:', SUPABASE_URL);

  const dataDir = path.resolve(__dirname, '../data');

  // 1. Ingest master information docx
  const docxPath = path.join(dataDir, 'Cake_Box_Kakinada_Ecommerce_Master_Information.docx');
  if (!fs.existsSync(docxPath)) {
    console.error(`[Ingest] DOCX not found: ${docxPath}`);
  } else {
    const docxText = await parseDocx(docxPath);
    await ingestSource(
      'docx:master_info',
      'general',
      docxText,
      { file: 'Cake_Box_Kakinada_Ecommerce_Master_Information.docx' }
    );
  }

  // 2. Ingest menu xlsx
  const xlsxPath = path.join(dataDir, 'Cake_Box_Kakinada_Menu.xlsx');
  if (!fs.existsSync(xlsxPath)) {
    console.error(`[Ingest] XLSX not found: ${xlsxPath}`);
  } else {
    const xlsxText = parseXlsx(xlsxPath);
    await ingestSource(
      'xlsx:menu',
      'product',
      xlsxText,
      { file: 'Cake_Box_Kakinada_Menu.xlsx' }
    );
  }

  // Final count
  const { count } = await supabase
    .from('rag_knowledge_base')
    .select('*', { count: 'exact', head: true });

  console.log(`\n=== Ingestion complete. Total chunks in DB: ${count ?? 'unknown'} ===`);
}

main().catch(err => {
  console.error('\n[Ingest] Fatal error:', err);
  process.exit(1);
});
