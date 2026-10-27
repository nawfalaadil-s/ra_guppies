import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Calendar, User, ArrowRight, BookOpen, Sparkles, Eye, Tag, ChevronRight } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { mockDb } from '../lib/mockDatabase';
import { BlogPost, BlogCategory } from '../lib/types';
import { formatDate } from '../lib/utils';

const CATEGORIES: ('All' | BlogCategory)[] = [
  'All',
  'Guppy Care & Water Quality',
  'Breeding & Genetics',
  'Feeding & Live Foods',
  'Aquatic Plants & Aquascaping',
  'Acclimation & Fish Health',
  'Aquarium Setup & Supplies',
];

export const BlogPage: React.FC = () => {
  const [posts] = useState<BlogPost[]>(() => mockDb.getBlogPosts(true));
  const [selectedCategory, setSelectedCategory] = useState<'All' | BlogCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const filteredPosts = posts.filter((post) => {
    if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchExcerpt = post.excerpt.toLowerCase().includes(q);
      const matchTag = post.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchExcerpt && !matchTag) return false;
    }
    return true;
  });

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const gridPosts = filteredPosts.slice(1);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-12">
      <SEO 
        title="Pure Strain Guppy Breeding Guides, Genetics & Care Journal" 
        description="Comprehensive master guides on pure strain Guppy trio breeding, water chemistry parameters, live Moina and Artemia culturing, livebearer plants, and express courier acclimation."
        canonical={typeof window !== 'undefined' ? `${window.location.origin}/blog` : 'https://raguppies.vercel.app/blog'}
        keywords={[
          'guppy breeding guide',
          'pure strain guppy care',
          'guppy trio breeding system',
          'live moina culture guide',
          'livebearer water chemistry ph hardness',
          'best plants for guppies',
          'guppy acclimation express courier',
          'ra guppy breeding journal'
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
          <Link to="/" className="hover:text-ocean-950 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-ocean-950 font-semibold">Care Guides & Journals</span>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-aquatic-800 bg-aquatic-50 border border-aquatic-200/80 px-3 py-1 rounded-full mb-3 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-aquatic-600" />
            <span>Aquatic Knowledge Base</span>
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ocean-950 font-display tracking-tight leading-tight">
            The Connoisseur's <span className="text-aquatic-700">Guppy & Plant Journal</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
            In-depth guides on mineral hardness, line breeding, live feeds, and planted biotope systems. Authored by veteran breeders.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="card-aquatic rounded-3xl p-4 sm:p-5 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="blog-search-input"
                type="text"
                aria-label="Search care guides, water chemistry, live foods"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search care guides, water chemistry, live foods..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-ocean-950 placeholder:text-slate-400 outline-none focus:border-aquatic-500 focus:ring-1 focus:ring-aquatic-500 focus:bg-white transition-all"
              />
            </div>
            
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap self-center sm:self-auto">
              Showing <strong className="text-ocean-950">{filteredPosts.length}</strong> articles
            </span>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? 'bg-ocean-950 text-white border-ocean-950 shadow-glow-cyan'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-800">No Articles Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try adjusting your search terms or selecting another category.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Featured Top Article */}
        {featuredPost && (
          <div className="mb-10 sm:mb-12">
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 relative aspect-video lg:aspect-auto overflow-hidden bg-slate-900">
                <img
                  src={featuredPost.featured_image || '/product_image/afr-flower-dorsal-400.jpeg'}
                  alt={featuredPost.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/product_image/afr-flower-dorsal-400.jpeg';
                  }}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white bg-red-600 px-3 py-1 rounded-full shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Featured Master Guide</span>
                </span>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px]">
                      {featuredPost.category}
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <Clock className="w-3 h-3 text-red-500" />
                      {featuredPost.read_time_minutes} min read
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display leading-tight hover:text-blue-900 transition-colors">
                    <Link to={`/blog/${featuredPost.slug}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={featuredPost.author.avatar}
                      alt={featuredPost.author.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{featuredPost.author.name}</div>
                      <div className="text-[10px] text-slate-500">{formatDate(featuredPost.published_at)}</div>
                    </div>
                  </div>

                  <Link
                    to={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors group shadow-xs"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid of Remaining Articles */}
        {gridPosts.length > 0 && (
          <div className="space-y-4 mb-16">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Latest Research & Care Articles</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <Link to={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={post.featured_image || '/product_image/afr-flower-dorsal-400.jpeg'}
                      alt={post.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/product_image/afr-flower-dorsal-400.jpeg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 text-[10px] font-bold text-blue-900 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                      {post.category}
                    </span>
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-red-500" />
                          {post.read_time_minutes} min
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-blue-700" />
                          {post.views_count} views
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2 leading-snug">
                        <Link to={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[120px]">
                          {post.author.name}
                        </span>
                      </div>

                      <Link
                        to={`/blog/${post.slug}`}
                        className="font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3.5 h-3.5 text-red-600" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter Subscription Box */}
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 mb-12 shadow-xl border border-blue-900">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-800/80 px-3 py-1 rounded-full">
              Never Miss A Lineage Release
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
              Subscribe to Breeder Bulletins & Care Tips
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Get notified when new Pure Strain Guppy pairs, live plant guides, or breeding whitepapers are published. No spam, ever.
            </p>

            {subscribed ? (
              <div className="p-3 bg-blue-900/60 rounded-2xl border border-blue-500 text-white font-bold text-xs inline-block">
                ✓ Thank you! You are now subscribed to our newsletter.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                <input
                  id="blog-newsletter-input"
                  type="email"
                  aria-label="Email address for monthly care journal"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-red-500 focus:bg-white/20 transition-all"
                />
                <button
                  type="submit"
                  className="min-h-[42px] px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm whitespace-nowrap"
                >
                  Subscribe Free
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
