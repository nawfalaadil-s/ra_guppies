import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShoppingCart, Sparkles, Heart, ShieldCheck, Truck, ExternalLink, Play, Film } from 'lucide-react';
import { Product } from '../../lib/types';
import { formatCurrency, calculateDiscount } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { StarRating } from './StarRating';
import { Link } from 'react-router-dom';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedImg, setSelectedImg] = useState(0);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    setSelectedImg(0);
    setMediaType('image');
    setSelectedVideo(0);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const discount = calculateDiscount(product.price, product.compare_at_price);
  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const success = addToCart(product, quantity);
    if (success) {
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-blue-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-product-name"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 z-10 my-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="btn-icon absolute top-4 right-4 z-20 bg-slate-100 hover:bg-slate-200"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
            {/* Gallery Left */}
            <div className="p-4 sm:p-6 bg-slate-50 flex flex-col justify-between">
              <div className="aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-200/80 relative shadow-inner mb-3 flex items-center justify-center">
                {mediaType === 'image' ? (
                  <>
                    <img
                      src={product.images?.[selectedImg] || product.images?.[0] || '/product_image/afr-flower-dorsal-400.jpeg'}
                      alt={product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/product_image/afr-flower-dorsal-400.jpeg';
                      }}
                      className="w-full h-full object-cover object-center"
                    />
                    {product.is_unique_specimen && (
                      <div className="absolute top-3 left-3 bg-blue-900 text-white border border-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>Exact Specimen Shown</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-black relative flex items-center justify-center">
                    <video
                      key={product.videos?.[selectedVideo]?.url}
                      src={product.videos?.[selectedVideo]?.url}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 pointer-events-none">
                      <Film className="w-3 h-3" />
                      <span>Live Video</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails (Images + Videos) */}
              {(product.images.length > 1 || (product.videos && product.videos.length > 0)) && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={`img-${idx}`}
                      type="button"
                      onClick={() => {
                        setMediaType('image');
                        setSelectedImg(idx);
                      }}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        mediaType === 'image' && selectedImg === idx ? 'border-blue-900 shadow-md ring-2 ring-blue-900/30' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}

                  {product.videos && product.videos.map((vid, vIdx) => (
                    <button
                      key={`vid-${vid.id || vIdx}`}
                      type="button"
                      onClick={() => {
                        setMediaType('video');
                        setSelectedVideo(vIdx);
                      }}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 relative bg-slate-900 transition-all ${
                        mediaType === 'video' && selectedVideo === vIdx ? 'border-red-600 shadow-md ring-2 ring-red-600/30' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                      aria-label={`Play video: ${vid.title || 'Live Video'}`}
                    >
                      <img src={vid.thumbnail_url || product.images[0]} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Right */}
            <div className="p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {product.category_name || 'Ornamental Fish'}
                  </span>
                  {product.strain && (
                    <span className="text-xs text-slate-600 font-medium">
                      Strain: {product.strain}
                    </span>
                  )}
                </div>

                <h2 id="quick-view-product-name" className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-2 font-display">
                  {product.name}
                </h2>

                <div className="flex items-center gap-3 mb-3">
                  <StarRating rating={product.rating} reviewCount={product.review_count} size="md" />
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-mono">SKU: {product.sku}</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-slate-900 font-display">
                    {formatCurrency(product.price)}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <>
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(product.compare_at_price)}
                      </span>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {product.short_description || product.description}
                </p>

                {/* Spec Highlights */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/60 mb-4">
                  <div>
                    <span className="text-slate-400 block">Care Level:</span>
                    <span className="font-semibold text-slate-900">{product.care_level || 'Moderate'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Water Temp:</span>
                    <span className="font-semibold text-slate-900">{product.temperature_range || '24°C - 28°C'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gender:</span>
                    <span className="font-semibold text-slate-900">{product.gender || 'Single Male'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Availability:</span>
                    <span className={`font-semibold ${product.stock_quantity > 0 ? 'text-blue-900' : 'text-red-600'}`}>
                      {product.stock_quantity > 0 ? `${product.stock_quantity} In Stock` : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Trust mini pills */}
                <div className="flex flex-col gap-1.5 text-xs text-slate-600 mb-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
                    <span>100% Live Arrival Guarantee with thermal box</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-900 shrink-0" />
                    <span>The Professional Couriers road delivery with live oxygen packing</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  {!product.is_unique_specimen && product.stock_quantity > 1 && (
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden h-11 shrink-0">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-semibold text-sm text-slate-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`btn-primary flex-1 ${
                      isOutOfStock
                        ? 'opacity-60 cursor-not-allowed bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-200'
                        : ''
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-white" />
                        <span>Add to Cart ({formatCurrency(product.price * quantity)})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`btn-icon shrink-0 ${
                      isWishlisted ? 'text-red-600' : 'text-slate-600 hover:text-red-600'
                    }`}
                    aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
                  </button>
                </div>

                <Link
                  to={`/product/${product.slug}`}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-900 hover:underline py-1"
                >
                  <span>View Full Product Specifications & Care Guide</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
