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
    ? `Search "${queryParam}" | ${brandTitle}` 
    : selectedSubcategory !== 'all' && currentSubcategoryName
    ? `${currentSubcategoryName} - ${currentCategoryName} | ${brandTitle}`
    : `${currentCategoryName} | Buy Live Ornamental Fish Online India`;

  const seoDescription = `Browse authentic ${currentCategoryName.toLowerCase()} at ${brandTitle}. Hand-conditioned specimens shipped safely via The Professional Couriers with 100% live arrival guarantee across India.`;

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
    <div className="bg-slate-50 min-h-screen py-6 sm:py-8">
      {/* SEO Injection */}
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={typeof window !== 'undefined' ? `${window.location.origin}/shop` : 'https://raguppies.vercel.app/shop'}
        keywords={['buy guppies online', 'pure strain guppies', 'guppy pairs', 'aquarium plants', 'live fish delivery']}
      />

      <div className="max-w-7xl mx-auto px-4">
        {/* Header Breadcrumb */}
        <div className="mb-6">
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5 flex-wrap">
            <span>Home</span>
            <span>/</span>
            <span className={selectedSubcategory !== 'all' ? "text-slate-500" : "text-slate-800 font-semibold"}>
              {currentCategoryName}
            </span>
            {selectedSubcategory !== 'all' && currentSubcategoryName && (
              <>
                <span>/</span>
                <span className="text-slate-800 font-semibold">{currentSubcategoryName}</span>
              </>
            )}
            {queryParam && (
              <>
                <span>/</span>
                <span className="text-blue-700 font-bold">Search: "{queryParam}"</span>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                {queryParam 
                  ? `Search Results for "${queryParam}"` 
                  : selectedSubcategory !== 'all' && currentSubcategoryName
                  ? `${currentSubcategoryName} (${currentCategoryName})`
                  : currentCategoryName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Showing {filteredProducts.length} healthy live specimens available for adoption
              </p>
            </div>

            {/* Mobile Filter Toggle & Desktop Sort */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-2xl text-xs font-semibold text-slate-800 shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters {hasActiveFilters && '• Active'}</span>
              </button>

              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-400 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
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
          <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 mr-1">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg">
                Category: {currentCategoryName}
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSubcategory('all');
                  }}
                  aria-label="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedSubcategory !== 'all' && currentSubcategoryName && (
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-lg">
                Type: {currentSubcategoryName}
                <button 
                  onClick={() => setSelectedSubcategory('all')}
                  aria-label="Remove subcategory filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStrain !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg">
                Strain: {selectedStrain}
                <button onClick={() => setSelectedStrain('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {onlyUnique && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-950 text-white px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3 h-3 text-blue-300" />
                Exact Specimen Only
                <button onClick={() => setOnlyUnique(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {onlySale && (
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg">
                Special Offers
                <button onClick={() => setOnlySale(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {priceRange < 3000 && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                Under {formatCurrency(priceRange)}
                <button onClick={() => setPriceRange(3000)}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-red-600 hover:underline font-semibold ml-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* Catalog Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>Filter Specimens</span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-red-600 hover:underline font-semibold"
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
                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedSubcategory('all');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-50 text-blue-900 font-bold'
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
                          className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">({count})</span>
                        </button>

                        {/* Child subcategories shown when parent selected */}
                        {isSelected && children.length > 0 && (
                          <div className="pl-3 py-1 space-y-1 border-l-2 border-blue-200 ml-3">
                            <button
                              onClick={() => setSelectedSubcategory('all')}
                              className={`w-full text-left px-2.5 py-1 rounded-lg text-[11px] transition-colors flex items-center justify-between ${
                                selectedSubcategory === 'all'
                                  ? 'bg-blue-100 text-blue-900 font-bold'
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
                                  className={`w-full text-left px-2.5 py-1 rounded-lg text-[11px] transition-colors flex items-center justify-between ${
                                    selectedSubcategory === sub.id
                                      ? 'bg-red-50 text-red-700 font-bold'
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Max Price
                  </h3>
                  <span className="text-xs font-bold text-slate-900 font-display">
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
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
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
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg ${
                        selectedStrain === 'all' ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      All Strains
                    </button>
                    {availableStrains.map((strain) => (
                      <button
                        key={strain}
                        onClick={() => setSelectedStrain(strain)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg truncate ${
                          selectedStrain === strain ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
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
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyUnique}
                    onChange={(e) => setOnlyUnique(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>1-of-a-Kind Show Specimens</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlySale}
                    onChange={(e) => setOnlySale(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span>Special Offers</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Exclude Out of Stock</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">No Matching Specimens Right Now</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  Looking for a specific Guppy strain or rare imported pair? Message our breeder on WhatsApp.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
                  >
                    Reset Filters
                  </button>
                  <a
                    href={`https://wa.me/${(settings.whatsapp_number || settings.contact_phone || '918921190590').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
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
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-5 z-10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <h3 className="font-bold text-base text-blue-950">Filter Specimens</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-6 text-xs">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-2">Categories</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedSubcategory('all');
                      }}
                      className={`w-full text-left p-2 rounded-lg ${selectedCategory === 'all' ? 'bg-blue-50 font-bold text-blue-900' : ''}`}
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
                            className={`w-full text-left p-2 rounded-lg flex items-center justify-between ${isSelected ? 'bg-blue-50 font-bold text-blue-900' : ''}`}
                          >
                            <span>{c.name}</span>
                          </button>
                          {isSelected && children.length > 0 && (
                            <div className="pl-4 py-1 space-y-1 border-l-2 border-blue-200 ml-2">
                              <button
                                onClick={() => setSelectedSubcategory('all')}
                                className={`w-full text-left p-1.5 rounded-lg text-[11px] ${selectedSubcategory === 'all' ? 'bg-blue-100 font-bold text-blue-900' : 'text-slate-600'}`}
                              >
                                All {c.name}
                              </button>
                              {children.map(sub => (
                                <button
                                  key={sub.id}
                                  onClick={() => setSelectedSubcategory(sub.id)}
                                  className={`w-full text-left p-1.5 rounded-lg text-[11px] ${selectedSubcategory === sub.id ? 'bg-red-50 font-bold text-red-700' : 'text-slate-600'}`}
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
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-2">Max Price ({formatCurrency(priceRange)})</h4>
                  <input
                    type="range"
                    min="200"
                    max="3000"
                    step="50"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="w-1/2 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-1/2 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold"
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
