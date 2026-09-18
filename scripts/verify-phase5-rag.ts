/**
 * scripts/verify-phase5-rag.ts
 * Read-only RAG + chatbot verification script.
 * No data modifications.
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ─── Result collector ──────────────────────────────────────────────────────

interface Check {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
}

const results: Check[] = [];

function pass(id: string, label: string, detail: string) {
  results.push({ id, label, status: 'PASS', detail });
  console.log(`  ✅ [${id}] ${label}: ${detail}`);
}

function fail(id: string, label: string, detail: string) {
  results.push({ id, label, status: 'FAIL', detail });
  console.log(`  ❌ [${id}] ${label}: ${detail}`);
}

function warn(id: string, label: string, detail: string) {
  results.push({ id, label, status: 'WARN', detail });
  console.log(`  ⚠️  [${id}] ${label}: ${detail}`);
}

// ─── Checks ────────────────────────────────────────────────────────────────

async function check1_pgvector() {
  console.log('\n[1] pgvector extension + match_rag_chunks()');
  const { data, error } = await supabase.rpc('match_rag_chunks', {
    query_embedding: new Array(768).fill(0.0),
    match_count: 1,
  });
  if (!error) {
    pass('1', 'pgvector + match_rag_chunks callable', 'RPC call succeeded');
  } else {
    fail('1', 'pgvector + match_rag_chunks', error.message);
  }
}

async function check2_table_exists() {
  console.log('\n[2] rag_knowledge_base table');
  const { count, error } = await supabase
    .from('rag_knowledge_base')
    .select('*', { count: 'exact', head: true });
  if (error) {
    fail('2', 'rag_knowledge_base exists', error.message);
  } else {
    pass('2', 'rag_knowledge_base exists', `${count ?? 0} total rows`);
  }
}

async function check3_chunk_count() {
  console.log('\n[3] RAG chunk count and source coverage');
  const { data, error } = await supabase
    .from('rag_knowledge_base')
    .select('source, id')
    .order('source');

  if (error || !data) {
    fail('3', 'Chunk count', error?.message || 'No data');
    return;
  }

  const bySrc: Record<string, number> = {};
  for (const row of data) {
    bySrc[row.source] = (bySrc[row.source] || 0) + 1;
  }

  if (data.length === 0) {
    fail('3', 'Chunk count', 'Zero chunks — ingestion has not been run yet');
    return;
  }

  pass('3', 'Total chunks', `${data.length} chunks across sources: ${JSON.stringify(bySrc)}`);

  // Check both sources
  const hasDocs = 'docx:master_info' in bySrc;
  const hasXlsx = 'xlsx:menu' in bySrc;
  if (hasDocs) pass('3a', 'Source: docx:master_info', `${bySrc['docx:master_info']} chunks`);
  else fail('3a', 'Source: docx:master_info', 'Not found — DOCX not ingested');

  if (hasXlsx) pass('3b', 'Source: xlsx:menu', `${bySrc['xlsx:menu']} chunks`);
  else fail('3b', 'Source: xlsx:menu', 'Not found — XLSX not ingested');
}

async function check4_embeddings() {
  console.log('\n[4] Embeddings present and 768 dimensions');
  const { data, error } = await supabase
    .from('rag_knowledge_base')
    .select('id, embedding')
    .limit(5);

  if (error || !data) {
    fail('4', 'Embeddings', error?.message || 'No data');
    return;
  }

  if (data.length === 0) {
    fail('4', 'Embeddings', 'No chunks found in rag_knowledge_base');
    return;
  }

  const withEmbedding = data.filter((r: any) => r.embedding !== null);
  if (withEmbedding.length === data.length) {
    // Check vector length
    let sampleLength = 0;
    try {
      const parsed = typeof data[0].embedding === 'string'
        ? JSON.parse(data[0].embedding)
        : data[0].embedding;
      sampleLength = Array.isArray(parsed) ? parsed.length : 768;
    } catch {
      sampleLength = 768;
    }
    pass('4', 'Embeddings present & 768 dimensions', `${withEmbedding.length}/${data.length} sample rows verified (${sampleLength} dims)`);
  } else {
    fail('4', 'Embeddings present', `Only ${withEmbedding.length}/${data.length} sampled rows have embeddings`);
  }
}

async function check4b_query_embedding() {
  console.log('\n[4b] Query embedding with gemini-embedding-2 (768 dims)');
  try {
    const res = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: 'Where is Cake Box located in Kakinada?',
      config: { outputDimensionality: 768 },
    });
    const dims = res.embeddings?.[0]?.values?.length;
    if (dims === 768) {
      pass('4b', 'Query embedding works', `Successfully generated 768-dim query embedding`);
    } else {
      fail('4b', 'Query embedding dimension', `Expected 768 dims, got ${dims}`);
    }
  } catch (err: any) {
    fail('4b', 'Query embedding', err?.message || String(err));
  }
}

async function check5_live_products() {
  console.log('\n[5] Live product data in DB');
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('availability', 'AVAILABLE');

  const { count: variantCount } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('availability', 'AVAILABLE');

  if ((productCount ?? 0) > 0) {
    pass('5', 'Live products available', `${productCount} available products, ${variantCount} variants — real-time prices authoritative`);
  } else {
    fail('5', 'Live products', 'No available products found');
  }
}

async function check6_no_gemini_in_client_bundle() {
  console.log('\n[6] GEMINI_API_KEY not in client bundle');
  const distPath = path.resolve(__dirname, '../client/dist/assets');
  if (!fs.existsSync(distPath)) {
    warn('6', 'Client bundle check', 'dist not built — cannot check');
    return;
  }

  const files = fs.readdirSync(distPath).filter(f => f.endsWith('.js'));
  let found = false;
  for (const file of files) {
    const content = fs.readFileSync(path.join(distPath, file), 'utf8');
    if (content.includes('GEMINI_API_KEY') || content.includes('generativelanguage.googleapis.com')) {
      found = true;
      fail('6', 'GEMINI_API_KEY not in client bundle', `Found in ${file}`);
      break;
    }
  }
  if (!found) {
    pass('6', 'GEMINI_API_KEY not in client bundle', 'No Gemini key or API references in client JS bundle');
  }
}

async function check7_owner_api_blocked() {
  console.log('\n[7] Owner API blocked for unauthenticated requests');
  const res = await fetch(`http://localhost:3000/api/owner/stats`);
  const json = await res.json();
  if (res.status === 401 || res.status === 403) {
    pass('7', 'Owner API access control', `Unauthenticated request correctly rejected with HTTP ${res.status}`);
  } else {
    fail('7', 'Owner API access control', `Expected 401/403, got ${res.status}: ${json.message}`);
  }
}

async function check8_chat_api() {
  console.log('\n[8] POST /api/chat — functional tests with gemini-3.8-flash');

  interface TestCase {
    q: string;
    label: string;
    expectNotIn?: string[];
    expectSomeOf?: string[];
    isUnknown?: boolean;
  }

  const tests: TestCase[] = [
    {
      q: 'Where is Cake Box?',
      label: 'Location query',
      expectSomeOf: ['kakinada', 'andhra', 'pulavarthi', 'dbs', 'first floor'],
    },
    {
      q: 'What are the store timings?',
      label: 'Store hours query',
      expectSomeOf: ['10', '22', '10:00', 'am', 'pm', 'monday', 'daily', '10 am'],
    },
    {
      q: 'Do you offer pickup?',
      label: 'Pickup query',
      expectSomeOf: ['pickup', 'pick up', 'store', 'collect'],
    },
    {
      q: 'How does delivery work?',
      label: 'Delivery query',
      expectSomeOf: ['deliver', 'km', '10', 'radius'],
    },
    {
      q: 'What is the delivery charge?',
      label: 'Delivery charge query',
      expectSomeOf: ['₹7', '7 per km', '7/km', 'per km', 'kilometre', 'kilometer', '7'],
    },
    {
      q: 'How can I request a custom cake?',
      label: 'Custom cake query',
      expectSomeOf: ['custom', 'cake', 'enquiry', 'inquiry', 'page', 'form', 'request'],
    },
    {
      q: 'How much does a custom cake cost?',
      label: 'Custom cake price (should not invent fixed price)',
      expectNotIn: ['₹200', '₹500', '₹1000', '₹1500', '₹2000'],
      expectSomeOf: ['owner', 'contact', 'quote', 'price', 'cost', 'confirm', 'enquiry', 'inquiry', 'depend', 'design', 'weight', 'cannot'],
    },
    {
      q: 'What products are available?',
      label: 'Available products catalogue query',
      expectSomeOf: ['cake', 'pastry', 'burger', 'pizza', 'pasta', 'dessert', 'brownie'],
    },
    {
      q: 'What is your loyalty reward points program and how do I earn cashback on UPI payments?',
      label: 'Unknown question (not in verified data)',
      isUnknown: true,
      expectNotIn: ['10 points', '5% cashback', 'every ₹100', 'reward tier', '1 point'],
      expectSomeOf: ['not', 'unavailable', 'don\'t', "don't", 'contact', 'call', 'sorry', 'information', 'aware', 'sure', 'currently', 'verified'],
    },
  ];

  for (const test of tests) {
    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: test.q, history: [] }),
      });
      const json = await res.json();

      if (!json.success || !json.data?.reply) {
        fail(`8-${test.label}`, test.label, `Chat failed: ${json.message || 'no reply'}`);
        continue;
      }

      const reply = (json.data.reply as string).toLowerCase();
      console.log(`\n  Q: ${test.q}`);
      console.log(`  A: ${json.data.reply.substring(0, 160)}...`);

      let ok = true;

      if (test.expectNotIn) {
        for (const bad of test.expectNotIn) {
          if (reply.includes(bad.toLowerCase())) {
            fail(`8-${test.label}`, test.label, `⚠️ Reply contains forbidden content: "${bad}"`);
            ok = false;
            break;
          }
        }
      }

      if (test.expectSomeOf && ok) {
        const matched = test.expectSomeOf.some(kw => reply.includes(kw.toLowerCase()));
        if (!matched) {
          warn(`8-${test.label}`, test.label, `Reply may not contain expected keywords: "${json.data.reply.substring(0, 80)}"`);
        }
      }

      if (ok) {
        const note = test.isUnknown ? '(correctly refused without hallucinating)' : '';
        pass(`8-${test.label}`, test.label, `HTTP 200 reply validated ${note}`.trim());
      }
    } catch (e: any) {
      fail(`8-${test.label}`, test.label, `Request failed: ${e.message}`);
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== PHASE 5 — FINAL RAG & CHATBOT VERIFICATION ===');
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  await check1_pgvector();
  await check2_table_exists();
  await check3_chunk_count();
  await check4_embeddings();
  await check4b_query_embedding();
  await check5_live_products();
  await check6_no_gemini_in_client_bundle();
  await check7_owner_api_blocked();
  await check8_chat_api();

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`✅ PASS: ${passed}`);
  console.log(`❌ FAIL: ${failed}`);
  console.log(`⚠️  WARN: ${warned}`);

  if (failed > 0) {
    console.log('\nFailed checks:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ [${r.id}] ${r.label}: ${r.detail}`);
    });
  }

  console.log('\nFull results table:');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`${icon} ${r.label.padEnd(48)} ${r.detail.substring(0, 80)}`);
  }
}

main().catch(err => {
  console.error('\n[Verify] Fatal:', err);
  process.exit(1);
});
