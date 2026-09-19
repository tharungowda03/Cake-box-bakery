import type { ShowcaseSlide } from '../types';
import { API_BASE } from './apiService';

export const FALLBACK_SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: 'hero-slide-1',
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
    id: 'hero-slide-2',
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
    id: 'hero-slide-3',
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
    id: 'hero-slide-4',
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

export const showcaseService = {
  /**
   * Fetch active homepage showcase slides.
   * Prioritizes live database content from /api/showcase;
   * seamlessly falls back to curated local brand slides on any network error.
   */
  async getShowcaseSlides(): Promise<ShowcaseSlide[]> {
    try {
      const res = await fetch(`${API_BASE}/showcase`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch {
      // Gracefully fall back to local curated slides
    }
    return FALLBACK_SHOWCASE_SLIDES;
  },
};
