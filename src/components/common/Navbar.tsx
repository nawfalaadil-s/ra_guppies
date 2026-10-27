import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, Heart, User, 
  ChevronDown, LogOut, Package, X, 
  Settings, MessageCircle, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { formatCurrency } from '../../lib/utils';
import { mockDb } from '../../lib/mockDatabase';
import { Product, Category } from '../../lib/types';
import { useBranding } from '../../contexts/BrandingContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { BrandLogo } from './BrandLogo';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { itemCount, subtotal } = useCart();
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

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [categoryHierarchy, setCategoryHierarchy] = useState<Category[]>(() => mockDb.getCategoryHierarchy());

  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Debounced search autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const allProducts = mockDb.getProducts();
      const filtered = allProducts.filter((p) => {
        return (
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.strain && p.strain.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      });
      setSuggestions(filtered.slice(0, 5));
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync category hierarchy when categories or products update
  useEffect(() => {
    const handleUpdate = () => {
      setCategoryHierarchy(mockDb.getCategoryHierarchy());
    };
    window.addEventListener('ba_categories_updated', handleUpdate);
    window.addEventListener('ba_products_updated', handleUpdate);
    return () => {
      window.removeEventListener('ba_categories_updated', handleUpdate);
      window.removeEventListener('ba_products_updated', handleUpdate);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200/80 shadow-xs">
      {/* Top Notification & Trust Bar */}
      <div className="bg-ocean-950 text-slate-300 border-b border-ocean-800/60 px-4 py-1.5 text-xs hidden lg:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>South India Quarantine Facility • Daily Live Dispatches</span>
            </span>
            <span className="text-ocean-700">•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>The Professional Couriers • Express Road Transport with 100% Live Arrival Guarantee</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${whatsappClean}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-teal-300 hover:text-white transition-colors font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp: {whatsappDisplay}</span>
            </a>
            {isAdmin && (
              <>
                <span className="text-ocean-700">•</span>
                <Link
                  to="/admin"
                  className="font-medium text-amber-300 hover:text-white flex items-center gap-1 font-mono transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Brand & Search Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform duration-200">
            <BrandLogo variant="header" className="w-full h-full" imgClassName="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight text-ocean-950 uppercase">
              {firstWord} {restWords && <span className="text-teal-600">{restWords}</span>}
            </span>
            <span className="hidden lg:block text-xs tracking-wide text-slate-500 font-medium truncate max-w-[200px]">
              {currentSettings.tagline || 'Pure Strain Guppies & Aquatic Life'}
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-xs md:max-w-sm lg:max-w-xl relative hidden md:block">
          <form onSubmit={handleSearchSubmit} className="flex items-center rounded-2xl overflow-hidden border border-slate-200 bg-slate-50/70 hover:bg-white focus-within:bg-white focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all p-1 shadow-2xs">
            <div className="pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4 text-teal-600" />
            </div>

            <input
              id="desktop-search-input"
              type="text"
              aria-label="Search fish, plants, and supplies"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search Pure Strain Guppies, Live Plants, Starter Cultures..."
              className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 mr-1"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="btn-primary shrink-0"
            >
              Search
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-2.5 border-b border-slate-100 text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Matching Live Specimens</span>
                <span className="text-blue-900 font-bold">{suggestions.length} found</span>
              </div>
              <div className="divide-y divide-slate-100">
                {suggestions.map((item) => (
                  <Link
                    key={item.id}
                    to={`/product/${item.slug}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-600">
                        {item.category_name} {item.strain && `• ${item.strain}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCurrency(item.price)}
                      </div>
                      {item.is_unique_specimen && (
                        <span className="text-xs text-red-600 font-semibold block">1 in stock</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions: Wishlist, Account, Cart */}
        <div className="flex items-center gap-3">
          {/* Wishlist */}
          <Link
            to="/account/wishlist"
            className="btn-icon relative hidden sm:inline-flex"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Account Menu */}
          <div ref={accountRef} className="relative hidden md:block">
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="btn-ghost flex items-center gap-2 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
                <User className="w-4 h-4" />
              </div>
              <div className="text-xs leading-tight hidden lg:block">
                <span className="block text-xs text-slate-600">
                  {user ? `Hi, ${user.full_name.split(' ')[0]}` : 'Welcome'}
                </span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <span>{user ? 'My Account' : 'Sign In'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              </div>
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100">
                  {user ? (
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{user.full_name}</div>
                      <div className="text-xs text-slate-600 truncate">{user.email}</div>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsAccountOpen(false)}
                      className="btn-primary w-full text-center"
                    >
                      Sign In / Register
                    </Link>
                  )}
                </div>

                <div className="p-1.5 text-xs divide-y divide-slate-100 font-medium">
                  <div className="py-1">
                    <Link
                      to="/account/orders"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 rounded-xl text-slate-900"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>My Orders & Consignments</span>
                    </Link>
                    <Link
                      to="/account/wishlist"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 rounded-xl text-slate-900"
                    >
                      <Heart className="w-4 h-4 text-red-600" />
                      <span>Saved Fish ({wishlistCount})</span>
                    </Link>
                  </div>

                  {isAdmin && (
                    <div className="py-1">
                      <Link
                        to="/admin"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 rounded-xl text-blue-900 font-semibold"
                      >
                        <Settings className="w-4 h-4 text-blue-900" />
                        <span>Admin Console</span>
                      </Link>
                    </div>
                  )}

                  {user && (
                    <div className="py-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsAccountOpen(false);
                        }}
                        className="btn-ghost w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <Link
            to="/cart"
            className="btn-primary"
            aria-label={`Cart with ${itemCount} items`}
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 text-teal-300" />
              {itemCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold hidden lg:inline">
              {itemCount === 0 ? 'Cart' : formatCurrency(subtotal)}
            </span>
          </Link>
        </div>
      </div>

      {/* Dynamic Category Navigation Strip */}
      <nav aria-label="Category navigation" className="border-t border-slate-100 bg-white/80 backdrop-blur-xs hidden md:block relative z-30">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 text-xs font-semibold text-slate-700 py-1.5 overflow-x-auto scrollbar-none">
          <Link
            to="/shop"
            className="px-3 py-1.5 rounded-xl hover:text-teal-700 hover:bg-teal-50/60 transition-colors shrink-0"
          >
            All Fish & Supplies
          </Link>

          {categoryHierarchy.map((cat) => {
            const hasChildren = cat.children && cat.children.length > 0;
            return (
              <div key={cat.id} className="relative group shrink-0">
                <Link
                  to={`/shop?cat=${cat.id}`}
                  className={`px-3 py-1.5 rounded-xl hover:text-teal-700 hover:bg-teal-50/60 transition-colors flex items-center gap-1.5 ${
                    cat.is_featured ? 'text-teal-800 font-bold bg-teal-50/50' : ''
                  }`}
                >
                  {cat.is_featured && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />}
                  <span>{cat.name}</span>
                  {hasChildren && (
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-teal-700 group-hover:rotate-180 transition-transform duration-200" />
                  )}
                </Link>

                {/* Subcategory Dropdown */}
                {hasChildren && (
                  <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 min-w-60 text-xs text-slate-700">
                      <div className="px-3.5 py-1 text-[10px] font-bold text-teal-800 uppercase tracking-wider border-b border-slate-100 mb-1">
                        {cat.name} Catalog
                      </div>
                      <Link
                        to={`/shop?cat=${cat.id}`}
                        className="px-3.5 py-1.5 hover:bg-teal-50 hover:text-teal-900 flex items-center justify-between font-bold text-teal-800 transition-colors"
                      >
                        <span>View All {cat.name}</span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full">{cat.product_count}</span>
                      </Link>
                      {cat.children!.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/shop?cat=${cat.id}&subcat=${sub.id}`}
                          className="px-3.5 py-1.5 hover:bg-slate-50 hover:text-teal-700 flex items-center justify-between transition-colors"
                        >
                          <span>{sub.name}</span>
                          <span className="text-[10px] text-slate-400">{sub.product_count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Link
            to="/blog"
            className="px-3 py-1.5 rounded-xl hover:text-teal-700 hover:bg-teal-50/60 transition-colors flex items-center gap-1.5 font-bold text-teal-800 shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
            <span>Care Guides</span>
          </Link>

          <div className="ml-auto shrink-0">
            <Link
              to="/page/shipping-acclimation"
              className="text-slate-600 hover:text-teal-800 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>100% Live Arrival Policy</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};
