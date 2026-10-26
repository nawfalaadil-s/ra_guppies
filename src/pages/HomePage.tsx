import React, { useState, useEffect } from 'react';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { CategoryBar } from '../components/home/CategoryBar';
import { FlashDealSection } from '../components/home/FlashDealSection';
import { SpecimenShowcase } from '../components/home/SpecimenShowcase';
import { BreederStory } from '../components/home/BreederStory';
import { CareGuideSection } from '../components/home/CareGuideSection';
import { TrustBadges } from '../components/home/TrustBadges';
import { ReviewCarousel } from '../components/home/ReviewCarousel';
import { NewsletterSection } from '../components/home/NewsletterSection';
import { QuickViewModal } from '../components/common/QuickViewModal';
import { SEO } from '../components/common/SEO';
import { Product, HomepageSection } from '../lib/types';
import { mockDb } from '../lib/mockDatabase';
import { useBranding } from '../contexts/BrandingContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { fetchSupabaseHomepageSections } from '../lib/supabaseSync';

export const HomePage: React.FC = () => {
  const { branding } = useBranding();
  const { settings } = useStoreSettings();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sections, setSections] = useState<HomepageSection[]>(() => {
    const list = mockDb.getHomepageSections();
    return list.filter(s => s.is_active).sort((a, b) => a.display_order - b.display_order);
  });

  useEffect(() => {
    // Fetch live sections from Supabase cloud so all devices & browsers see the latest CMS changes
    fetchSupabaseHomepageSections().then((list) => {
      if (list && list.length > 0) {
        setSections(list.filter(s => s.is_active).sort((a, b) => a.display_order - b.display_order));
      }
    });

    const handleUpdate = (e?: Event) => {
      const customEvent = e as CustomEvent<HomepageSection[]>;
      const list = customEvent?.detail || mockDb.getHomepageSections();
      setSections(list.filter(s => s.is_active).sort((a, b) => a.display_order - b.display_order));
    };
    window.addEventListener('ba_homepage_updated', handleUpdate);
    return () => window.removeEventListener('ba_homepage_updated', handleUpdate);
  }, []);

  const renderSection = (sec: HomepageSection) => {
    switch (sec.type) {
      case 'hero':
        return <HeroCarousel key={sec.id} section={sec} />;
      case 'categories':
        return <CategoryBar key={sec.id} section={sec} />;
      case 'flash_deal':
        return <FlashDealSection key={sec.id} section={sec} onQuickView={(p) => setQuickViewProduct(p)} />;
      case 'specimen_showcase':
      case 'curated_collection':
        return <SpecimenShowcase key={sec.id} section={sec} onQuickView={(p) => setQuickViewProduct(p)} />;
      case 'breeder_story':
        return <BreederStory key={sec.id} section={sec} />;
      case 'trust_badges':
        return <TrustBadges key={sec.id} section={sec} />;
      case 'care_guide':
        return <CareGuideSection key={sec.id} section={sec} />;
      case 'testimonials':
        return <ReviewCarousel key={sec.id} section={sec} />;
      case 'newsletter':
        return <NewsletterSection key={sec.id} section={sec} />;
      default:
        return null;
    }
  };

  const currentBrand = branding.site_name || 'RA Guppy';
  const currentTagline = branding.tagline || 'India\'s Premier Pure Strain Guppy Store & Breeding Pairs';

  // Schema.org Structured Data for WebSite, Organization & OnlineStore
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://raguppies.vercel.app';
  const homepageSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: currentBrand,
      url: originUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${originUrl}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: currentBrand,
      url: originUrl,
      logo: branding.logo_url?.startsWith('http') ? branding.logo_url : `${originUrl}${branding.logo_url || '/logo.jpeg'}`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: settings.whatsapp_number || settings.contact_phone || '+91-89211-90590',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi', 'Tamil', 'Malayalam'],
      },
      sameAs: [
        `https://wa.me/${(settings.whatsapp_number || settings.contact_phone || '918921190590').replace(/\D/g, '')}`,
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'OnlineStore',
      name: `${currentBrand} — Pure Strain Guppy Sanctuary`,
      url: originUrl,
      description: 'India\'s premier specialized pure strain guppy breeder. Order show-grade Albino Full Red (AFR), Electric Blue, Tiger Half Moon, Green Platinum breeding pairs, planted aquarium flora, and live Moina cultures with 100% Live Arrival Guarantee.',
      image: `${originUrl}/logo.jpeg`,
      priceRange: '₹50 - ₹500',
      currenciesAccepted: 'INR',
      paymentAccepted: 'UPI, Google Pay, PhonePe, Paytm, Direct Bank Transfer',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Pure Strain Guppy & Livebearer Catalog',
        itemListElement: [
          {
            '@type': 'OfferCatalog',
            name: 'Pure Strain Guppy Breeding Pairs',
          },
          {
            '@type': 'OfferCatalog',
            name: 'Live Planted Tank Aquarium Plants',
          },
          {
            '@type': 'OfferCatalog',
            name: 'Live Moina Starter Cultures & High-Protein Fry Pellets',
          },
        ],
      },
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Homepage SEO Meta & JSON-LD */}
      <SEO
        title={`${currentBrand} — ${currentTagline}`}
        description="India's premier pure strain guppy breeder and online store. Buy show-grade Albino Full Red (AFR), Electric Blue, Tiger Half Moon breeding pairs, aquatic plants, and live Moina starter cultures with 100% Live Arrival Guarantee across India."
        canonical={originUrl}
        jsonLd={homepageSchema}
        keywords={[
          'buy guppy fish online india',
          'pure strain guppy pairs',
          'guppy breeding pairs india',
          'albino full red guppy pair',
          'electric blue guppy',
          'tiger half moon guppy pair',
          'green platinum dumbo guppy',
          'purple mosaic guppy',
          'live guppy delivery india',
          'guppy fish price in india',
          'live aquatic plants for guppies',
          'live moina starter culture online',
          'insecta pro guppy feed',
          'ra guppy'
        ]}
      />

      {/* Dynamic Database-Driven CMS Sections */}
      {sections.map(renderSection)}

      {/* Global Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
