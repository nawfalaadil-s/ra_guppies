import React, { useState } from 'react';
import { Send, Check, Mail, Sparkles } from 'lucide-react';
import { HomepageSection } from '../../lib/types';

interface NewsletterSectionProps {
  section?: HomepageSection;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ section }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const title = section?.title || 'Join The VIP Fish Club';
  const subtitle = section?.subtitle || 'Be the first to know when rare wild hybrids, pure strain guppies, and master show specimens are listed.';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
    }, 2000);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-950 text-white relative overflow-hidden border-b border-ocean-800">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-aquatic-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-aquatic-500/20 border border-aquatic-400/30 text-aquatic-300 text-xs font-semibold mb-4 shadow-glow-cyan">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Priority Live Stock Alerts</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight mb-3">
          {title}
        </h2>

        <p className="text-xs sm:text-sm text-ocean-200 max-w-xl mx-auto mb-8 leading-relaxed font-light">
          {subtitle}
        </p>

        <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-ocean-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-ocean-300 outline-none focus:border-cyan-400 focus:bg-white/15 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={subscribed}
            className="btn-accent shrink-0 py-3 px-6 flex items-center justify-center gap-2 font-bold shadow-glow-cyan"
          >
            {subscribed ? (
              <>
                <Check className="w-4 h-4" />
                <span>Subscribed!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Subscribe</span>
              </>
            )}
          </button>
        </form>

        <p className="text-2xs text-ocean-300 mt-4">
          No spam, ever. Unsubscribe at any time with one click.
        </p>
      </div>
    </section>
  );
};
