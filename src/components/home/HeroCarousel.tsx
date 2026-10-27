import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, MessageCircle, Play, Pause } from 'lucide-react';
import { HomepageSection } from '../../lib/types';

interface HeroCarouselProps {
  section?: HomepageSection;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ section }) => {
  const config = section?.config || {};
  const badge = config.badge || config.badge_text || 'RA Guppy Breeding Facility • 100% Live Arrival Guarantee';
  const title = section?.title || 'Hand-Conditioned Pure Strain Guppies, Delivered Safely to Your Door.';
  const subtitle = section?.subtitle || 'You get healthy, high-grade pure strain show guppy pairs. Raised in mineralized planted systems and shipped safely in pressurized oxygen packaging.';
  const ctaPrimary = config.ctaPrimary || config.cta_text || 'Explore Rare Strains';
  const ctaPrimaryLink = config.ctaPrimaryLink || config.cta_link || '/shop';
  const ctaSecondary = config.ctaSecondary || config.secondary_cta_text || 'Live Stock Video';
  const ctaSecondaryLink = config.ctaSecondaryLink || config.secondary_cta_link || '/live-stock';
  const image = config.backgroundImage || config.background_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80';
  const video = config.backgroundVideo || config.background_video || '';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (!video) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [video]);

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-950 text-white border-b border-ocean-800/80 overflow-hidden">
      {/* Subtle Aquatic Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/70 text-teal-200 text-xs font-bold border border-teal-500/30 shadow-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{badge}</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.12]">
              {title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to={ctaPrimaryLink}
                className="btn-accent px-6 text-sm font-bold shadow-glow-blue"
              >
                <span>{ctaPrimary}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                to={ctaSecondaryLink}
                className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md transition-all active:scale-95"
              >
                <Play className="w-4 h-4 text-teal-300 fill-teal-300/40" />
                <span>{ctaSecondary}</span>
              </Link>
            </div>

            {/* Trust Highlights Mini Strip */}
            <div className="pt-6 border-t border-ocean-800/80 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Live Arrival Guarantee</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Truck className="w-4 h-4 text-teal-400" />
                <span>The Professional Couriers</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Breeder WhatsApp Support</span>
              </div>
            </div>
          </div>

          {/* Right Hero Media Card (Supports Image & Ambient Showcase Video) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden bg-ocean-950 border border-teal-500/30 shadow-elevated aspect-[4/3] sm:aspect-[16/11]">
              {video ? (
                <>
                  <video
                    ref={videoRef}
                    src={video}
                    poster={image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  {/* Play/Pause accessible toggle */}
                  <button
                    type="button"
                    onClick={toggleVideoPlayback}
                    className="absolute top-3 right-3 p-2 rounded-full bg-ocean-950/80 hover:bg-ocean-900 text-white backdrop-blur-md transition-all shadow-md focus-visible:ring-2 focus-visible:ring-teal-400"
                    aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-teal-500/90 text-slate-950 text-[10px] font-black tracking-wider uppercase backdrop-blur-xs flex items-center gap-1 shadow-xs">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    HD Footage
                  </span>
                </>
              ) : (
                <img
                  src={image}
                  alt={title}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-3 left-3 right-3 bg-ocean-950/90 backdrop-blur-md rounded-2xl p-3.5 border border-ocean-700/60 shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">
                    WYSIWYG Proven Stock
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-white block truncate">
                    Electric Blue Pure Strain Pair
                  </span>
                </div>
                <Link
                  to="/product/electric-blue-guppy-pair-300"
                  className="btn-accent px-3.5 py-1.5 text-xs min-h-[36px]"
                >
                  Adopt
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
