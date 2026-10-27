import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { HomepageSection, Category, Product } from '../../lib/types';

interface CategoryBarProps {
  section?: HomepageSection;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ section }) => {
  const [categories, setCategories] = useState<Category[]>(() => mockDb.getCategories());
  const [products, setProducts] = useState<Product[]>(() => mockDb.getProducts());

  useEffect(() => {
    const handleUpdate = () => {
      setCategories(mockDb.getCategories());
      setProducts(mockDb.getProducts());
    };
    window.addEventListener('ba_categories_updated', handleUpdate);
    window.addEventListener('ba_products_updated', handleUpdate);
    return () => {
      window.removeEventListener('ba_categories_updated', handleUpdate);
      window.removeEventListener('ba_products_updated', handleUpdate);
    };
  }, []);

  const title = section?.title || 'Explore By Category';
  const subtitle = section?.subtitle || 'Curated Collections';
  const viewAllLink = section?.config?.viewAllLink || '/shop';

  return (
    <section className="py-12 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[11px] font-bold text-teal-700 block mb-1 uppercase tracking-wider">
              {subtitle}
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-ocean-950 font-display">
              {title}
            </h2>
          </div>
          <Link
            to={viewAllLink}
            className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 group transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category Carousel on Mobile / Grid on Desktop */}
        <div className="flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pb-2 snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.filter((c) => c.is_active !== false).map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            return (
              <Link
                key={cat.id}
                to={`/shop?cat=${cat.id}`}
                className="w-32 shrink-0 snap-start sm:w-auto group relative bg-slate-50/80 hover:bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 hover:border-teal-500/50 shadow-2xs hover:shadow-card-hover transition-all duration-300 flex flex-col p-2.5 text-center"
              >
                <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 mb-2 relative">
                  <img
                    src={cat.image_url || '/product_image/afr-flower-dorsal-400.jpeg'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/product_image/afr-flower-dorsal-400.jpeg';
                    }}
                  />
                  <div className="absolute inset-0 bg-ocean-950/20 group-hover:bg-ocean-950/5 transition-colors" />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-ocean-950 group-hover:text-teal-700 transition-colors line-clamp-1 font-display">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {count} {count === 1 ? 'Variety' : 'Varieties'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
