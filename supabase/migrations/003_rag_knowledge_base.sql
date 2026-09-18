-- Phase 5: RAG Knowledge Base
-- Requires pgvector extension (available on all Supabase projects)

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- RAG knowledge base table
-- Stores chunked text from business documents + embeddings
-- Embeddings use Gemini text-embedding-004 (768-dimensional)
CREATE TABLE public.rag_knowledge_base (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source      TEXT NOT NULL,           -- e.g. 'docx:master_info', 'xlsx:menu'
    chunk_type  TEXT NOT NULL,           -- e.g. 'policy', 'product', 'hours', 'contact', 'general'
    content     TEXT NOT NULL,           -- raw chunk text (used as context in LLM prompt)
    embedding   vector(768),             -- Gemini text-embedding-004 output
    metadata    JSONB,                   -- optional: page, section, product_name, category, etc.
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IVFFLAT index for approximate nearest-neighbour search
-- lists=100 is appropriate for up to ~10,000 rows
CREATE INDEX idx_rag_embedding ON public.rag_knowledge_base
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Index on source for efficient deletion during re-ingestion
CREATE INDEX idx_rag_source ON public.rag_knowledge_base (source);

-- RPC function for cosine similarity search
-- Called by the backend RAG service to find the most relevant knowledge chunks
CREATE OR REPLACE FUNCTION public.match_rag_chunks(
    query_embedding vector(768),
    match_count      INT DEFAULT 5
)
RETURNS TABLE (
    id          UUID,
    source      TEXT,
    chunk_type  TEXT,
    content     TEXT,
    metadata    JSONB,
    similarity  FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.source,
        r.chunk_type,
        r.content,
        r.metadata,
        1 - (r.embedding <=> query_embedding) AS similarity
    FROM public.rag_knowledge_base r
    WHERE r.embedding IS NOT NULL
    ORDER BY r.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Enable RLS
ALTER TABLE public.rag_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Service role (backend) has full access via supabase client with service_role key — no RLS needed for that
-- Frontend (anon/customer) has NO access to this table — chatbot API is server-side only
-- Owner can read for audit/debug
CREATE POLICY "Owner read rag_knowledge_base"
    ON public.rag_knowledge_base
    FOR SELECT
    USING (public.get_auth_role() = 'OWNER');

CREATE POLICY "Owner full access rag_knowledge_base"
    ON public.rag_knowledge_base
    FOR ALL
    USING (public.get_auth_role() = 'OWNER');
