import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Thermometer, Utensils, HeartHandshake, ArrowRight } from 'lucide-react';

const GUIDES = [
  {
    icon: Droplet,
    title: 'Water Chemistry & Hardness',
    description: 'Guppies thrive in hard, slightly alkaline water (pH 7.2 - 8.2, GH 10-18 dGH). Buffer with trace minerals and gentle sponge filtration.',
    metric: 'pH 7.2 - 8.2',
  },
  {
    icon: Thermometer,
    title: 'Temperature Stability',
    description: 'Guppies thrive between 24°C and 27°C. Use a reliable thermostat heater to keep temperatures consistent.',
    metric: '24°C - 27°C',
  },
  {
    icon: Utensils,
    title: 'Nutrition & Live Feeds',
    description: 'Feed high-protein micro-pellets and live Moina or freshly hatched baby brine shrimp for optimal caudal fin development.',
    metric: 'Live Foods & Pellets',
  },
  {
    icon: HeartHandshake,
    title: 'Safe Drip Acclimation',
    description: 'Float the bag for 20 minutes, drip tank water slowly over 30 minutes, then net fish gently without transit water.',
    metric: '40-Min Drip Protocol',
  }
];

import { HomepageSection } from '../../lib/types';

interface CareGuideSectionProps {
  section?: HomepageSection;
}

export const CareGuideSection: React.FC<CareGuideSectionProps> = ({ section }) => {
  const title = section?.title || 'Essential Pure Strain Guppy Care Guide';
  const subtitle = section?.subtitle || 'Simple guidelines to ensure your new fish acclimates easily and thrives.';

  return (
    <section className="py-14 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aquatic-50 border border-aquatic-200/60 text-aquatic-800 text-[11px] font-bold tracking-wider uppercase mb-3 shadow-2xs">
            <Droplet className="w-3.5 h-3.5 text-aquatic-600" />
            <span>Fishkeeping Knowledge</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ocean-950 font-display tracking-tight mb-2.5">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {GUIDES.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div
                key={idx}
                className="group card-aquatic rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aquatic-50 to-cyan-50 border border-aquatic-100/80 text-aquatic-700 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:shadow-glow-cyan transition-all duration-300">
                    <Icon className="w-5 h-5 text-aquatic-700" />
                  </div>
                  <h3 className="font-bold text-ocean-950 text-sm sm:text-base mb-2 group-hover:text-aquatic-700 transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {g.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Optimal:</span>
                  <span className="font-bold text-ocean-900 bg-ocean-50/80 px-2.5 py-1 rounded-md border border-ocean-100 font-mono text-[11px]">
                    {g.metric}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs sm:text-sm">
          <Link
            to="/blog"
            className="btn-primary shadow-glow-cyan"
          >
            <span>Explore All Educational Care Guides</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
          <Link
            to="/page/shipping-acclimation"
            className="inline-flex items-center gap-1.5 font-semibold text-ocean-900 hover:text-aquatic-600 hover:underline transition-colors"
          >
            <span>Read Acclimation & Live Arrival Policy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
