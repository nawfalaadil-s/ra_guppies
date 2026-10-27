import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Check, Play } from 'lucide-react';
import { Product } from '../../lib/types';
import { formatCurrency, calculateDiscount } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { StarRating } from './StarRating';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);

  const discount = calculateDiscount(product.price, product.compare_at_price);
  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    const success = addToCart(product, 1);
    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <article className="group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-teal-500/40 shadow-xs hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden h-full">
      {/* Product Image Frame */}
      <div className="relative aspect-[4/3] sm:aspect-square bg-slate-100/70 overflow-hidden">
        <Link to={`/product/${product.slug}`} className="block w-full h-full" aria-label={`View details for ${product.name}`}>
          <img
            src={product.images[0]}
            alt={`${product.name} - ${product.strain || 'Pure Strain Guppy'}`}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Floating Specimen Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.is_unique_specimen && (
            <span className="inline-flex items-center gap-1 bg-ocean-950/90 text-teal-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs border border-teal-500/30 backdrop-blur-xs">
              WYSIWYG 1-of-1
            </span>
          )}
          {discount > 0 && !product.is_unique_specimen && (
            <span className="inline-flex items-center bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
              {discount}% OFF
            </span>
          )}
          {product.videos && product.videos.length > 0 && (
            <span className="inline-flex items-center gap-1 bg-teal-900/90 text-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs border border-teal-500/30">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>HD Video</span>
            </span>
          )}
        </div>

        {/* Wishlist & Quick View */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlist}
            className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/90 hover:bg-white shadow-xs backdrop-blur-xs transition-colors ${
              isWishlisted ? 'text-rose-600' : 'text-slate-600 hover:text-rose-600'
            }`}
            aria-label={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>

          {onQuickView && (
            <button
              onClick={handleQuickView}
              className="w-8 h-8 rounded-full items-center justify-center bg-white/90 hover:bg-white text-slate-600 hover:text-teal-700 shadow-xs backdrop-blur-xs transition-all opacity-0 group-hover:opacity-100 hidden sm:inline-flex"
              aria-label="Quick View specimen"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sold out badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-ocean-950/70 backdrop-blur-[1px] flex items-center justify-center z-20">
            <span className="bg-ocean-900/95 text-slate-200 font-bold text-xs px-3 py-1 rounded-full border border-ocean-700 shadow-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Category & Strain */}
          <div className="flex items-center justify-between text-xs font-semibold text-teal-700 mb-1">
            <span className="truncate">{product.category_name || 'Pure Strain Guppy'}</span>
            {product.strain && (
              <span className="text-slate-700 font-bold truncate ml-1 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">{product.strain}</span>
            )}
          </div>

          {/* Title */}
          <Link to={`/product/${product.slug}`} className="block group-hover:text-teal-700 transition-colors">
            <h3 className="font-bold text-ocean-950 text-xs sm:text-sm line-clamp-2 leading-snug mb-1.5 font-display tracking-tight">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mb-2.5">
            <StarRating rating={product.rating} reviewCount={product.review_count} size="sm" />
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-2.5 border-t border-slate-100 mt-auto">
          <div className="flex items-baseline gap-2 mb-2.5">
            <span className="text-base sm:text-lg font-black text-ocean-950 font-display">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs text-slate-400 line-through font-medium">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`btn-primary w-full ${
              isOutOfStock
                ? 'opacity-60 cursor-not-allowed bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-200'
                : ''
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Added to Tank!</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-teal-300" />
                <span className="hidden sm:inline">Add to Cart</span>
                <span className="sm:hidden">Add to Tank</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
