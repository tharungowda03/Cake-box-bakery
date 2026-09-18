/**
 * server/src/services/ragService.ts
 *
 * RAG (Retrieval-Augmented Generation) service for the Cake Box Kakinada chatbot.
 *
 * Responsibilities:
 *   1. Embed text using Gemini gemini-embedding-2 (768-dim vectors).
 *   2. Perform pgvector similarity search against rag_knowledge_base.
 *   3. Fetch live product context from the database for real-time accuracy.
 *
 * SAFETY RULES:
 *   - This module NEVER generates final answers — it only retrieves context.
 *   - Price and availability data is ALWAYS fetched live from the DB (not from chunks).
 *   - The GEMINI_API_KEY is used server-side only and never exposed to clients.
 */

import { GoogleGenAI } from '@google/genai';
import { supabase } from '../config/supabase';
import { config } from '../config/env';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnowledgeChunk {
  id: string;
  source: string;
  chunk_type: string;
  content: string;
  metadata: Record<string, any> | null;
  similarity?: number;
}

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

/**
 * Embed a text string using Gemini gemini-embedding-2.
 * Returns a 768-dimensional float array.
 */
export async function embedText(text: string): Promise<number[]> {
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });

  const values = result.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error('Gemini embedding failed to return vector values.');
  }

  return values;
}

// ---------------------------------------------------------------------------
// Knowledge Base Search
// ---------------------------------------------------------------------------

/**
 * Search the rag_knowledge_base using cosine similarity.
 * Returns the top-K most relevant chunks.
 */
export async function searchKnowledgeBase(
  embedding: number[],
  topK = 5
): Promise<KnowledgeChunk[]> {
  // pgvector RPC call using the <=> cosine distance operator
  const { data, error } = await supabase.rpc('match_rag_chunks', {
    query_embedding: embedding,
    match_count: topK,
  });

  if (error) {
    console.error('[RAG] pgvector search error:', error);
    return [];
  }

  return (data || []) as KnowledgeChunk[];
}

// ---------------------------------------------------------------------------
// Live Product Context
// ---------------------------------------------------------------------------

/**
 * Fetches live product/category context from the database.
 * This ensures prices and availability are always current — not from stale chunks.
 *
 * Returns a formatted string summary ready for LLM injection.
 */
export async function getLiveProductContext(userQuery: string): Promise<string> {
  try {
    // Fetch all available products with variants and categories
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        name,
        short_description,
        veg_status,
        eggless_status,
        availability,
        category:categories (name),
        product_variants (name, price, availability, weight, unit)
      `)
      .eq('availability', 'AVAILABLE')
      .order('name');

    if (error || !products) return '';

    // Build a compact text summary
    const lines: string[] = ['=== LIVE PRODUCT CATALOGUE (current prices from database) ==='];

    for (const p of products) {
      const cat = (p.category as any)?.name || 'Uncategorised';
      const variants = ((p.product_variants as any[]) || [])
        .filter(v => v.availability === 'AVAILABLE')
        .map(v => {
          const weight = v.weight ? ` ${v.weight}${v.unit || 'g'}` : '';
          return `${v.name}${weight}: ₹${v.price}`;
        });

      if (variants.length === 0) continue;

      const flags: string[] = [];
      if (p.veg_status) flags.push(p.veg_status);
      if (p.eggless_status) flags.push(`Eggless: ${p.eggless_status}`);
      const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';

      lines.push(`[${cat}] ${p.name}${flagStr}`);
      for (const v of variants) {
        lines.push(`  - ${v}`);
      }
    }

    return lines.join('\n');
  } catch (err) {
    console.error('[RAG] Live product context error:', err);
    return '';
  }
}

// ---------------------------------------------------------------------------
// Combined Context Builder
// ---------------------------------------------------------------------------

/**
 * Builds the full retrieval context for a chat query:
 *   1. Embeds the user query
 *   2. Searches the knowledge base for relevant chunks
 *   3. Fetches live product data (always authoritative for prices/availability)
 *
 * Returns a combined context string for injection into the system prompt.
 */
export async function buildChatContext(userQuery: string): Promise<string> {
  const contextParts: string[] = [];

  try {
    // 1. Semantic search over knowledge base
    const queryEmbedding = await embedText(userQuery);
    const chunks = await searchKnowledgeBase(queryEmbedding, 6);

    if (chunks.length > 0) {
      contextParts.push('=== KNOWLEDGE BASE (business information, policies, FAQs) ===');
      for (const chunk of chunks) {
        contextParts.push(chunk.content);
      }
    }
  } catch (err) {
    console.error('[RAG] Knowledge base search failed:', err);
    // Non-fatal — continue with live product data
  }

  // 2. Live product context (always included for product queries)
  const productContext = await getLiveProductContext(userQuery);
  if (productContext) {
    contextParts.push(productContext);
  }

  return contextParts.join('\n\n');
}
