import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  SlidersHorizontal, X, Search, RotateCcw, 
  Sparkles, MessageCircle 
} from 'lucide-react';
import { mockDb } from '../lib/mockDatabase';
import { ProductCard } from '../components/common/ProductCard';
import { QuickViewModal } from '../components/common/QuickViewModal';
import { SEO } from '../components/common/SEO';
import { Product, Category } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { recordAnalyticsEvent } from '../lib/analyticsService';

export const ShopPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const brandTitle = settings.brand_name || 'Ra Guppy';
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('cat') || searchParams.get('category') || 'all';
  const subcategoryParam = searchParams.get('subcat') || searchParams.get('subcategory') || 'all';
  const filterParam = searchParams.get('filter') || '';

  const [categories, setCategories] = useState<Category[]>(() => mockDb.getCategories());
  const [allProducts, setAllProducts] = useState<Product[]>(() => mockDb.getProducts());

  useEffect(() => {
    const handleUpdate = () => {
      setCategories(mockDb.getCategories());
      setAllProducts(mockDb.getProducts());
    };
    window.addEventListener('ba_categories_updated', handleUpdate);
    window.addEventListener('ba_products_updated', handleUpdate);
    return () => {
      window.removeEventListener('ba_categories_updated', handleUpdate);
      window.removeEventListener('ba_products_updated', handleUpdate);
    };
  }, []);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(subcategoryParam);
  const [selectedStrain, setSelectedStrain] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyUnique, setOnlyUnique] = useState<boolean>(filterParam === 'unique');
  const [onlySale, setOnlySale] = useState<boolean>(filterParam === 'sale');
  const [priceRange, setPriceRange] = useState<number>(3000);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync state with URL params
  React.useEffect(() => {
    setSelectedCategory(categoryParam);
    setSelectedSubcategory(subcategoryParam);
  }, [categoryParam, subcategoryParam]);

  // Analytics event tracking
  useEffect(() => {
    recordAnalyticsEvent('view_item_list', {
      category_name: categoryParam !== 'all' ? categoryParam : undefined,
    });
    if (queryParam.trim()) {
      recordAnalyticsEvent('search', {
        search_query: queryParam.trim(),
      });
    }
  }, [categoryParam, queryParam]);

  // Strains list
  const availableStrains = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach(p => {
      if (p.strain) set.add(p.strain);
    });
    return Array.from(set);
  }, [allProducts]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (selectedCategory !== 'all') {
        const matchedCat = categories.find(c => c.id === selectedCategory || c.slug === selectedCategory);
        const targetId = matchedCat ? matchedCat.id : selectedCategory;
        if (product.category_id !== targetId) {
          return false;
        }
      }
      if (selectedSubcategory !== 'all') {
        const matchedSubcat = categories.find(c => c.id === selectedSubcategory || c.slug === selectedSubcategory);
        const targetSubId = matchedSubcat ? matchedSubcat.id : selectedSubcategory;
        if (product.subcategory_id !== targetSubId) {
          return false;
        }
      }
      if (queryParam) {
        const q = queryParam.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesSku = product.sku.toLowerCase().includes(q);
        const matchesStrain = product.strain?.toLowerCase().includes(q);
        const matchesCat = product.category_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesStrain && !matchesCat) {
          return false;
        }
      }
      if (selectedStrain !== 'all' && product.strain !== selectedStrain) {
        return false;
      }
      if (selectedGender !== 'all' && product.gender !== selectedGender) {
        return false;
      }
      if (onlyUnique && !product.is_unique_specimen) {
        return false;
      }
      if (onlySale && (!product.compare_at_price || product.compare_at_price <= product.price)) {
        return false;
      }
      if (onlyInStock && product.stock_quantity <= 0) {
        return false;
      }
      if (product.price > priceRange) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });
  }, [allProducts, selectedCategory, queryParam, selectedStrain, selectedGender, onlyUnique, onlySale, onlyInStock, priceRange, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedStrain('all');
    setSelectedGender('all');
    setOnlyInStock(false);
    setOnlyUnique(false);
    setOnlySale(false);
    setPriceRange(3000);
    setSortBy('featured');
    setSearchParams({});
  };

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const currentCategoryName = currentCategory?.name || 'All Collections';
  const currentSubcategory = categories.find(c => c.id === selectedSubcategory);
  const currentSubcategoryName = currentSubcategory?.name;

  const seoTitle = queryParam 
    ? `Buy "${queryParam}" Guppy Pairs & Live Fish Online | ${brandTitle}` 
    : selectedSubcategory !== 'all' && currentSubcategoryName
    ? `${currentSubcategoryName} — Pure Strain Guppies | ${brandTitle}`
    : selectedCategory !== 'all'
    ? `${currentCategoryName} — Buy Pure Strain Guppy Pairs Online | ${brandTitle}`
    : `Pure Strain Guppy Pairs, Live Plants & Cultures Catalog | ${brandTitle}`;

  const seoDescription = `Shop verified pure strain guppy pairs, active breeding trios, aquatic plants, and live food cultures at ${brandTitle}. 100% Live Arrival Guarantee with insulated express road transport delivery across India.`;

  const shopBreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: typeof window !== 'undefined' ? window.location.origin : 'https://raguppies.vercel.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guppy Collection',
        item: typeof window !== 'undefined' ? `${window.location.origin}/shop` : 'https://raguppies.vercel.app/shop',
      },
      ...(selectedCategory !== 'all' ? [{
        '@type': 'ListItem',
        position: 3,
        name: currentCategoryName,
        item: typeof window !== 'undefined' ? `${window.location.origin}/shop?cat=${selectedCategory}` : `https://raguppies.vercel.app/shop?cat=${selectedCategory}`,
      }] : [])
    ]
  };

  const hasActiveFilters = 
    selectedCategory !== 'all' || 
    selectedSubcategory !== 'all' ||
    selectedStrain !== 'all' || 
    selectedGender !== 'all' || 
    onlyInStock || 
    onlyUnique || 
    onlySale || 
    priceRange < 3000 ||
    Boolean(queryParam);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      {/* SEO Injection */}
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={typeof window !== 'undefined' ? `${window.location.origin}/shop` : 'https://raguppies.vercel.app/shop'}
        jsonLd={shopBreadcrumbSchema}
        keywords={[
          'buy guppy fish online',
          'pure strain guppies india',
          'guppy breeding pairs',
          'albino full red guppy price',
          'electric blue guppy buy',
          'tiger half moon guppy pair',
          'aquatic plants for guppy tank',
          'live moina culture online',
          'live fish delivery india'
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Breadcrumb */}
        <div className="mb-6">
          <div className="text-xs text-slate-500 mb-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="hover:text-ocean-900 transition-colors cursor-pointer">Home</span>
            <span className="text-slate-300">/</span>
            <span className={selectedSubcategory !== 'all' ? "text-slate-500" : "text-ocean-950 font-semibold"}>
              {currentCategoryName}
            </span>
            {selectedSubcategory !== 'all' && currentSubcategoryName && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-ocean-950 font-semibold">{currentSubcategoryName}</span>
              </>
            )}
            {queryParam && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-aquatic-700 font-bold">Search: "{queryParam}"</span>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3.5xl font-extrabold text-ocean-950 font-display tracking-tight">
                {queryParam 
                  ? `Search Results for "${queryParam}"` 
                  : selectedSubcategory !== 'all' && currentSubcategoryName
                  ? `${currentSubcategoryName} (${currentCategoryName})`
                  : currentCategoryName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Showing <span className="font-semibold text-ocean-950">{filteredProducts.length}</span> healthy live specimens available for adoption
              </p>
            </div>

            {/* Mobile Filter Toggle & Desktop Sort */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-white border border-slate-200/90 px-4 py-2.5 rounded-2xl text-xs font-semibold text-ocean-950 shadow-xs hover:border-aquatic-500/40 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-aquatic-600" />
                <span>Filters {hasActiveFilters && '• Active'}</span>
              </button>

              <div className="flex items-center gap-2 bg-white border border-slate-200/90 px-3.5 py-2 rounded-2xl shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-bold text-ocean-950 outline-none bg-transparent cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest Drops</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 mr-1">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-aquatic-50 text-aquatic-900 border border-aquatic-200/70 px-3 py-1 rounded-xl font-medium">
                Category: {currentCategoryName}
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSubcategory('all');
                  }}
                  aria-label="Remove category filter"
                  className="hover:text-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedSubcategory !== 'all' && currentSubcategoryName && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-cyan-50 text-cyan-900 border border-cyan-200/70 px-3 py-1 rounded-xl font-medium">
                Type: {currentSubcategoryName}
                <button 
                  onClick={() => setSelectedSubcategory('all')}
                  aria-label="Remove subcategory filter"
                  className="hover:text-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedStrain !== 'all' && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-ocean-50 text-ocean-900 border border-ocean-200/70 px-3 py-1 rounded-xl font-medium">
                Strain: {selectedStrain}
                <button onClick={() => setSelectedStrain('all')} className="hover:text-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            {onlyUnique && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-ocean-950 text-white px-3 py-1 rounded-xl font-medium">
                <Sparkles className="w-3.5 h-3.5 text-aquatic-300" />
                Exact Specimen Only
                <button onClick={() => setOnlyUnique(false)} className="hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            {onlySale && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-xl font-medium">
                Special Offers
                <button onClick={() => setOnlySale(false)} className="hover:text-rose-900 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            {priceRange < 3000 && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-medium">
                Under {formatCurrency(priceRange)}
                <button onClick={() => setPriceRange(3000)} className="hover:text-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold ml-auto flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* Catalog Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="card-aquatic rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-ocean-950">
                  <SlidersHorizontal className="w-4 h-4 text-aquatic-600" />
                  <span>Filter Specimens</span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
                  Categories
                </h3>
                <div className="space-y-1.5 text-xs">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedSubcategory('all');
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      selectedCategory === 'all'
                        ? 'bg-gradient-to-r from-aquatic-50 to-cyan-50 text-ocean-950 font-bold border border-aquatic-200/70 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Collections ({allProducts.length})
                  </button>
                  {categories.filter(c => !c.parent_id).map((c) => {
                    const count = allProducts.filter(p => p.category_id === c.id).length;
                    const isSelected = selectedCategory === c.id;
                    const children = categories.filter(sub => sub.parent_id === c.id);
                    return (
                      <div key={c.id} className="space-y-1">
                        <button
                          onClick={() => {
                            setSelectedCategory(c.id);
                            setSelectedSubcategory('all');
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between ${
                            isSelected
                              ? 'bg-gradient-to-r from-aquatic-50 to-cyan-50 text-ocean-950 font-bold border border-aquatic-200/70 shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">({count})</span>
                        </button>

                        {/* Child subcategories shown when parent selected */}
                        {isSelected && children.length > 0 && (
                          <div className="pl-3 py-1 space-y-1 border-l-2 border-aquatic-300 ml-3.5">
                            <button
                              onClick={() => setSelectedSubcategory('all')}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-between ${
                                selectedSubcategory === 'all'
                                  ? 'bg-aquatic-100/70 text-ocean-950 font-bold'
                                  : 'text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <span>All {c.name}</span>
                              <span className="text-[9px] text-slate-400">({count})</span>
                            </button>
                            {children.map((sub) => {
                              const subCount = allProducts.filter(p => p.subcategory_id === sub.id).length;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => setSelectedSubcategory(sub.id)}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-between ${
                                    selectedSubcategory === sub.id
                                      ? 'bg-cyan-50 text-cyan-900 font-bold border border-cyan-200/60'
                                      : 'text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="truncate">{sub.name}</span>
                                  <span className="text-[9px] text-slate-400">({subCount})</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Filter Slider */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Max Price
                  </h3>
                  <span className="text-xs font-bold text-ocean-950 font-display bg-ocean-50 px-2 py-0.5 rounded-md border border-ocean-100">
                    {formatCurrency(priceRange)}
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Filter maximum price range"
                  min="200"
                  max="3000"
                  step="50"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-aquatic-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>₹200</span>
                  <span>₹3,000</span>
                </div>
              </div>

              {/* Guppy Strains */}
              {availableStrains.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
                    Fish Strain / Tail Type
                  </h3>
                  <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
                    <button
                      onClick={() => setSelectedStrain('all')}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                        selectedStrain === 'all' ? 'bg-aquatic-50 text-ocean-950 font-bold border border-aquatic-200/60' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      All Strains
                    </button>
                    {availableStrains.map((strain) => (
                      <button
                        key={strain}
                        onClick={() => setSelectedStrain(strain)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg truncate transition-colors ${
                          selectedStrain === strain ? 'bg-aquatic-50 text-ocean-950 font-bold border border-aquatic-200/60' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {strain}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkboxes */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                <label className="flex items-center gap-2.5 text-ocean-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyUnique}
                    onChange={(e) => setOnlyUnique(e.target.checked)}
                    className="rounded text-aquatic-600 focus:ring-aquatic-500 w-4 h-4 accent-aquatic-600"
                  />
                  <span className="font-medium">1-of-a-Kind Show Specimens</span>
                </label>

                <label className="flex items-center gap-2.5 text-ocean-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlySale}
                    onChange={(e) => setOnlySale(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 accent-rose-600"
                  />
                  <span className="font-medium">Special Offers</span>
                </label>

                <label className="flex items-center gap-2.5 text-ocean-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded text-aquatic-600 focus:ring-aquatic-500 w-4 h-4 accent-aquatic-600"
                  />
                  <span className="font-medium">Exclude Out of Stock</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="card-aquatic rounded-3xl p-10 sm:p-14 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-aquatic-50 to-cyan-50 border border-aquatic-100 text-aquatic-700 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-aquatic-600" />
                </div>
                <h3 className="text-xl font-bold text-ocean-950 mb-2 font-display">No Matching Specimens Right Now</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
                  Looking for a specific Guppy strain or rare imported pair? Message our breeder on WhatsApp.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2.5 bg-ocean-900 text-white rounded-xl text-xs font-bold hover:bg-ocean-800 transition-colors shadow-xs"
                  >
                    Reset Filters
                  </button>
                  <a
                    href={`https://wa.me/${(settings.whatsapp_number || settings.contact_phone || '918921190590').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary shadow-glow-cyan"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-ocean-950/70 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-5 z-10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <h3 className="font-bold text-base text-ocean-950 font-display">Filter Specimens</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-6 text-xs">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-mono">Categories</h4>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedSubcategory('all');
                      }}
                      className={`w-full text-left p-2.5 rounded-xl font-medium ${selectedCategory === 'all' ? 'bg-aquatic-50 font-bold text-ocean-950 border border-aquatic-200/70' : 'text-slate-600'}`}
                    >
                      All Collections
                    </button>
                    {categories.filter(c => !c.parent_id).map((c) => {
                      const isSelected = selectedCategory === c.id;
                      const children = categories.filter(sub => sub.parent_id === c.id);
                      return (
                        <div key={c.id} className="space-y-1">
                          <button
                            onClick={() => {
                              setSelectedCategory(c.id);
                              setSelectedSubcategory('all');
                            }}
                            className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between font-medium ${isSelected ? 'bg-aquatic-50 font-bold text-ocean-950 border border-aquatic-200/70' : 'text-slate-600'}`}
                          >
                            <span>{c.name}</span>
                          </button>
                          {isSelected && children.length > 0 && (
                            <div className="pl-4 py-1 space-y-1 border-l-2 border-aquatic-300 ml-2">
                              <button
                                onClick={() => setSelectedSubcategory('all')}
                                className={`w-full text-left p-1.5 rounded-lg text-[11px] ${selectedSubcategory === 'all' ? 'bg-aquatic-100/70 font-bold text-ocean-950' : 'text-slate-600'}`}
                              >
                                All {c.name}
                              </button>
                              {children.map(sub => (
                                <button
                                  key={sub.id}
                                  onClick={() => setSelectedSubcategory(sub.id)}
                                  className={`w-full text-left p-1.5 rounded-lg text-[11px] ${selectedSubcategory === sub.id ? 'bg-cyan-50 font-bold text-cyan-900 border border-cyan-200/60' : 'text-slate-600'}`}
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Max Price ({formatCurrency(priceRange)})</h4>
                  <input
                    type="range"
                    min="200"
                    max="3000"
                    step="50"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-aquatic-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="w-1/2 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-1/2 py-2.5 btn-primary font-bold shadow-glow-cyan"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
