import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check, Clock, Star } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [addedAnimation, setAddedAnimation] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAddingRef = React.useRef(false);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Default to first variant or product base
  const variants = product.product_variants || [];
  const primaryVariant = variants[0];
  const displayPrice = primaryVariant?.price ?? product.price ?? 0;
  const hasMultipleVariants = variants.length > 1;

  const isAvailable =
    product.availability === 'AVAILABLE' &&
    (!primaryVariant || primaryVariant.availability === 'AVAILABLE');

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!primaryVariant || !isAvailable) return;

    // Prevent accidental double rapid clicks within 250ms
    if (isAddingRef.current) return;
    isAddingRef.current = true;
    setTimeout(() => {
      isAddingRef.current = false;
    }, 250);

    addToCart({
      product_id: product.id,
      product_name: product.name,
      variant_id: primaryVariant.id,
      variant_name: primaryVariant.name,
      unit_price: Number(primaryVariant.price),
      quantity: 1,
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
    }, 2500); // 2.5 seconds natural display
  };

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Visual Header / Placeholder Cake Banner */}
      <Link to={`/product/${product.slug || product.id}`} className="block relative aspect-4/3 bg-stone-100 overflow-hidden">
        {product.product_images?.[0]?.public_url ? (
          <img
            src={product.product_images[0].public_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.currentTarget;
              const storagePath = product.product_images?.[0]?.storage_path;
              if (storagePath && !target.src.includes('/images/products/')) {
                target.src = `/images/products/${storagePath}`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100/50 p-4 text-center">
            <span className="text-3xl mb-1">🍰</span>
            <span className="text-xs font-semibold text-amber-900/60 uppercase tracking-wider font-serif">
              {product.category?.name || 'Artisanal Bake'}
            </span>
          </div>
        )}

        {/* Dietary and Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
          {product.is_featured && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider bg-amber-600 text-white shadow-xs flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-white" /> Popular
            </span>
          )}
          {product.veg_status && (
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-xs ${
                product.veg_status.toLowerCase().includes('veg') && !product.veg_status.toLowerCase().includes('non')
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {product.veg_status}
            </span>
          )}
          {product.eggless_status && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider bg-amber-500 text-white shadow-xs">
              Eggless
            </span>
          )}
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-[1px] flex items-center justify-center">
            <Badge variant="danger" className="text-xs font-bold uppercase tracking-wider py-1 px-3">
              Currently Unavailable
            </Badge>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-medium text-amber-800 uppercase tracking-wider text-[10px]">
              {product.category?.name || 'Bakery Item'}
            </span>
            {product.preparation_time_minutes && (
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3" /> {product.preparation_time_minutes}m prep
              </span>
            )}
          </div>

          <Link
            to={`/product/${product.slug || product.id}`}
            className="block text-stone-900 font-semibold text-base hover:text-amber-700 transition-colors line-clamp-1 mb-1 font-serif"
          >
            {product.name}
          </Link>

          {product.short_description && (
            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3">
              {product.short_description}
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-stone-900">
                ₹{displayPrice}
              </span>
              {hasMultipleVariants && (
                <span className="text-[11px] text-stone-400 font-normal">
                  onwards
                </span>
              )}
            </div>
            {hasMultipleVariants && (
              <span className="text-[10px] text-stone-500 block">
                {variants.length} options available
              </span>
            )}
          </div>

          {hasMultipleVariants ? (
            <Link to={`/product/${product.slug || product.id}`}>
              <Button size="sm" variant="outline" className="text-xs">
                Options
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="primary"
              disabled={!isAvailable}
              onClick={handleQuickAdd}
              className={`transition-all duration-200 ${
                addedAnimation ? 'bg-emerald-600 hover:bg-emerald-700' : ''
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" /> Added
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
