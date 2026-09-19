import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Clock, ShieldAlert, ShoppingBag } from 'lucide-react';
import { catalogueService } from '../services/catalogueService';
import type { Product, ProductVariant } from '../types';
import { useCart } from '../contexts/CartContext';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAddingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      try {
        const prod = await catalogueService.getProductById(id);
        setProduct(prod);
        if (prod?.product_variants && prod.product_variants.length > 0) {
          setSelectedVariant(prod.product_variants[0]);
        }
      } catch (e) {
        console.error('Failed to load product', e);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-stone-200">
        <h2 className="text-2xl font-bold font-serif text-stone-800">Product Not Found</h2>
        <p className="text-sm text-stone-500 mt-2">The requested bakery product does not exist.</p>
        <Link to="/menu" className="inline-block mt-4">
          <Button variant="outline">Back to Menu</Button>
        </Link>
      </div>
    );
  }

  const variants = product.product_variants || [];
  const currentPrice = selectedVariant?.price ?? product.price ?? 0;
  const isAvailable =
    product.availability === 'AVAILABLE' &&
    (!selectedVariant || selectedVariant.availability === 'AVAILABLE');

  const handleAddToCart = () => {
    if (!selectedVariant || !isAvailable) return;

    // Rapid-click debounce protection
    if (isAddingRef.current) return;
    isAddingRef.current = true;
    setTimeout(() => {
      isAddingRef.current = false;
    }, 250);

    addToCart({
      product_id: product.id,
      product_name: product.name,
      variant_id: selectedVariant.id,
      variant_name: selectedVariant.name,
      unit_price: Number(currentPrice),
      quantity,
      image_url: product.product_images?.[0]?.public_url,
      veg_status: product.veg_status,
    });

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setAddedAnimation(true);
    timerRef.current = setTimeout(() => {
      setAddedAnimation(false);
      timerRef.current = null;
    }, 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Link
        to="/menu"
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-amber-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Bakery Menu
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-xs">
        {/* Product Visual */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border border-stone-100 flex items-center justify-center relative">
            {product.product_images?.[0]?.public_url ? (
              <img
                src={product.product_images[0].public_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  const storagePath = product.product_images?.[0]?.storage_path;
                  if (storagePath && !target.src.includes('/images/products/')) {
                    target.src = `/images/products/${storagePath}`;
                  }
                }}
              />
            ) : (
              <div className="text-center p-6">
                <span className="text-7xl block mb-3">🎂</span>
                <span className="text-sm font-semibold text-stone-600 font-serif">
                  {product.category?.name || 'Artisanal Bake'}
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {product.veg_status && (
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider shadow-xs ${
                    product.veg_status.toLowerCase().includes('veg') &&
                    !product.veg_status.toLowerCase().includes('non')
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {product.veg_status}
                </span>
              )}
              {product.eggless_status && (
                <span className="px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                  Eggless
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Product Details & Variant Selection */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
              {product.category?.name || 'Bakery Delicacy'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 leading-snug">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-stone-900">
                ₹{currentPrice}
              </span>
              <span className="text-xs text-stone-400">Inclusive of all taxes</span>
            </div>

            {product.short_description && (
              <p className="text-sm text-stone-600 leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* Variants Selector */}
            {variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                  Select Portion / Variant
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedVariant?.id === v.id
                          ? 'border-amber-800 bg-amber-50/50 ring-2 ring-amber-700/20'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-stone-900 block">
                        {v.name}
                      </span>
                      <span className="text-xs text-stone-600 font-semibold mt-0.5 block">
                        ₹{v.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extra Info Pills */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-stone-600">
              {product.preparation_time_minutes && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Prep time: {product.preparation_time_minutes} mins</span>
                </div>
              )}
              {product.allergens && (
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Allergens: {product.allergens}</span>
                </div>
              )}
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="pt-6 border-t border-stone-100 space-y-4">
            <div className="flex items-center gap-4">
              {/* Quantity selector */}
              <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-200 transition-colors font-semibold"
                  disabled={!isAvailable}
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-stone-800 min-w-10 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-200 transition-colors font-semibold"
                  disabled={!isAvailable}
                >
                  +
                </button>
              </div>

              {/* Add button */}
              <Button
                size="lg"
                variant="primary"
                disabled={!isAvailable}
                onClick={handleAddToCart}
                className={`flex-1 transition-all duration-200 ${
                  addedAnimation ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4 mr-2" /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" /> Add to Order
                  </>
                )}
              </Button>
            </div>

            {!isAvailable && (
              <p className="text-xs text-rose-600 font-semibold text-center">
                This product is currently out of stock at our Kakinada kitchen.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
