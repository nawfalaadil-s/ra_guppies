import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockDb } from '../../lib/mockDatabase';
import { ProductCard } from '../common/ProductCard';
import { Product, HomepageSection } from '../../lib/types';

interface SpecimenShowcaseProps {
  section?: HomepageSection;
  onQuickView?: (product: Product) => void;
}

const STRAIN_TABS = [
  { id: 'all', label: 'All Guppies & Fish' },
  { id: 'Half Moon', label: 'Half Moon' },
  { id: 'Dumbo', label: 'Dumbo Ear' },
  { id: 'Albino', label: 'Albino / AFR' },
  { id: 'Blue', label: 'Blue / Mosaic' },
];

export const SpecimenShowcase: React.FC<SpecimenShowcaseProps> = ({ section, onQuickView }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [allProducts, setAllProducts] = useState<Product[]>(() => mockDb.getProducts());

  useEffect(() => {
    const handleUpdate = () => {
      setAllProducts(mockDb.getProducts());
    };
    window.addEventListener('ba_products_updated', handleUpdate);
    return () => window.removeEventListener('ba_products_updated', handleUpdate);
  }, []);

  const targetCategory = section?.config?.filterCategory || section?.config?.category;
  let pool = targetCategory ? allProducts.filter((p) => p.category_id === targetCategory) : [];
  if (pool.length === 0) {
    const fishProducts = allProducts.filter((p) => p.strain);
    pool = fishProducts.length > 0 ? fishProducts : allProducts;
  }

  const title = section?.title || 'Guppies by Strain & Lineage Variety';
  const subtitle = section?.subtitle || 'Select a strain to filter our quarantined live inventory across India.';
  const ctaLink = section?.config?.ctaLink || section?.config?.cta_link || '/shop';

  const filtered = pool.filter((p) => {
    if (activeTab === 'all') return true;
    const search = activeTab.toLowerCase();
    return (
      (p.strain && p.strain.toLowerCase().includes(search)) ||
      (p.name && p.name.toLowerCase().includes(search))
    );
  });
  const displayed = filtered.length > 0 ? filtered : pool;

  return (
    <section className="py-14 bg-slate-50/70 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <span className="text-[11px] font-bold text-teal-700 block mb-1 uppercase tracking-wider">
              Live Stock Catalog
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ocean-950 font-display tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              {subtitle}
            </p>
          </div>

          {/* Strain Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {STRAIN_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-ocean-950 text-white shadow-xs' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {displayed.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex justify-center">
          <Link
            to={ctaLink}
            className="btn-primary px-6 text-xs sm:text-sm shadow-xs"
          >
            <span>Explore All {pool.length} Living Specimens</span>
            <ArrowRight className="w-4 h-4 text-teal-300 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};
