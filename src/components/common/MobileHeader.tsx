import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Search, ShoppingCart, Heart, 
  User, Package, ShieldCheck, HelpCircle, 
  Phone, ChevronRight, Settings, BookOpen 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useBranding } from '../../contexts/BrandingContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { mockDb } from '../../lib/mockDatabase';
import { Product } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { BrandLogo } from './BrandLogo';

export const MobileHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { activeSettings, branding } = useBranding();
  const { settings } = useStoreSettings();
  const currentSettings = activeSettings || branding;
  const brandTitle = settings.brand_name || currentSettings.site_name || 'Ra Guppy';
  const brandParts = brandTitle.trim().split(/\s+/);
  const firstWord = brandParts[0] || 'RA';
  const restWords = brandParts.slice(1).join(' ');

  const whatsappDisplay = settings.whatsapp_number || settings.contact_phone || '+91 89211 90590';
  const whatsappClean = (settings.whatsapp_number || settings.contact_phone || '918921190590').replace(/\D/g, '');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      const all = mockDb.getProducts();
      const filtered = all.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.strain && p.strain.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSuggestions(filtered.slice(0, 4));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
  };

  const categories = mockDb.getCategories();

  return (
    <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-900 shadow-xs border-b border-slate-200/80">
      {/* Top Main Mobile Bar */}
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        {/* Menu Drawer Toggle */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="btn-icon min-h-[44px] min-w-[44px]"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-6 h-6 text-slate-800" />
        </button>

        {/* Center Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-slate-200/80">
            <BrandLogo variant="mobile" className="w-full h-full" imgClassName="w-full h-full object-contain" />
          </div>
          <span className="font-display font-extrabold text-base tracking-tight text-ocean-950 uppercase">
            {firstWord} {restWords && <span className="text-teal-600">{restWords}</span>}
          </span>
        </Link>

        {/* Right Action Icons: Search, Cart */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="btn-icon min-h-[44px] min-w-[44px]"
            aria-label="Search Store"
          >
            <Search className="w-5 h-5 text-slate-700" />
          </button>

          <Link
            to="/cart"
            className="btn-icon relative min-h-[44px] min-w-[44px]"
            aria-label="Cart"
          >
            <ShoppingCart className="w-5 h-5 text-slate-700" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-emerald-500 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {isSearchOpen && (
        <div className="p-3 bg-slate-50 border-t border-slate-200/80">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-2xl overflow-hidden px-3 py-1.5 border border-slate-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 shadow-xs">
            <Search className="w-4 h-4 text-teal-600 shrink-0 mr-2" />
            <input
              id="mobile-search-input"
              ref={searchInputRef}
              type="text"
              aria-label="Search fish and supplies"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Pure Strain Guppies, Plants, Live Foods..."
              className="w-full text-xs text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear mobile search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="btn-primary shrink-0 ml-1.5 min-h-[36px]"
            >
              Go
            </button>
          </form>

          {/* Instant Suggestions on Mobile */}
          {suggestions.length > 0 && (
            <div className="mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-slate-900">
              {suggestions.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.slug}`}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-2.5 p-2.5 hover:bg-slate-50"
                >
                  <img src={p.images[0]} alt={p.name} className="w-9 h-9 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-slate-600">{p.category_name}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{formatCurrency(p.price)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Horizontal Scrollable Category Strip */}
      <div className="bg-white border-t border-slate-100 px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
        <Link
          to="/shop"
          className="whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full bg-ocean-950 text-white shadow-2xs"
        >
          All Items
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/shop?cat=${c.id}`}
            className="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100/80 text-slate-700 hover:bg-teal-50 hover:text-teal-900 border border-slate-200/80 transition-colors"
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Accessible Slide-Out Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white text-slate-900 h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200">
            {/* Drawer Header */}
            <div>
              <div className="bg-ocean-950 text-white p-4 flex items-center justify-between border-b border-ocean-850">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-white/20">
                    <BrandLogo variant="mobile" className="w-full h-full" imgClassName="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-white uppercase tracking-tight">
                      {firstWord} {restWords && <span className="text-teal-400">{restWords}</span>}
                    </div>
                    <div className="text-[11px] text-teal-200/80 font-medium">{currentSettings.tagline || 'Pure Strain Guppies & Aquatic Sanctuary'}</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Greeting Card */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-600">Signed in as</div>
                      <div className="font-bold text-slate-900 text-sm">{user.full_name}</div>
                      <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsDrawerOpen(false);
                      }}
                      className="btn-secondary text-xs px-2.5 py-1 text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsDrawerOpen(false)}
                    className="btn-primary w-full"
                  >
                    Login / Create Account
                  </Link>
                )}
              </div>

              {/* Navigation Links */}
              <div className="p-3 text-sm divide-y divide-slate-100">
                <div className="py-2">
                  <Link
                    to="/shop"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 font-semibold text-slate-900"
                  >
                    <span>All Fish & Supplies</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    to="/shop?cat=guppies"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-900"
                  >
                    <span>Pure Strain Guppies & Pairs</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    to="/shop?cat=aquatic-plants"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-900"
                  >
                    <span>Live Aquatic Plants</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    to="/shop?cat=fish-food"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-900"
                  >
                    <span>Fish Food & Live Moina</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    to="/shop?cat=guppy-pairs"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-900"
                  >
                    <span>Pure Strain Guppy Pairs</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    to="/blog"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 font-bold text-blue-900 mt-1"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-red-600" />
                      <span>Care Guides & Articles</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-900" />
                  </Link>
                </div>

                <div className="py-2">
                  <Link
                    to="/account/orders"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-900"
                  >
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>My Orders & Consignments</span>
                  </Link>
                  <Link
                    to="/account/wishlist"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-900"
                  >
                    <Heart className="w-4 h-4 text-red-600" />
                    <span>Wishlist ({wishlistCount})</span>
                  </Link>
                  <Link
                    to="/page/shipping-acclimation"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-900"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-900" />
                    <span>Live Arrival Guarantee Guide</span>
                  </Link>
                  <Link
                    to="/page/faq"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-900"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Frequently Asked Questions</span>
                  </Link>
                </div>

                {/* Admin Mode Entry - Only Visible to Authenticated Admins */}
                {isAdmin && (
                  <div className="py-2">
                    <Link
                      to="/admin"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50 text-blue-900 font-semibold border border-blue-200"
                    >
                      <Settings className="w-4 h-4 text-blue-900" />
                      <span>Open Admin Console</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <a
                href={`https://wa.me/${whatsappClean}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full"
              >
                <Phone className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setIsDrawerOpen(false);
                  }}
                  className="btn-ghost w-full mt-2 text-red-600 hover:text-red-700"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
