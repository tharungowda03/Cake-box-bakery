-- Migration: 005_featured_rls_and_index.sql
-- Purpose: Add composite performance index for featured product queries,
--          and document RLS security intent for the is_featured column.
-- Requires: 004_catalogue_enhancements.sql (which added is_featured column)

-- 1. Composite index for efficient home page and catalogue featured queries
CREATE INDEX IF NOT EXISTS idx_products_featured_availability
ON public.products (is_featured, availability);

-- 2. Security documentation:
-- is_featured is an OWNER-controlled field.
-- RLS on public.products:
--   Customers: SELECT only (Public read products policy, WHERE availability != 'HIDDEN')
--   Customers: NO INSERT / UPDATE / DELETE policies exist
--   Owner: Full access via Owner full access products policy
-- Therefore, a customer CANNOT set is_featured = true.
-- This is enforced at the database RLS level, not just the frontend.

COMMENT ON COLUMN public.products.is_featured
IS 'Owner-controlled feature flag for homepage Popular Picks section. Only the OWNER role can update this field via the authenticated server API. Customer RLS policies grant SELECT only — no customer can write to this column.';
