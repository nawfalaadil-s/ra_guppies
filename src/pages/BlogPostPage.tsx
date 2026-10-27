import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Clock, Calendar, User, Eye, ArrowLeft, Share2, 
  Copy, Check, BookOpen, Sparkles, ChevronRight, MessageCircle, ExternalLink 
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { mockDb } from '../lib/mockDatabase';
import { BlogPost } from '../lib/types';
import { formatDate } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { useBranding } from '../contexts/BrandingContext';

export const BlogPostPage: React.FC = () => {
  const { branding } = useBranding();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const found = mockDb.getBlogPostBySlug(slug);
    if (found) {
      setPost(found);
      mockDb.incrementBlogPostViews(found.id);

      // Fetch other posts in same or general category
      const all = mockDb.getBlogPosts(true);
      const others = all.filter(p => p.id !== found.id).slice(0, 3);
      setRelatedPosts(others);
    } else {
      setPost(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!post) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 text-center">
        <SEO title="Article Not Found" description="The requested guide could not be located." />
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Guide Not Found</h1>
          <p className="text-xs text-slate-500 mb-6">
            The article you are looking for may have been updated or moved.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to All Guides</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast('Article link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const brandName = branding.site_name || 'Ra Guppy';
    const text = encodeURIComponent(`Read "${post.title}" on ${brandName}: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Article JSON-LD Structured Data for Google Search
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: [post.featured_image],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: [{
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    }],
    publisher: {
      '@type': 'Organization',
      name: branding.site_name || 'RA Guppy',
      logo: {
        '@type': 'ImageObject',
        url: branding.logo_url?.startsWith('http') ? branding.logo_url : `${typeof window !== 'undefined' ? window.location.origin : 'https://raguppies.vercel.app'}${branding.logo_url || '/logo.jpeg'}`,
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': typeof window !== 'undefined' ? window.location.href : `https://raguppies.vercel.app/blog/${post.slug}`,
    }
  };

  const blogCanonicalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/blog/${post.slug}` 
    : `https://raguppies.vercel.app/blog/${post.slug}`;

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <SEO 
        title={post.meta_title || `${post.title} | ${branding.site_name || 'RA Guppy'} Care Journal`}
        description={post.meta_description || post.excerpt}
        canonical={blogCanonicalUrl}
        ogImage={post.featured_image}
        ogType="article"
        jsonLd={articleSchema}
        keywords={[
          ...post.tags,
          'guppy care guide',
          'pure strain guppy breeding',
          'ra guppy journal'
        ]}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 flex-wrap">
          <Link to="/" className="hover:text-blue-900 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/blog" className="hover:text-blue-900 transition-colors">Care Guides</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
        </nav>

        {/* Article Header Card */}
        <header className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs mb-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs">
              {post.category}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="flex items-center gap-1 text-slate-500 text-xs">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              {post.read_time_minutes} min read
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="flex items-center gap-1 text-slate-500 text-xs">
              <Eye className="w-3.5 h-3.5 text-blue-700" />
              {post.views_count} views
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-display leading-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal border-l-4 border-red-600 pl-4 py-0.5 bg-slate-50 rounded-r-xl">
            {post.excerpt}
          </p>

          {/* Author & Share Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
              />
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">{post.author.name}</div>
                <div className="text-[11px] text-slate-500">{post.author.role} &bull; {formatDate(post.published_at)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Share via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-blue-900" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Copy Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-red-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Featured Hero Image */}
        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm mb-10 bg-slate-900 max-h-[460px]">
          <img
            src={post.featured_image || '/product_image/afr-flower-dorsal-400.jpeg'}
            alt={post.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/product_image/afr-flower-dorsal-400.jpeg';
            }}
            className="w-full h-full object-cover max-h-[460px]"
          />
        </div>

        {/* Article Body Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs mb-10 space-y-6">
          <div 
            className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700
              prose-headings:text-slate-900 prose-headings:font-display prose-headings:font-bold
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-base sm:prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
              prose-p:my-3 prose-p:leading-relaxed
              prose-ul:list-disc prose-ul:pl-5 prose-ul:my-3
              prose-li:my-1.5
              prose-strong:text-slate-900
              prose-blockquote:border-l-4 prose-blockquote:border-blue-900 prose-blockquote:bg-blue-50/50 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-slate-800"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />

          {/* Aquarist Pro Tip Box */}
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 mt-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <strong className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Official {branding.site_name || 'Ra Guppy'} Quality Protocol
              </strong>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Every specimen dispatched from our facility is individually inspected by our biological team, conditioned for 72 hours under zero-stress water parameters, and packed with pharmaceutical-grade oxygen in temperature-controlled EPS thermocol containers.
            </p>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <span>Topics:</span>
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Shop CTA Card */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-12 shadow-md border border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 font-mono">
              Pure Bloodlines In Stock
            </span>
            <h3 className="text-lg sm:text-xl font-bold font-display">
              Ready to Welcome Pure Strain Guppies?
            </h3>
            <p className="text-xs text-slate-300 max-w-lg">
              Explore our current stock of pedigree pairs and trios, acclimated and shipped safely via The Professional Couriers across India.
            </p>
          </div>
          <Link
            to="/shop"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm shrink-0 flex items-center gap-2"
          >
            <span>Explore Pure Strains</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Related Articles Carousel */}
        {relatedPosts.length > 0 && (
          <div className="space-y-4 mb-16">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-900" />
              <span>Recommended Further Reading</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group space-y-2"
                >
                  <img
                    src={r.featured_image}
                    alt={r.title}
                    className="w-full h-28 object-cover rounded-xl"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-blue-900 block">{r.category}</span>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2 mt-1">
                      {r.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{r.read_time_minutes} min read</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};
