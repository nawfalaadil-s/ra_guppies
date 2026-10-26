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
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold text-blue-900 block mb-1">
            Fishkeeping Knowledge
          </span>
          <h2 className="text-xl sm:text-3xl font-bold text-slate-900 font-display mb-2">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {GUIDES.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                    {g.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {g.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Optimal:</span>
                  <span className="font-bold text-slate-900 font-mono text-xs">{g.metric}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs sm:text-sm">
          <Link
            to="/blog"
            className="btn-primary"
          >
            <span>Explore All Educational Care Guides</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
          <Link
            to="/page/shipping-acclimation"
            className="inline-flex items-center gap-1.5 font-semibold text-blue-900 hover:underline"
          >
            <span>Read Acclimation & Live Arrival Policy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
