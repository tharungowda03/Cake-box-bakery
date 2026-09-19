import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Truck,
  HeartHandshake,
  Award,
  Star,
  MapPin,
  Clock,
  MessageCircle,
  CheckCircle2,
  Cake,
} from 'lucide-react';
import { catalogueService } from '../services/catalogueService';
import { showcaseService } from '../services/showcaseService';
import type { Product, ShowcaseSlide } from '../types';
import { ProductCard } from '../components/catalogue/ProductCard';
import { HeroShowcaseSlider } from '../components/home/HeroShowcaseSlider';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const [slides, setSlides] = useState<ShowcaseSlide[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [showcaseSlides, { products, isFeatured: hasFeatured }] = await Promise.all([
          showcaseService.getShowcaseSlides(),
          catalogueService.getFeaturedProducts(),
        ]);
        setSlides(showcaseSlides);
        setPopularProducts(products);
        setIsFeatured(hasFeatured);
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
    <div className="space-y-16 lg:space-y-24">
      {/* 1. Premium Hero Showcase Slider */}
      <HeroShowcaseSlider slides={slides} />

      {/* 2. Brand Value Highlights Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-800 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 text-sm">Local Kakinada Delivery</h4>
            <p className="text-xs text-stone-500 mt-0.5">Delivered fresh within 10 km service radius</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-800 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 text-sm">Pure Ingredients & Recipes</h4>
            <p className="text-xs text-stone-500 mt-0.5">Vegetarian & eggless bakes crafted daily</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-800 shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 text-sm">Bespoke Celebrations</h4>
            <p className="text-xs text-stone-500 mt-0.5">Personalized cakes for birthdays & milestones</p>
          </div>
        </div>
      </section>

      {/* 3. Popular Picks / Featured Products */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            {isFeatured ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Owner&apos;s Picks
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">Popular Picks</h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Handpicked highlights from our Kakinada kitchen
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">Explore Our Menu</h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  A selection of our freshly baked creations
                </p>
              </>
            )}
          </div>
          <Link
            to="/menu"
            className="text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 shrink-0"
          >
            View All Menu <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {popularProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {popularProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
            <div className="flex justify-center pt-4">
              <Link to="/menu">
                <Button variant="outline" size="lg" className="px-10 border-stone-300 hover:bg-amber-50/50">
                  View All Menu <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
            <span className="text-4xl">🎂</span>
            <h3 className="text-lg font-bold font-serif text-stone-800 mt-3">Menu Loading</h3>
            <p className="text-xs text-stone-500 mt-1">Check back shortly for our fresh daily bakes.</p>
            <Link to="/menu" className="inline-block mt-4">
              <Button variant="primary">Browse Full Menu</Button>
            </Link>
          </div>
        )}
      </section>

      {/* 4. Custom Cake CTA Card */}
      <section className="bg-gradient-to-br from-amber-100/70 via-[#FAF6F0] to-orange-100/50 border border-amber-200/80 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
        <div className="space-y-4 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-800" /> Bespoke Creations
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 leading-tight">
            Planning a Special Celebration?
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed font-normal">
            Every celebration deserves a cake as unique as the occasion. Choose your custom theme, occasion, favorite flavor, and weight. Upload your reference design and receive a personal quote directly from our master baker.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-stone-600 pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Custom themes & toppers
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Eggless options available
            </span>
          </div>
        </div>
        <Link to="/custom-cake" className="shrink-0">
          <Button size="lg" variant="primary" className="bg-amber-800 hover:bg-amber-900 text-white shadow-sm px-8 py-3.5">
            <Cake className="w-4 h-4 mr-2" /> Design Custom Cake
          </Button>
        </Link>
      </section>

      {/* 5. The Cake Box Story / About */}
      <section className="bg-white rounded-3xl border border-stone-200/80 p-8 sm:p-14 shadow-xs">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
            OUR BAKERY HERITAGE
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-stone-900 leading-tight">
            Crafted with passion in the heart of Kakinada.
          </h2>
          <div className="w-16 h-0.5 bg-amber-700/40 mx-auto" />
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-normal">
            At Cake Box Kakinada, baking is an art of patience and care. From our silky ganache and velvety buttercreams to our soft sponge bakes and golden pastries, each delicacy is prepared fresh in our kitchen using wholesome ingredients and time-honored recipes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-left border-t border-stone-100">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-stone-900 font-serif">Daily Fresh Baking</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Small-batch bakes prepared fresh daily for authentic flavor and soft texture.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-stone-900 font-serif">Vegetarian Variety</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Dedicated eggless preparations crafted with equal tenderness and taste.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-stone-900 font-serif">Celebration Ready</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Prompt pickup and careful doorstep delivery across Kakinada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Visit Our Bakery / Location & Hours */}
      <section className="bg-[#FAF6F0] rounded-3xl border border-amber-900/10 p-8 sm:p-12 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-amber-900 text-xs font-bold uppercase tracking-wider border border-amber-200/60">
              <MapPin className="w-3.5 h-3.5 text-amber-700" /> Kakinada Location
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              Visit Cake Box Kakinada
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Experience the aroma of fresh bakes and warm hospitality. Located conveniently in Kakinada, Andhra Pradesh (533001), serving delightful moments for pickup and doorstep delivery.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-stone-200/70 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-stone-900 font-semibold text-xs">
                  <Truck className="w-4 h-4 text-amber-700" /> Delivery Coverage
                </div>
                <p className="text-xs text-stone-500">
                  Direct doorstep delivery across a 10 km service radius in Kakinada.
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200/70 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-stone-900 font-semibold text-xs">
                  <Clock className="w-4 h-4 text-amber-700" /> Fresh Orders
                </div>
                <p className="text-xs text-stone-500">
                  Online orders prepared fresh with real-time status tracking.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-sm space-y-5">
            <h4 className="font-serif font-bold text-stone-900 text-lg">Need Assistance?</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Have questions regarding specific cake designs, dietary allergies, or event bulk orders? Our team and AI bakery assistant are here to assist.
            </p>
            <div className="space-y-3 pt-1">
              <Link
                to="/chat"
                className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100/70 text-amber-900 border border-amber-200/60 transition group text-xs font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-amber-800" />
                  Chat with Bakery Assistant
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/menu"
                className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200/70 transition group text-xs font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <Cake className="w-4 h-4 text-stone-600" />
                  Browse Complete Catalogue
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
