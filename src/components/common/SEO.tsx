import React, { useEffect } from 'react';
import { useBranding } from '../../contexts/BrandingContext';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, any> | Record<string, any>[];
  keywords?: string[];
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogImage = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
  ogType = 'website',
  jsonLd,
  keywords = ['guppy fish online', 'buy guppy fish india', 'pure strain guppy pairs', 'aquarium plants india', 'live fish delivery'],
}) => {
  const { activeSettings, branding } = useBranding();
  const currentSettings = activeSettings || branding;
  const brandName = currentSettings.site_name || 'Ra Guppy';
  const tagline = currentSettings.tagline || 'Pure Strain Guppies & Aquatic Sanctuary';

  const defaultDesc = `${brandName} is India's premier ornamental livebearer sanctuary. Hand-conditioned pure strain guppies, live plants, and starter food cultures with guaranteed 100% live arrival.`;
  const sanitizeText = (txt: string) =>
    txt
      .replace(/Betta Aquatics India/gi, brandName)
      .replace(/Betta Aquatics/gi, brandName)
      .replace(/Bettas & Ornamental/gi, 'Exotic Breeding Pairs & Ornamental')
      .replace(/Show Bettas/gi, 'Exotic Breeding Pairs')
      .replace(/Bettas/gi, 'Show Guppies')
      .replace(/Betta Fish/gi, 'Guppy Fish')
      .replace(/Betta/gi, 'Guppy');

  const metaDesc = sanitizeText(description || defaultDesc);
  const sanitizedTitle = sanitizeText(title || '');

  const fullTitle = sanitizedTitle 
    ? (sanitizedTitle.toLowerCase().includes(brandName.toLowerCase()) ? sanitizedTitle : `${sanitizedTitle} | ${brandName}`)
    : `${brandName} — ${tagline}`;

  useEffect(() => {
    // 1. Update Document Title
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Set Meta Descriptions & Keywords
    setMeta('name', 'description', metaDesc);
    setMeta('name', 'keywords', keywords.join(', '));
    setMeta('name', 'robots', 'index, follow');

    // 3. Open Graph Tags
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', metaDesc);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:site_name', brandName);
    if (canonical) {
      setMeta('property', 'og:url', canonical);
    }

    // 4. Twitter Cards
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', metaDesc);
    setMeta('name', 'twitter:image', ogImage);

    // 5. Canonical Link
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }

    // 6. JSON-LD Structured Data
    let scriptTag = document.querySelector('script[data-id="schema-jsonld"]');
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('data-id', 'schema-jsonld');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [fullTitle, description, canonical, ogImage, ogType, jsonLd, keywords]);

  return null;
};
