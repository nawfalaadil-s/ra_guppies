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
    <section className="relative bg-white border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-900 text-xs font-semibold border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>{badge}</span>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl text-blue-900 tracking-tight leading-[1.15]">
              {title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-normal">
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={ctaPrimaryLink}
                className="btn-primary"
              >
                <span>{ctaPrimary}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                to={ctaSecondaryLink}
                className="btn-secondary"
              >
                <span>{ctaSecondary}</span>
              </Link>
            </div>

            {/* Trust Highlights Mini Strip */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-900" />
                <span>100% Live Arrival Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Truck className="w-4 h-4 text-blue-900" />
                <span>The Professional Couriers</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <MessageCircle className="w-4 h-4 text-blue-900" />
                <span>Breeder WhatsApp Support</span>
              </div>
            </div>
          </div>

          {/* Right Hero Media Card (Supports Image & Ambient Showcase Video) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm aspect-[4/3] sm:aspect-[16/11]">
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
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs flex items-center gap-1">
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
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-900 block">
                    WYSIWYG Specimen
                  </span>
                  <span className="font-bold text-xs text-slate-900 block truncate">
                    Electric Blue Pure Strain Pair
                  </span>
                </div>
                <Link
                  to="/product/electric-blue-guppy-pair"
                  className="btn-accent"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
