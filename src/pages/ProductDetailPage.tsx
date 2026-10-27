import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, ShoppingBag, 
  MapPin, Check, Sparkles, ArrowLeft, Star, Send, 
  HeartHandshake, MessageCircle, Play, ZoomIn, X, 
  ChevronLeft, ChevronRight, Film, Image as ImageIcon
} from 'lucide-react';
import { mockDb } from '../lib/mockDatabase';
import { formatCurrency, calculateDiscount } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { StarRating } from '../components/common/StarRating';
import { ProductCard } from '../components/common/ProductCard';
import { SEO } from '../components/common/SEO';
import { Product } from '../lib/types';
import { calculateShipping } from '../lib/shipping';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { recordAnalyticsEvent } from '../lib/analyticsService';

export const ProductDetailPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const brandTitle = settings.brand_name || 'Ra Guppy';
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, setShippingPincode } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | undefined>(() => mockDb.getProductBySlug(slug || ''));

  useEffect(() => {
    setProduct(mockDb.getProductBySlug(slug || ''));
  }, [slug]);

  useEffect(() => {
    const handleUpdate = () => {
      setProduct(mockDb.getProductBySlug(slug || ''));
    };
    window.addEventListener('ba_products_updated', handleUpdate);
    return () => window.removeEventListener('ba_products_updated', handleUpdate);
  }, [slug]);

  useEffect(() => {
    if (product) {
      recordAnalyticsEvent('view_item', {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        category_name: product.category_name,
        price: product.price,
      });
    }
  }, [product?.id]);

  const productImages = product?.images && product.images.length > 0 
    ? product.images 
    : ['/product_image/afr-flower-dorsal-400.jpeg'];
  const productVideos = product?.videos || [];

  const [activeMediaType, setActiveMediaType] = useState<'image' | 'video'>('image');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight' && isLightboxOpen) {
        setLightboxIndex((prev) => (prev + 1) % productImages.length);
      } else if (e.key === 'ArrowLeft' && isLightboxOpen) {
        setLightboxIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, productImages.length]);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{
    checked: boolean;
    serviceable: boolean;
    state: string;
    region?: string;
    days: string;
    fee: number;
    description: string;
  } | null>(null);

  // Review Form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewsList, setReviewsList] = useState(() => mockDb.getReviews(product?.id));

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <SEO title="Specimen Not Found" description="The requested ornamental fish specimen has already found a home." />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Specimen Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">This unique fish has either been adopted or moved to a breeding project.</p>
        <Link to="/shop" className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors">
          Explore Available Guppy Strains
        </Link>
      </div>
    );
  }

  const discount = calculateDiscount(product.price, product.compare_at_price);
  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;

  // JSON-LD Structured Data for Google Rich Results
  const productCanonicalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/product/${product.slug}` 
    : `https://raguppies.vercel.app/product/${product.slug}`;

  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images.map(img => img.startsWith('http') ? img : (typeof window !== 'undefined' ? `${window.location.origin}${img}` : `https://raguppies.vercel.app${img}`)),
    description: product.description,
    sku: product.sku,
    category: product.category_name,
    brand: {
      '@type': 'Brand',
      name: brandTitle,
    },
    offers: {
      '@type': 'Offer',
      url: productCanonicalUrl,
      priceCurrency: 'INR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceValidUntil: '2027-12-31',
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '100',
          currency: 'INR'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY'
          }
        }
      },
      seller: {
        '@type': 'Organization',
        name: brandTitle,
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 4.9,
      reviewCount: product.review_count || 12,
    },
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincode.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      showToast('Please enter a valid 6-digit Indian PIN code', 'error');
      return;
    }
    const calculation = calculateShipping(clean, quantity);
    if (!calculation.isCalculated) {
      setPincodeStatus({
        checked: true,
        serviceable: false,
        state: '',
        days: '',
        fee: 0,
        description: calculation.rateDescription,
      });
      showToast(calculation.errorMessage || 'Invalid or unserviceable PIN code', 'error');
      return;
    }

    setPincodeStatus({
      checked: true,
      serviceable: true,
      state: calculation.state,
      region: calculation.region,
      days: calculation.estimatedDays || '2 - 3 Days',
      fee: calculation.finalFee,
      description: calculation.rateDescription,
    });
    setShippingPincode(clean);
    showToast(`Delivery to ${calculation.state}: ₹${calculation.finalFee} via The Professional Couriers`, 'success');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewTitle || !reviewComment) {
      showToast('Please fill in your name, rating, and feedback', 'error');
      return;
    }
    const newRev = mockDb.submitReview({
      product_id: product.id,
      user_name: reviewName,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      is_verified: true,
    });
    setReviewsList([newRev, ...reviewsList]);
    showToast('Thank you! Your verified review is published.', 'success');
    setReviewTitle('');
    setReviewComment('');
  };

  const relatedProducts = mockDb.getProducts()
    .filter(p => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      {/* SEO Injection */}
      <SEO
        title={`${product.name} — Buy Online India`}
        description={`${product.name} from ${brandTitle}. ${product.short_description || product.description} Conditioned pure strain stock with 100% Live Arrival Guarantee and insulated road courier delivery across India.`}
        canonical={productCanonicalUrl}
        ogImage={product.images[0]}
        ogType="product"
        jsonLd={productSchema}
        keywords={[
          product.name.toLowerCase(),
          product.strain ? `${product.strain.toLowerCase()} guppy` : 'pure strain guppy',
          'buy pure strain guppy pairs',
          'guppy breeding pairs india',
          'buy live guppies online',
          'pure strain livebearers india',
          'ra guppy store'
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs text-slate-500 mb-6">
          <ol className="flex items-center gap-1.5 flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/" itemProp="item" className="hover:text-ocean-950 transition-colors">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <span className="text-slate-300">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/shop" itemProp="item" className="hover:text-ocean-950 transition-colors">
                <span itemProp="name">Shop</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <span className="text-slate-300">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to={`/shop?cat=${product.category_id}`} itemProp="item" className="hover:text-ocean-950 font-medium transition-colors">
                <span itemProp="name">{product.category_name}</span>
              </Link>
              <meta itemProp="position" content="3" />
            </li>
            {product.subcategory_name && (
              <>
                <span className="text-slate-300">/</span>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link to={`/shop?cat=${product.category_id}&subcat=${product.subcategory_id}`} itemProp="item" className="hover:text-ocean-950 font-medium transition-colors">
                    <span itemProp="name">{product.subcategory_name}</span>
                  </Link>
                  <meta itemProp="position" content="4" />
                </li>
              </>
            )}
            <span className="text-slate-300">/</span>
            <li className="text-ocean-950 font-semibold truncate max-w-[200px] sm:max-w-none">
              {product.name}
            </li>
          </ol>
          <Link to="/shop" className="hidden sm:flex items-center gap-1 text-aquatic-700 font-semibold hover:underline transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Fish</span>
          </Link>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Gallery Left (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Quick Media Type Pills (if videos exist) */}
            {productVideos.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMediaType('image');
                    setActiveMediaIndex(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeMediaType === 'image'
                      ? 'bg-ocean-950 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photos ({productImages.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMediaType('video');
                    setActiveMediaIndex(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeMediaType === 'video'
                      ? 'bg-gradient-to-r from-aquatic-600 to-cyan-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Live Swimming Videos ({productVideos.length})</span>
                </button>
              </div>
            )}

            {/* Main Stage Display */}
            <div className="aspect-square bg-ocean-950 rounded-3xl overflow-hidden border border-slate-200/90 relative shadow-card flex items-center justify-center group">
              {activeMediaType === 'image' ? (
                <>
                  <img
                    src={productImages[activeMediaIndex] || productImages[0]}
                    alt={`${product.name} - ${product.strain || 'Live Fish'} available at ${brandTitle}`}
                    className="w-full h-full object-cover object-center cursor-zoom-in transition-transform duration-500 group-hover:scale-102"
                    onClick={() => {
                      setLightboxIndex(activeMediaIndex);
                      setIsLightboxOpen(true);
                    }}
                  />
                  {/* Zoom hint button */}
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIndex(activeMediaIndex);
                      setIsLightboxOpen(true);
                    }}
                    className="absolute bottom-4 right-4 px-3 py-1.5 glass-ocean text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                    aria-label="Zoom specimen photograph"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Zoom</span>
                  </button>
                </>
              ) : (
                <div className="w-full h-full bg-black relative flex items-center justify-center">
                  <video
                    key={productVideos[activeMediaIndex]?.url}
                    src={productVideos[activeMediaIndex]?.url}
                    poster={productVideos[activeMediaIndex]?.thumbnail_url || productImages[0]}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                  {/* Video title overlay */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 glass-ocean text-white text-[11px] font-semibold rounded-lg shadow-xs flex items-center gap-1.5">
                      <Film className="w-3 h-3 text-cyan-400" />
                      {productVideos[activeMediaIndex]?.title || 'Conditioned Swimming Footage'}
                    </span>
                    {productVideos[activeMediaIndex]?.duration && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-aquatic-500 to-cyan-500 text-white text-[10px] font-bold rounded shadow-xs">
                        {productVideos[activeMediaIndex].duration}s HD
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                {product.is_unique_specimen && (
                  <span className="inline-flex items-center gap-1.5 glass-ocean text-white border border-aquatic-400/40 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Exact Specimen Pictured</span>
                  </span>
                )}
                {discount > 0 && !product.is_unique_specimen && (
                  <span className="inline-flex items-center bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-all z-10 ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-500 border border-rose-200'
                    : 'bg-white/90 hover:bg-white text-slate-600 hover:text-rose-500'
                }`}
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Thumbnails Row */}
            {(productImages.length > 1 || productVideos.length > 0) && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1">
                {productImages.map((img, idx) => {
                  const isSelected = activeMediaType === 'image' && activeMediaIndex === idx;
                  return (
                    <button
                      type="button"
                      key={`img-${idx}`}
                      onClick={() => {
                        setActiveMediaType('image');
                        setActiveMediaIndex(idx);
                      }}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 bg-white transition-all shrink-0 ${
                        isSelected 
                          ? 'border-aquatic-600 shadow-md ring-2 ring-aquatic-500/20' 
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`View photo #${idx + 1}`}
                    >
                      <img src={img} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/60 text-white text-[9px] font-medium rounded backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                    </button>
                  );
                })}

                {productVideos.map((vid, vIdx) => {
                  const isSelected = activeMediaType === 'video' && activeMediaIndex === vIdx;
                  return (
                    <button
                      type="button"
                      key={`vid-${vid.id || vIdx}`}
                      onClick={() => {
                        setActiveMediaType('video');
                        setActiveMediaIndex(vIdx);
                      }}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 bg-ocean-950 transition-all shrink-0 ${
                        isSelected 
                          ? 'border-cyan-500 shadow-md ring-2 ring-cyan-500/30' 
                          : 'border-slate-200 opacity-80 hover:opacity-100'
                      }`}
                      aria-label={`Play swimming footage: ${vid.title || 'Video'}`}
                    >
                      <img
                        src={vid.thumbnail_url || productImages[0]}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover opacity-85"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="w-7 h-7 rounded-full bg-gradient-to-r from-aquatic-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
                          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        </span>
                      </div>
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-cyan-600 text-white text-[9px] font-bold rounded">
                        {vid.duration ? `${vid.duration}s` : 'VIDEO'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reassuring Breeder Commitment */}
            <div className="card-aquatic p-4.5 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2.5 font-bold text-ocean-950">
                <div className="w-7 h-7 rounded-lg bg-aquatic-100/80 text-aquatic-700 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4 text-aquatic-700" />
                </div>
                <span>Conditioned with Care by Indian Aquascapers</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px] pl-9">
                This fish has completed a minimum 72-hour biosecure quarantine. Fed with live artemia and high-protein micro pellets to ensure active, vibrant behavior right out of the shipping bag.
              </p>
            </div>
          </div>

          {/* Details Right (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Link
                  to={`/shop?cat=${product.category_id}`}
                  className="text-xs font-bold uppercase tracking-wider text-aquatic-800 bg-aquatic-50 hover:bg-aquatic-100 px-3 py-1 rounded-full border border-aquatic-200/70 transition-colors"
                >
                  {product.category_name}
                </Link>
                {product.subcategory_name && (
                  <Link
                    to={`/shop?cat=${product.category_id}&subcat=${product.subcategory_id}`}
                    className="text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-full border border-cyan-200/70 transition-colors"
                  >
                    {product.subcategory_name}
                  </Link>
                )}
                {product.strain && (
                  <span className="text-xs text-slate-500">
                    Strain: <strong className="text-ocean-950">{product.strain}</strong>
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono ml-auto">SKU: {product.sku}</span>
              </div>

              <h1 className="text-2xl sm:text-3.5xl font-extrabold text-ocean-950 font-display leading-tight mb-3">
                {product.name}
              </h1>

              {/* Rating & Availability */}
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={product.rating} reviewCount={product.review_count} size="md" />
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs text-aquatic-800 font-bold bg-aquatic-50 px-2.5 py-0.5 rounded-full border border-aquatic-200/70">
                  Ready for Express Dispatch
                </span>
              </div>

              {/* Price Block */}
              <div className="card-aquatic p-5 rounded-3xl flex items-baseline gap-3 mb-6">
                <span className="text-3xl sm:text-4xl font-black text-ocean-950 font-display">
                  {formatCurrency(product.price)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <>
                    <span className="text-base sm:text-lg text-slate-400 line-through">
                      {formatCurrency(product.compare_at_price)}
                    </span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      Save {formatCurrency(product.compare_at_price - product.price)} ({discount}% OFF)
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                {product.description}
              </p>

              {/* Habitat & Care Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-white rounded-2xl border border-slate-200/90 text-xs mb-6 shadow-2xs">
                <div className="p-2 rounded-xl bg-slate-50/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Water Temp</span>
                  <span className="font-bold text-ocean-950 font-mono">{product.temperature_range || '24°C - 28°C'}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Care Level</span>
                  <span className="font-bold text-ocean-950">{product.care_level || 'Moderate'}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Gender</span>
                  <span className="font-bold text-ocean-950">{product.gender || 'Single Male'}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50/70">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Size</span>
                  <span className="font-bold text-ocean-950 font-mono">{product.size || '3.5 - 4.5 cm'}</span>
                </div>
              </div>

              {/* Humanized PIN Code Checker */}
              <div className="p-5 bg-gradient-to-br from-slate-50 to-aquatic-50/20 rounded-3xl border border-slate-200/90 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-ocean-950 mb-2.5">
                  <MapPin className="w-4 h-4 text-aquatic-600" />
                  <span>Will this fish reach you safely? Check delivery time</span>
                </div>
                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <input
                    id="pincode-input"
                    type="text"
                    aria-label="Enter 6-digit delivery PIN code"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN code (e.g. 560038)"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-ocean-950 placeholder-slate-400 outline-none focus:border-aquatic-500 focus:ring-1 focus:ring-aquatic-500"
                  />
                  <button
                    type="submit"
                    className="btn-primary text-xs font-bold px-4 py-2.5 rounded-xl transition-all shrink-0 shadow-xs"
                  >
                    Check PIN
                  </button>
                </form>

                {pincodeStatus && (
                  <div className="mt-3 p-3.5 bg-white border border-aquatic-200/80 rounded-2xl text-xs text-ocean-950 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>The Professional Couriers Express Road</span>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-aquatic-800 bg-aquatic-50 px-2.5 py-0.5 rounded-lg border border-aquatic-200">
                        ₹{pincodeStatus.fee}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex flex-wrap justify-between items-center gap-1 pt-1 border-t border-slate-100">
                      <span>Destination: <strong>{pincodeStatus.state}</strong> {pincodeStatus.region ? `(${pincodeStatus.region})` : ''}</span>
                      <span>Transit: <strong>{pincodeStatus.days}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Actions */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  {!product.is_unique_specimen && product.stock_quantity > 1 && (
                    <div className="flex items-center border border-slate-300 rounded-2xl overflow-hidden h-12 bg-white shadow-2xs">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3 py-2 font-bold text-sm text-ocean-950 font-mono">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        className="px-4 py-2 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'btn-primary active:scale-95'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-cyan-200" />
                    <span>Add to Tank</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex-1 h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 btn-accent active:scale-95 shadow-glow-cyan"
                  >
                    <span>Adopt Now</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp direct consultation */}
              <div className="pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
                <span>Unsure about tank compatibility?</span>
                <a
                  href={`https://wa.me/${(settings.whatsapp_number || settings.contact_phone || '918921190590').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-aquatic-700 font-bold hover:underline transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-aquatic-600" />
                  <span>Ask our breeder on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Care Guide Summary */}
        <section className="card-aquatic rounded-3xl p-6 sm:p-8 mb-16 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-aquatic-500"></span>
            <h2 className="text-xl sm:text-2xl font-bold text-ocean-950 font-display">
              Habitat & Floating Acclimation Guide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-3.5">
              <h3 className="font-bold text-ocean-950 uppercase tracking-wider text-xs font-mono">
                Aquarium Setup Checklist
              </h3>
              <ul className="space-y-2 text-slate-600 list-disc list-inside">
                <li><strong>Tank Volume:</strong> Minimum 15 Litres (3.5 Gallons) with a gentle sponge filter flow.</li>
                <li><strong>Temperature:</strong> Tropical 24°C to 28°C (Heater recommended for stability).</li>
                <li><strong>pH Range:</strong> Hard, buffered water (pH 7.2 - 8.2, GH 10-18 dGH).</li>
                <li><strong>Resting Leaves:</strong> Add conditioned Catappa / Indian Almond leaves for scale health.</li>
              </ul>
            </div>

            <div className="space-y-3.5">
              <h3 className="font-bold text-ocean-950 uppercase tracking-wider text-xs font-mono">
                Simple Acclimation Steps
              </h3>
              <p className="text-slate-600 leading-relaxed">
                1. Float the sealed shipping bag on your tank surface for 15-20 minutes to equalize temperature.
                <br />
                2. Add 1/4 cup of aquarium water every 5 minutes for 20 minutes.
                <br />
                3. Gently net your fish into their new home. Do not dump the courier bag water.
              </p>
              <div className="p-3.5 bg-aquatic-50/80 rounded-2xl border border-aquatic-200/70 text-aquatic-900 text-xs">
                <strong>100% Live Arrival Guarantee:</strong> If anything happens in transit, simply record a 30-second video of the unopened shipping bag within 2 hours of delivery for an instant replacement or refund.
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="card-aquatic rounded-3xl p-6 sm:p-8 mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-ocean-950 font-display">
                Aquarist Reviews ({reviewsList.length})
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={product.rating} size="md" />
                <span className="text-xs text-slate-500">Verified buyer community</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleReviewSubmit} className="bg-slate-50/80 p-5 sm:p-6 rounded-3xl border border-slate-200/80 mb-8 space-y-4">
            <h3 className="text-sm font-bold text-ocean-950">Share Your Experience with this Fish</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-ocean-950 outline-none focus:border-aquatic-500 focus:ring-1 focus:ring-aquatic-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-ocean-950 outline-none focus:border-aquatic-500"
                >
                  <option value={5}>5 Stars - Pristine Health & Gorgeous Color</option>
                  <option value={4}>4 Stars - Very Healthy</option>
                  <option value={3}>3 Stars - Good</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Review Headline</label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="e.g. Arrived active, colors are breathtaking!"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-ocean-950 outline-none focus:border-aquatic-500 focus:ring-1 focus:ring-aquatic-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Feedback</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How was the packaging, temperature, and fish behavior?"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-ocean-950 outline-none focus:border-aquatic-500 focus:ring-1 focus:ring-aquatic-500"
              />
            </div>
            <button
              type="submit"
              className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-cyan-200" />
              <span>Submit Review</span>
            </button>
          </form>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviewsList.map((rev) => (
              <div key={rev.id} className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-ocean-950">{rev.user_name}</span>
                  <div className="flex items-center text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <h4 className="font-semibold text-xs text-ocean-900 mb-1">"{rev.title}"</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-ocean-950 font-display mb-6">
              Other Specimens You Might Adore
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile Purchase Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-3.5 pt-2.5 pb-[calc(env(safe-area-inset-bottom,8px)+8px)] flex items-center justify-between gap-2.5 shadow-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleWishlist(product.id)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${
              isWishlisted
                ? 'bg-rose-50 text-rose-500 border-rose-200'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-rose-500'
            }`}
            aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>
          <div>
            <div className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">Live Specimen:</div>
            <div className="text-base font-extrabold text-ocean-950 font-display leading-tight">
              {formatCurrency(product.price)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl btn-primary active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-cyan-200" />
            <span>Add to Tank</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl btn-accent active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-glow-cyan transition-all"
          >
            <span>Adopt Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
