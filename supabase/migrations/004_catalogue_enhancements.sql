-- Migration: 004_catalogue_enhancements.sql
-- Purpose: Add featured flags, data-backed offer pricing, and promotional metadata for products and variants.
-- Preserves existing approved catalogue and RLS policies.

-- 1. Add featured & offer fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_on_offer BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offer_price NUMERIC(10,2) CHECK (offer_price >= 0),
ADD COLUMN IF NOT EXISTS offer_label TEXT,
ADD COLUMN IF NOT EXISTS offer_start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS offer_end_at TIMESTAMPTZ;

-- 2. Add offer fields to product_variants
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS is_on_offer BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offer_price NUMERIC(10,2) CHECK (offer_price >= 0),
ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10,2) CHECK (compare_at_price >= 0);

-- 3. Indexes for fast catalogue filtering and sorting
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_on_offer ON public.products(is_on_offer);
CREATE INDEX IF NOT EXISTS idx_variants_is_on_offer ON public.product_variants(is_on_offer);
