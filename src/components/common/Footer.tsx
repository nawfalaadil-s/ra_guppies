import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Sparkles, Send, Phone, Mail, Award, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useBranding } from '../../contexts/BrandingContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  const { showToast } = useToast();
  const { activeSettings, branding } = useBranding();
  const { settings } = useStoreSettings();
  const currentSettings = activeSettings || branding;
  const brandTitle = settings.brand_name || currentSettings.site_name || 'Ra Guppy';
  const brandParts = brandTitle.trim().split(/\s+/);
  const firstWord = brandParts[0] || 'RA';
  const restWords = brandParts.slice(1).join(' ');

  const whatsappDisplay = settings.whatsapp_number || settings.contact_phone || '+91 89211 90590';
  const whatsappClean = (settings.whatsapp_number || settings.contact_phone || '918921190590').replace(/\D/g, '');
  const supportEmail = settings.contact_email || 'raguppies00@gmail.com';
  const tagline = settings.tagline || currentSettings.tagline || "India's trusted online live fish sanctuary. We deliver healthy pure strain guppies, live aquarium plants, and live food cultures safely across India.";

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setSubscribed(true);
    showToast('Subscribed! You will receive new livestock drop alerts.', 'success');
    setEmail('');
  };

  return (
    <footer className="bg-ocean-950 text-slate-300 border-t border-ocean-800/80 pt-12 pb-24 md:pb-12 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Value Prop Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pb-10 border-b border-ocean-800/80">
          <div className="flex items-center gap-3 p-3.5 bg-ocean-900/60 rounded-2xl border border-ocean-800/80 hover:border-aquatic-500/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-aquatic-500/10 text-aquatic-400 flex items-center justify-center shrink-0 border border-aquatic-500/20">
              <ShieldCheck className="w-5 h-5 text-aquatic-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">Live Arrival</div>
              <div className="text-[11px] text-ocean-300">100% Guaranteed DOA Policy</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-ocean-900/60 rounded-2xl border border-ocean-800/80 hover:border-cyan-500/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
              <Truck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">The Professional Couriers</div>
              <div className="text-[11px] text-ocean-300">Express Road Delivery</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-ocean-900/60 rounded-2xl border border-ocean-800/80 hover:border-amber-500/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">WYSIWYG Fish</div>
              <div className="text-[11px] text-ocean-300">Exact Specimen Pictured</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-ocean-900/60 rounded-2xl border border-ocean-800/80 hover:border-emerald-500/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">Health Quarantined</div>
              <div className="text-[11px] text-ocean-300">72h Tank Conditioned</div>
            </div>
          </div>
        </div>

        {/* Links and Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-10 border-b border-ocean-800/80">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-ocean-700">
                <BrandLogo variant="footer" className="w-full h-full" imgClassName="w-full h-full object-contain" />
              </div>
              <span className="font-display font-extrabold text-lg text-white tracking-tight uppercase">
                {firstWord} {restWords && <span className="text-aquatic-400">{restWords}</span>}
              </span>
            </div>
            <p className="text-xs text-ocean-300 leading-relaxed mb-5 max-w-sm font-normal">
              {tagline}
            </p>
            <div className="flex flex-col gap-2.5 text-xs">
              <a href={`https://wa.me/${whatsappClean}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-white hover:text-aquatic-300 transition-colors">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span>WhatsApp: {whatsappDisplay}</span>
              </a>
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-2.5 text-ocean-300 hover:text-white transition-colors">
                <div className="w-6 h-6 rounded-md bg-ocean-800 text-ocean-300 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>{supportEmail}</span>
              </a>
            </div>
          </div>

          {/* Catalog Col */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3.5 font-display flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-aquatic-400"></span>
              <span>Livestock</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-ocean-200">
              <li><Link to="/shop?cat=cat-guppy" className="hover:text-aquatic-300 transition-colors">Pure Strain Guppies</Link></li>
              <li><Link to="/shop?cat=cat-guppy" className="hover:text-aquatic-300 transition-colors">Imported Show Pairs</Link></li>
              <li><Link to="/shop?cat=cat-pairs" className="hover:text-aquatic-300 transition-colors">Breeding Pairs & Trios</Link></li>
              <li><Link to="/shop?cat=cat-plants" className="hover:text-aquatic-300 transition-colors">Live Aquarium Plants</Link></li>
              <li><Link to="/shop?cat=cat-food" className="hover:text-aquatic-300 transition-colors">Fish Food & Starter Cultures</Link></li>
              <li><Link to="/shop?cat=cat-accessories" className="hover:text-aquatic-300 transition-colors">Water Conditioners & Supplies</Link></li>
            </ul>
          </div>

          {/* Guides Col */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3.5 font-display flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>Customer Support</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-ocean-200">
              <li><Link to="/blog" className="hover:text-white transition-colors font-semibold text-white">Care Guides & Breeding Journal</Link></li>
              <li><Link to="/page/shipping-acclimation" className="hover:text-white transition-colors">Acclimation & DOA Policy</Link></li>
              <li><Link to="/page/faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
              <li><Link to="/account/orders" className="hover:text-white transition-colors">Track Consignment</Link></li>
              <li><Link to="/page/about-us" className="hover:text-white transition-colors">About Our Facility</Link></li>
              <li><Link to="/admin" className="text-ocean-400 hover:text-white transition-colors font-semibold">Admin Operations</Link></li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2 font-display">Livestock Alerts</h4>
            <p className="text-xs text-ocean-300 mb-3 font-normal">
              Receive updates when new pure strain Guppy pairs, live plants, and starter cultures arrive.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <input
                id="footer-email-input"
                type="email"
                aria-label="Email address for livestock drop alerts"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-ocean-900/90 border border-ocean-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-ocean-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              <button
                type="submit"
                className="btn-accent w-full font-bold shadow-glow-cyan"
              >
                {subscribed ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Subscribed!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Subscribe to Drops</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ocean-300">
          <div>
            © {new Date().getFullYear()} {brandTitle} India. All rights reserved.
          </div>
          <div className="text-xs text-ocean-300 text-center sm:text-right font-light">
            <span>Live Arrival Guarantee: Record a short video of the unopened box within 2 hours of delivery for a fast replacement or refund.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
