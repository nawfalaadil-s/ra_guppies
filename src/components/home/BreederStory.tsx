import React from 'react';
import { Heart, ShieldCheck, MessageCircle, CheckCircle2 } from 'lucide-react';
import { HomepageSection } from '../../lib/types';

interface BreederStoryProps {
  section?: HomepageSection;
}

export const BreederStory: React.FC<BreederStoryProps> = ({ section }) => {
  const config = section?.config || {};
  const quote = config.quote || section?.title || '"We are hobbyists first, breeders second, and sellers last."';
  const tag = section?.subtitle || config.subtitle || 'Direct From Hobbyist Breeders';
  const description = config.description || 'We started RA Guppy to put fish care first. Every pure strain Guppy lives in conditioned tanks with pristine water chemistry, biological filtration, and live micro-nutrition until safely dispatched to your home.';
  const rawWhatsapp = config.whatsapp || config.whatsapp_number || '+91 89211 90590';
  const whatsappClean = rawWhatsapp.replace(/[^0-9]/g, '');
  const facilityImage = config.facilityImage || config.image_url || config.facility_image || "/product_image/guppy-grass-50.jpeg";
  const experienceYears = config.experienceYears || config.experience_years || '9+ Years Experience';
  const facilityLocation = config.facilityLocation || config.location || 'Kerala & Tamil Nadu Hatcheries';

  return (
    <section className="py-16 bg-gradient-to-b from-white via-slate-50/70 to-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Visual Story (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden shadow-elevated border border-slate-200/90 bg-white relative group">
              <img
                src={facilityImage}
                alt="Aquarist caring for pedigree Guppy strains in natural planted biotope tanks"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 glass-ocean p-3.5 rounded-2xl text-white shadow-lg">
                <span className="text-xs font-bold tracking-wide text-white block">
                  {facilityLocation} ({experienceYears})
                </span>
                <p className="text-[11px] text-ocean-200 mt-0.5 leading-snug">
                  Natural planted biotope tanks with optimal minerals and bio-filtration.
                </p>
              </div>
            </div>

            {/* Floating Human Touch Badge */}
            <div className="absolute -top-3 -right-3 bg-white p-3.5 rounded-2xl shadow-card border border-slate-200/80 hidden sm:flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Heart className="w-4.5 h-4.5 fill-rose-600" />
              </div>
              <div className="text-xs">
                <strong className="block text-ocean-950 font-bold">Ethical Fishkeeping</strong>
                <span className="text-slate-500 text-[11px]">Conditioned with live moina & micro-nutrition</span>
              </div>
            </div>
          </div>

          {/* Right Text & Human Commitments (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aquatic-50 border border-aquatic-200/60 text-aquatic-800 text-[11px] font-bold tracking-wider uppercase mb-3 shadow-2xs">
                {tag}
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-ocean-950 font-display tracking-tight leading-tight">
                {quote}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="card-aquatic p-4 rounded-2xl">
                <div className="flex items-center gap-2.5 font-bold text-ocean-950 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-aquatic-100/80 text-aquatic-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-aquatic-700" />
                  </div>
                  <span>WYSIWYG: Exact Bloodline Strain</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs pl-8">
                  High-pedigree breeding pairs & trios inspected for genetic purity and vitality.
                </p>
              </div>

              <div className="card-aquatic p-4 rounded-2xl">
                <div className="flex items-center gap-2.5 font-bold text-ocean-950 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-aquatic-100/80 text-aquatic-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-aquatic-700" />
                  </div>
                  <span>Pure Medical Oxygen Packing</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs pl-8">
                  Double bagged with medical oxygen & temperature insulation via Professional Couriers.
                </p>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <a
                href={`https://wa.me/${whatsappClean || '918921190590'}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary shadow-glow-cyan"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Ask our Aquarist on WhatsApp</span>
              </a>
              <span className="text-xs text-slate-500">
                Need tank cycling advice or water parameters? We reply daily.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
