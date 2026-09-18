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
      `);

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
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return (data || []) as Product[];
  }
};
