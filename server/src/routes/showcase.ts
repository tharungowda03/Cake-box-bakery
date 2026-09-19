import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

export const DEFAULT_SHOWCASE_SLIDES = [
  {
    id: 'default-slide-1',
    image_url: '/images/showcase/hero_signature_cake.jpg',
    storage_path: 'hero_signature_cake.jpg',
    eyebrow: 'CAKE BOX · KAKINADA',
    title: 'Made for the moments that matter.',
    subtitle: 'Freshly baked handcrafted cakes prepared daily with premium ingredients at our Kakinada bakery.',
    highlight_word: 'moments',
    cta_label: 'Explore Menu',
    cta_link: '/menu',
    secondary_cta_label: 'Custom Cake',
    secondary_cta_link: '/custom-cake',
    display_order: 0,
    is_active: true,
  },
  {
    id: 'default-slide-2',
    image_url: '/images/showcase/hero_dessert_assortment.jpg',
    storage_path: 'hero_dessert_assortment.jpg',
    eyebrow: 'ARTISANAL DELIGHTS',
    title: 'Indulgence in every delicate layer.',
    subtitle: 'Gourmet mousses, tarts, and dessert creations to sweeten celebrations and everyday moments.',
    highlight_word: 'delicate',
    cta_label: 'Explore Menu',
    cta_link: '/menu',
    secondary_cta_label: 'Custom Cake',
    secondary_cta_link: '/custom-cake',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'default-slide-3',
    image_url: '/images/showcase/hero_pastry_craft.jpg',
    storage_path: 'hero_pastry_craft.jpg',
    eyebrow: 'FRESH FROM OUR KITCHEN',
    title: 'Artisanal bakes straight from the oven.',
    subtitle: 'Golden-baked pastries, rich croissants, and savory bakes crafted with dedication and warmth.',
    highlight_word: 'Artisanal',
    cta_label: 'Explore Menu',
    cta_link: '/menu',
    secondary_cta_label: 'Custom Cake',
    secondary_cta_link: '/custom-cake',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'default-slide-4',
    image_url: '/images/showcase/hero_celebration_custom.jpg',
    storage_path: 'hero_celebration_custom.jpg',
    eyebrow: 'CUSTOM CELEBRATIONS',
    title: 'Every celebration deserves a bespoke cake.',
    subtitle: 'Handcrafted multi-tiered cakes tailored to your theme, occasion, and favorite flavors.',
    highlight_word: 'celebration',
    cta_label: 'Custom Cake',
    cta_link: '/custom-cake',
    secondary_cta_label: 'Explore Menu',
    secondary_cta_link: '/menu',
    display_order: 3,
    is_active: true,
  },
];

// GET /api/showcase - Public: Get active showcase slides
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('home_showcase_images')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      // Graceful fallback if table is not yet migrated or empty
      res.json({
        success: true,
        data: DEFAULT_SHOWCASE_SLIDES,
        source: 'default_fallback',
      });
      return;
    }

    res.json({
      success: true,
      data,
      source: 'database',
    });
  } catch (err: any) {
    res.json({
      success: true,
      data: DEFAULT_SHOWCASE_SLIDES,
      source: 'default_fallback_on_error',
    });
  }
});

export default router;
