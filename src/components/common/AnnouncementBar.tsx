import React from 'react';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { Tag, X, Copy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnnouncementBar: React.FC = () => {
  const { settings, announcementDismissed, dismissAnnouncement } = useStoreSettings();
  const { showToast } = useToast();

  if (!settings.announcement_active || announcementDismissed || !settings.announcement_text) {
    return null;
  }

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (settings.announcement_code) {
      navigator.clipboard.writeText(settings.announcement_code);
      showToast(`Promo code ${settings.announcement_code} copied!`, 'success');
    }
  };

  return (
    <aside 
      aria-label="Promotional announcement"
      className="bg-gradient-to-r from-ocean-950 via-ocean-900 to-ocean-950 text-white border-b border-teal-500/20 text-xs py-2 px-3 sm:px-4 relative z-40 shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 text-center flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-bold text-teal-300 tracking-wide text-[11px] uppercase bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-500/30">
            <Tag className="w-3 h-3 text-teal-400" />
            <span>Special Offer</span>
          </span>
          <span className="text-slate-100 text-xs font-medium">
            {settings.announcement_text}
          </span>
          {settings.announcement_code && (
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Click to copy coupon code"
              aria-label={`Copy coupon code ${settings.announcement_code}`}
            >
              <span>{settings.announcement_code}</span>
              <Copy className="w-3 h-3 text-teal-300" />
            </button>
          )}
          {settings.announcement_link && (
            <Link
              to={settings.announcement_link}
              className="inline-flex items-center gap-1 text-xs text-teal-300 hover:text-white underline underline-offset-2 font-semibold transition-colors"
            >
              <span>Shop Collection</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          )}
        </div>
        <button
          onClick={dismissAnnouncement}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Dismiss promotional announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
