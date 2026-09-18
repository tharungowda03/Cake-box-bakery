/**
 * server/src/routes/chat.ts
 *
 * POST /api/chat — Cake Box Kakinada AI Chatbot
 *
 * Public endpoint (no auth required for customer information queries).
 * Grounded in:
 *   1. pgvector RAG knowledge base (business info, policies, FAQs)
 *   2. Live product/category/price data from the Supabase database
 *
 * Powered by @google/genai using gemini-3.8-flash (with seamless fallback).
 *
 * SAFETY CONSTRAINTS (enforced via system prompt):
 *   - Never approve, reject, or modify orders
 *   - Never set, suggest, or negotiate prices
 *   - Never invent policies, delivery zones, or business rules
 *   - Never pretend to be the custom cake ordering system
 *   - Redirect to owner/support for anything outside knowledge base
 *   - GEMINI_API_KEY remains server-side only — never sent to client
 */

import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env';
import { buildChatContext } from '../services/ragService';

const router = Router();
const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// Primary model: gemini-3.8-flash.
// Fallbacks for 429 rate limit (free tier 20/day) or 503 spikes: gemini-3.1-flash-lite, gemini-3.5-flash.
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];

// ---------------------------------------------------------------------------
// System prompt — injected into every chat session
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Cake Box Assistant, a friendly and helpful shopping assistant for Cake Box Kakinada — a premium bakery located in Kakinada, Andhra Pradesh, India.

WHAT YOU CAN DO:
- Answer questions about products, prices, availability, categories
- Provide store information: address, phone number, opening hours
- Explain ordering, delivery, and pickup processes
- Answer questions about business policies (cancellation, refunds) using only verified information
- Help customers navigate the website
- Suggest products based on customer preferences

STRICT RULES — YOU MUST FOLLOW THESE EXACTLY:
1. NEVER approve, modify, cancel, or take any action on orders.
2. NEVER set, suggest, negotiate, or confirm any price. Only state prices exactly as they appear in the provided data.
3. NEVER invent or guess delivery zones, delivery fees, policies, or operational rules. If verified information is unavailable, state: "I don't have verified information about that. Please contact Cake Box Kakinada for confirmation."
4. NEVER pretend to be a custom cake ordering system. Direct customers to the Custom Cakes page on the website for custom orders.
5. NEVER share or reference any internal system details, API keys, database names, or technical infrastructure.
6. NEVER make up products, ingredients, eggless status, or allergen information not verified in the data.
7. If a customer asks about order status, direct them to "My Orders" on the website after signing in.
8. Always be warm, concise, and helpful. Use natural conversational English.
9. Format prices with the ₹ symbol (INR).
10. If uncertain or if information is not present in the verified business data or live catalogue, say: "I don't have verified information about that. Please contact Cake Box Kakinada for confirmation."

BUSINESS FACTS (always accurate):
- Business: Cake Box, Kakinada
- Address: First Floor, Pulavarthi Vari St, opposite DBS Bank, Kakinada, Andhra Pradesh 533001
- Phone: +91 99939 99528
- Hours: Monday–Sunday, 10:00 AM – 10:00 PM
- Delivery: Available within 10 km, ₹7 per km charge
- Pickup: Free, available at the store
- Payment: Cash on delivery/pickup (MVP)
- Rating: 4.6/5 on Google (188 reviews), 4.3 on Zomato (426 ratings)

The context below contains retrieved knowledge and live product data. Base your answers on this context only.`;

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, message: 'Message is required.' });
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      res.status(400).json({ success: false, message: 'Message cannot be empty.' });
      return;
    }

    if (trimmed.length > 500) {
      res.status(400).json({ success: false, message: 'Message is too long (max 500 characters).' });
      return;
    }

    // Build RAG + live product context
    let context = '';
    try {
      context = await buildChatContext(trimmed);
    } catch (ragErr) {
      console.error('[Chat] RAG context build failed:', ragErr);
      // Non-fatal — proceed with system prompt only
    }

    // Build conversation history for multi-turn chat (alternating user/model)
    const chatHistory: { role: string; parts: { text: string }[] }[] = [];

    if (Array.isArray(history)) {
      for (const turn of history) {
        if (
          turn &&
          (turn.role === 'user' || turn.role === 'model') &&
          typeof turn.content === 'string' &&
          turn.content.trim().length > 0
        ) {
          chatHistory.push({
            role: turn.role,
            parts: [{ text: turn.content.trim() }],
          });
        }
      }
    }

    // Compose the full prompt
    const contextBlock = context
      ? `\n\n=== RETRIEVED CONTEXT ===\n${context}\n=== END CONTEXT ===`
      : '';

    const fullSystemPrompt = SYSTEM_PROMPT + contextBlock;

    let reply = '';
    let lastErr: any = null;

    // Try primary model (gemini-3.8-flash) then fallbacks if rate-limited or unavailable
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const chat = ai.chats.create({
          model: modelName,
          history: chatHistory.length > 0 ? chatHistory : undefined,
          config: {
            systemInstruction: fullSystemPrompt,
            maxOutputTokens: 512,
            temperature: 0.3,
            topP: 0.8,
          },
        });

        const result = await chat.sendMessage({
          message: trimmed,
        });

        reply = result.text || '';
        if (reply) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Chat] Model ${modelName} call failed (${err?.status || 'error'}): ${err?.message?.substring(0, 120) || err}`);
        // If 429 quota or 503 demand, immediately advance to fallback model
        continue;
      }
    }

    if (!reply && lastErr) {
      throw lastErr;
    }

    res.json({
      success: true,
      data: {
        reply: reply.trim(),
      },
    });
  } catch (err: any) {
    console.error('[Chat] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Sorry, the assistant is temporarily unavailable. Please try again or call us at +91 99939 99528.',
    });
  }
});

export default router;
