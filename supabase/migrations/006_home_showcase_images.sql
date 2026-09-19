-- Migration: 006_home_showcase_images.sql
-- Purpose: Create independent showcase image configuration for the homepage hero.
-- Completely decoupled from public.product_images to preserve catalogue integrity.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.home_showcase_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    storage_path TEXT,
    eyebrow TEXT DEFAULT 'CAKE BOX · KAKINADA',
    title TEXT NOT NULL,
    subtitle TEXT,
    highlight_word TEXT,
    cta_label TEXT DEFAULT 'Explore Menu',
    cta_link TEXT DEFAULT '/menu',
    secondary_cta_label TEXT DEFAULT 'Custom Cake',
    secondary_cta_link TEXT DEFAULT '/custom-cake',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast ordering & retrieval
CREATE INDEX IF NOT EXISTS idx_showcase_active_order 
ON public.home_showcase_images (is_active, display_order);

-- 3. Enable RLS
ALTER TABLE public.home_showcase_images ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Public (and anonymous visitors): Can read active showcase slides only
CREATE POLICY "Public read active showcase images" 
ON public.home_showcase_images 
FOR SELECT 
USING (is_active = true);

-- Owner: Full CRUD access
CREATE POLICY "Owner full access showcase images" 
ON public.home_showcase_images 
FOR ALL 
USING (public.get_auth_role() = 'OWNER');

-- 5. Seed initial curated showcase records (referencing local static showcase assets)
INSERT INTO public.home_showcase_images (
    image_url,
    storage_path,
    eyebrow,
    title,
    subtitle,
    highlight_word,
    cta_label,
    cta_link,
    secondary_cta_label,
    secondary_cta_link,
    display_order,
    is_active
) VALUES 
(
    '/images/showcase/hero_signature_cake.jpg',
    'hero_signature_cake.jpg',
    'CAKE BOX · KAKINADA',
    'Made for the moments that matter.',
    'Freshly baked handcrafted cakes prepared daily with premium ingredients at our Kakinada bakery.',
    'moments',
    'Explore Menu',
    '/menu',
    'Custom Cake',
    '/custom-cake',
    0,
    true
),
(
    '/images/showcase/hero_dessert_assortment.jpg',
    'hero_dessert_assortment.jpg',
    'ARTISANAL DELIGHTS',
    'Indulgence in every delicate layer.',
    'Gourmet mousses, tarts, and dessert creations to sweeten celebrations and everyday moments.',
    'delicate',
    'Explore Menu',
    '/menu',
    'Custom Cake',
    '/custom-cake',
    1,
    true
),
(
    '/images/showcase/hero_pastry_craft.jpg',
    'hero_pastry_craft.jpg',
    'FRESH FROM OUR KITCHEN',
    'Artisanal bakes straight from the oven.',
    'Golden-baked pastries, rich croissants, and savory bakes crafted with dedication and warmth.',
    'Artisanal',
    'Explore Menu',
    '/menu',
    'Custom Cake',
    '/custom-cake',
    2,
    true
),
(
    '/images/showcase/hero_celebration_custom.jpg',
    'hero_celebration_custom.jpg',
    'CUSTOM CELEBRATIONS',
    'Every celebration deserves a bespoke cake.',
    'Handcrafted multi-tiered cakes tailored to your theme, occasion, and favorite flavors.',
    'celebration',
    'Custom Cake',
    '/custom-cake',
    'Explore Menu',
    '/menu',
    3,
    true
)
ON CONFLICT DO NOTHING;
