import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';

import { HomepageSection } from '../../lib/types';

interface ReviewCarouselProps {
  section?: HomepageSection;
}

export const ReviewCarousel: React.FC<ReviewCarouselProps> = ({ section }) => {
  const reviews = mockDb.getReviews();
  const title = section?.title || 'Reviews from Fishkeepers Across India';
  const subtitle = section?.subtitle || 'Read honest reviews from fish lovers across India on our safe packaging and healthy fish.';

  return (
    <section className="py-14 bg-gradient-to-b from-white via-slate-50/60 to-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aquatic-50 border border-aquatic-200/60 text-aquatic-800 text-[11px] font-bold tracking-wider uppercase mb-3 shadow-2xs">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Customer Feedback</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ocean-950 font-display tracking-tight mb-2.5">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="card-aquatic rounded-2xl p-5 sm:p-7 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-amber-400 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-aquatic-800 font-semibold bg-aquatic-50 px-2.5 py-1 rounded-full border border-aquatic-200/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-aquatic-600" />
                    <span>Verified Fishkeeper</span>
                  </div>
                </div>

                <h3 className="font-bold text-ocean-950 text-sm sm:text-base mb-2">
                  "{rev.title}"
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                  {rev.comment}
                </p>
              </div>

              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-ocean-950">{rev.user_name}</span>
                <span className="text-slate-500 text-[11px] bg-slate-100/80 px-2.5 py-0.5 rounded-md font-medium">The Professional Couriers Delivery</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
