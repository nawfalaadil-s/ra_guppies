import React from 'react';
import { ShieldCheck, Wind, ThermometerSnowflake, HeartPulse } from 'lucide-react';
import { HomepageSection } from '../../lib/types';

interface TrustBadgesProps {
  section?: HomepageSection;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ section }) => {
  const displayTitle = section?.title || 'Why Our Live Fish Arrive Healthy';
  const displaySubtitle = section?.subtitle || 'Dedicated quarantine and temperature-regulated transit protocols for every order across India.';

  return (
    <section className="py-14 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aquatic-50 border border-aquatic-200/60 text-aquatic-800 text-[11px] font-bold tracking-wider uppercase mb-3 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-aquatic-600" />
            <span>Safe Live Fish Transport</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-ocean-950 tracking-tight mb-2.5">
            {displayTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {displaySubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="card-aquatic rounded-2xl p-6 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 text-cyan-700 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:shadow-glow-cyan transition-all duration-300">
              <Wind className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-ocean-950 mb-1.5 group-hover:text-aquatic-700 transition-colors">Medical Pure Oxygen</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We fill each travel bag with pure oxygen. This gives your fish over 72 hours of fresh air to breathe safely.
            </p>
          </div>

          <div className="card-aquatic rounded-2xl p-6 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aquatic-50 to-teal-50 border border-aquatic-100 text-aquatic-700 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:shadow-glow-cyan transition-all duration-300">
              <ThermometerSnowflake className="w-6 h-6 text-aquatic-600" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-ocean-950 mb-1.5 group-hover:text-aquatic-700 transition-colors">Thermal Insulation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              High-density molded crates with seasonal gel packs protect live fish from heat and cold transit swings.
            </p>
          </div>

          <div className="card-aquatic rounded-2xl p-6 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-300">
              <HeartPulse className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-ocean-950 mb-1.5 group-hover:text-aquatic-700 transition-colors">Stress-Coat Water</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We add natural almond leaf extract to the water. It protects their scales and helps fish stay calm on the trip.
            </p>
          </div>

          <div className="card-aquatic rounded-2xl p-6 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:shadow-glow-cyan transition-all duration-300">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-ocean-950 mb-1.5 group-hover:text-aquatic-700 transition-colors">Live Arrival Guarantee</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full transit protection. If any fish does not arrive active and healthy, we issue an instant replacement or refund.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
