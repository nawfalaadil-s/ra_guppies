import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Phone, Calendar } from 'lucide-react';
import { mockDb } from '../lib/mockDatabase';
import { formatDate } from '../lib/utils';
import { CMSPage as CMSPageType } from '../lib/types';
import { fetchSupabaseCMSPages } from '../lib/supabaseSync';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { SEO } from '../components/common/SEO';

export const CMSPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CMSPageType | null>(() => mockDb.getCMSPageBySlug(slug || '') || null);

  useEffect(() => {
    // Check local cached version
    const cached = mockDb.getCMSPageBySlug(slug || '');
    if (cached) setPage(cached);

    // Fetch live CMS pages from Supabase so any browser sees newly published pages
    fetchSupabaseCMSPages().then(pages => {
      const match = pages.find(p => p.slug === slug);
      if (match) {
        setPage(match);
      }
    });

    const handleUpdate = () => {
      const updated = mockDb.getCMSPageBySlug(slug || '');
      if (updated) setPage(updated);
    };
    window.addEventListener('ba_cms_pages_updated', handleUpdate);
    return () => window.removeEventListener('ba_cms_pages_updated', handleUpdate);
  }, [slug]);

  if (!page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">The article or informational guide you are looking for has moved.</p>
        <Link to="/" className="px-5 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <SEO 
        title={page.meta_title || `${page.title} | ${settings.brand_name || 'RA Guppy'}`}
        description={page.meta_description || `Official documentation, acclimation guidelines, and terms for ${page.title} at ${settings.brand_name || 'RA Guppy'}.`}
        canonical={typeof window !== 'undefined' ? `${window.location.origin}/page/${page.slug}` : `https://raguppies.vercel.app/page/${page.slug}`}
        keywords={[
          page.title.toLowerCase(),
          'guppy shipping guide',
          'guppy doa policy',
          'guppy acclimation',
          'ra guppy india'
        ]}
      />

      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-950 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Page Article Card */}
        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 inline-block mb-3">
              Official Guide & Policy
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-blue-950 font-display leading-tight mb-3">
              {page.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Updated {formatDate(page.updated_at)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-blue-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Verified by Head Biologist
              </span>
            </div>
          </div>

          {/* Rendered HTML */}
          <div 
            className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: page.content_html }}
          />

          {/* Need Help Box */}
          <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Have Questions About Your Specimen?</h3>
              <p className="text-xs text-slate-500">Our aquarists are available on WhatsApp for direct guidance.</p>
            </div>
            <a
              href={`https://wa.me/${(settings.whatsapp_number || settings.contact_phone || '918921190590').replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors shrink-0"
            >
              <Phone className="w-4 h-4 text-red-400" />
              <span>Chat With Specialist</span>
            </a>
          </div>
        </article>
      </div>
    </div>
  );
};
