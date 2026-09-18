import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Truck, HeartHandshake, Award } from 'lucide-react';
import { catalogueService } from '../services/catalogueService';
import type { Product, Category } from '../types';
import { ProductCard } from '../components/catalogue/ProductCard';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods] = await Promise.all([
          catalogueService.getCategories(),
          catalogueService.getProducts(),
        ]);
        setCategories(cats);
        // Take up to 8 products as featured showcase
        setFeaturedProducts(prods.slice(0, 8));
      } catch (e) {
        console.error('Failed to load homepage data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white p-8 sm:p-14 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Handcrafted Bakery in Kakinada
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif tracking-tight leading-tight">
            Artisanal Bakes, Cakes & Celebrations.
          </h1>

          <p className="text-stone-300 text-base sm:text-lg leading-relaxed font-normal">
            Welcome to Cake Box Kakinada. Freshly baked cakes, gourmet pastries, and savory creations prepared with premium ingredients and delivered across Kakinada.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/menu">
              <Button size="lg" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                Explore Full Menu <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/custom-cake">
              <Button size="lg" variant="outline" className="text-white border-white/40 hover:bg-white/10">
                Design Custom Cake
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative backdrop glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* Highlights Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 text-sm">Fresh Local Delivery</h4>
            <p className="text-xs text-stone-500 mt-0.5">Delivered directly within 10 km in Kakinada</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 text-sm">Verified Menu</h4>
            <p className="text-xs text-stone-500 mt-0.5">18 categories and 112 verified bakery delicacies</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 text-sm">Custom Celebrations</h4>
            <p className="text-xs text-stone-500 mt-0.5">Themed birthday & wedding cakes on request</p>
          </div>
        </div>
      </section>

      {/* Category Pills Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif text-stone-900">Explore by Category</h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Browse our verified 18 bakery & cafe categories
            </p>
          </div>
          <Link
            to="/menu"
            className="text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.slice(0, 12).map((cat) => (
            <Link
              key={cat.id}
              to={`/menu?category=${cat.id}`}
              className="p-4 bg-white rounded-xl border border-stone-200/80 hover:border-amber-700/50 hover:shadow-xs transition-all text-center group"
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-amber-800 transition-colors">
                <span className="text-lg">🧁</span>
              </div>
              <span className="text-xs font-semibold text-stone-800 group-hover:text-amber-800 line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Bakes */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif text-stone-900">Featured Creations</h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Fresh bakes made daily at our Kakinada kitchen
            </p>
          </div>
          <Link
            to="/menu"
            className="text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            Browse Catalogue ({featuredProducts.length}+) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Custom Cake CTA Card */}
      <section className="bg-amber-100/60 border border-amber-200/80 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Have a special celebration?
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
            Order a Bespoke Custom Cake
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            Choose your theme, occasion, favorite flavor, and weight. Upload your reference image and get a tailored quote directly from our master baker.
          </p>
        </div>
        <Link to="/custom-cake" className="shrink-0">
          <Button size="lg" variant="primary" className="shadow-md">
            Submit Custom Cake Request
          </Button>
        </Link>
      </section>
    </div>
  );
};
