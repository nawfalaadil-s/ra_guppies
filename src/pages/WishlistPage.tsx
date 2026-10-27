import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { mockDb } from '../lib/mockDatabase';
import { ProductCard } from '../components/common/ProductCard';

export const WishlistPage: React.FC = () => {
  const { wishlistIds } = useWishlist();
  const allProducts = mockDb.getProducts();

  const wishlistedProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-aquatic-700 block mb-1">
            Personal Collection
          </span>
          <h1 className="text-2xl sm:text-3.5xl font-extrabold text-ocean-950 font-display tracking-tight">
            My Saved Wishlist ({wishlistedProducts.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Keep track of exquisite pure strain Guppy pairs and aquatic flora you intend to order.
          </p>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="card-aquatic rounded-3xl p-12 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-ocean-950 mb-2 font-display">Your Wishlist is Empty</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Tap the heart icon on any Guppy specimen to save it here for future observation.
            </p>
            <Link
              to="/shop"
              className="btn-primary shadow-glow-cyan"
            >
              <span>Browse Living Specimens</span>
              <ArrowRight className="w-4 h-4 text-cyan-200" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {wishlistedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
