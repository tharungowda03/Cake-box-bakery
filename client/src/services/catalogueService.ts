import type { Category, Product } from '../types';
import { supabase } from '../lib/supabase';

export const catalogueService = {
  /**
   * Fetch all active categories sorted by display_order.
   */
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetch all public products with their variants and category.
   * RLS ensures HIDDEN products are never returned.
   */
  async getProducts(categoryId?: string): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories (*),
        product_variants (*),
        product_images (*)
      `)
      .neq('availability', 'HIDDEN')
      .order('name', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return (data || []) as Product[];
  },

  /**
   * Fetch a single product by slug or id with variants.
   */
  async getProductById(idOrSlug: string): Promise<Product | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories (*),
        product_variants (*),
        product_images (*)
      `)
      .neq('availability', 'HIDDEN');

    if (isUuid) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.single();
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data as Product;
  },

  /**
   * Search products by keyword
   */
  async searchProducts(searchTerm: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (*),
        product_variants (*),
        product_images (*)
      `)
      .neq('availability', 'HIDDEN')
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return (data || []) as Product[];
  },

  /**
   * Fetch owner-featured products for the Home page Popular Picks section.
   * Returns products where is_featured = true, availability = AVAILABLE,
   * and they have a valid product image, ordered by name (stable deterministic).
   * Limit: 8 products max.
   *
   * If no featured products exist, falls back to first 8 AVAILABLE products
   * that have images (for a clean "Explore Our Menu" experience).
   */
  async getFeaturedProducts(): Promise<{ products: Product[]; isFeatured: boolean }> {
    try {
      // Attempt to fetch owner-featured products
      const { data: featured, error: featErr } = await supabase
        .from('products')
        .select(`
          *,
          category:categories (*),
          product_variants (*),
          product_images (*)
        `)
        .eq('availability', 'AVAILABLE')
        .eq('is_featured', true)
        .order('name', { ascending: true })
        .limit(8);

      if (!featErr && featured && featured.length > 0) {
        // Filter to only those with a valid primary image
        const featuredWithImages = (featured || []).filter(
          (p: any) => p.product_images && p.product_images.length > 0
        ) as Product[];

        if (featuredWithImages.length > 0) {
          return { products: featuredWithImages, isFeatured: true };
        }
      }
    } catch (err) {
      console.warn('Could not query is_featured, falling back to top menu items:', err);
    }

    // Fallback: first 8 AVAILABLE products with images
    const { data: fallback, error: fallbackErr } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (*),
        product_variants (*),
        product_images (*)
      `)
      .eq('availability', 'AVAILABLE')
      .order('name', { ascending: true })
      .limit(24); // fetch more, filter by image presence

    if (fallbackErr) {
      console.error('Error fetching fallback products:', fallbackErr);
      throw fallbackErr;
    }

    const fallbackWithImages = (fallback || [])
      .filter((p: any) => p.product_images && p.product_images.length > 0)
      .slice(0, 8) as Product[];

    return { products: fallbackWithImages, isFeatured: false };
  },
};
