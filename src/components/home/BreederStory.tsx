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
  const facilityImage = config.facilityImage || config.image_url || config.facility_image || "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80";
  const experienceYears = config.experienceYears || config.experience_years || '9+ Years Experience';
  const facilityLocation = config.facilityLocation || config.location || 'Kerala & Tamil Nadu Hatcheries';

  return (
    <section className="py-14 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Visual Story (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white relative">
              <img
                src={facilityImage}
                alt="Aquarist caring for pedigree Guppy strains in natural planted biotope tanks"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-xs p-3 rounded-2xl border border-slate-800 text-white shadow-sm">
                <span className="text-xs font-bold tracking-wide text-white block">
                  {facilityLocation} ({experienceYears})
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Natural planted biotope tanks with optimal minerals and bio-filtration.
                </p>
              </div>
            </div>

            {/* Floating Human Touch Badge */}
            <div className="absolute -top-3 -right-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 fill-red-600" />
              </div>
              <div className="text-xs">
                <strong className="block text-slate-900 font-bold">Ethical Fishkeeping</strong>
                <span className="text-slate-600 text-xs">Conditioned with live moina & micro-nutrition</span>
              </div>
            </div>
          </div>

          {/* Right Text & Human Commitments (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full inline-block mb-2.5 border border-blue-200">
                {tag}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
                {quote}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>WYSIWYG: Exact Bloodline Strain</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  High-pedigree breeding pairs & trios inspected for genetic purity and vitality.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>Pure Medical Oxygen Packing</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Double bagged with medical oxygen & temperature insulation via Professional Couriers.
                </p>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <a
                href={`https://wa.me/${whatsappClean || '919876543210'}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Ask our Aquarist on WhatsApp</span>
              </a>
              <span className="text-xs text-slate-600">
                Need tank cycling advice or water parameters? We reply daily.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
