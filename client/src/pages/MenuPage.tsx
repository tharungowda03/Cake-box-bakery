import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { catalogueService } from '../services/catalogueService';
import type { Product, Category } from '../types';
import { ProductCard } from '../components/catalogue/ProductCard';
import { CategoryFilter } from '../components/catalogue/CategoryFilter';
import { Spinner } from '../components/ui/Spinner';

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalogue() {
      try {
        const [cats, prods] = await Promise.all([
          catalogueService.getCategories(),
          catalogueService.getProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (e) {
        console.error('Error loading menu:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCatalogue();
  }, []);

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategory(id);
    if (id) {
      setSearchParams({ category: id });
    } else {
      setSearchParams({});
    }
  };

  // Filter products by search, category, and dietary preferences
  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.category_id !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.short_description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    if (vegOnly) {
      const isVeg =
        p.veg_status?.toLowerCase().includes('veg') &&
        !p.veg_status?.toLowerCase().includes('non');
      if (!isVeg) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif text-stone-900">
          Our Bakery Menu
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Explore all {products.length} authentic delicacies prepared by Cake Box Kakinada
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cakes, pastries, coolers, rolls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 text-stone-900"
          />
        </div>

        {/* Veg toggle & Quick Filter */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 select-none">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              Pure Vegetarian Only
            </span>
          </label>
        </div>
      </div>

      {/* Category Pills */}
      <CategoryFilter
        categories={categories}
        selectedCategoryId={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>Showing {filteredProducts.length} items</span>
        {selectedCategory && (
          <button
            onClick={() => handleSelectCategory(null)}
            className="text-amber-800 hover:underline font-semibold cursor-pointer"
          >
            Clear category filter
          </button>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-bold font-serif text-stone-800 mt-3">
            No products match your criteria
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or clearing your category filters.
          </p>
        </div>
      )}
    </div>
  );
};
