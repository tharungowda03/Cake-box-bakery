import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Cake, Truck, Heart } from 'lucide-react';
import type { ShowcaseSlide } from '../../types';

interface HeroShowcaseSliderProps {
  slides: ShowcaseSlide[];
}

export const HeroShowcaseSlider: React.FC<HeroShowcaseSliderProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const totalSlides = slides.length;

  const goToNext = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Autoplay management: 5-second rotation
  useEffect(() => {
    if (isPaused || prefersReducedMotion || totalSlides <= 1) return;

    autoplayTimerRef.current = setInterval(() => {
      goToNext();
    }, 5000);

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isPaused, prefersReducedMotion, totalSlides, goToNext]);

  // Touch handlers for mobile swipe
  const minSwipeDistance = 45;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrev();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  };

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || slides[0];

  // Helper to render heading with highlighted gold word
  const renderHeading = (title: string, highlight?: string) => {
    if (!highlight || !title.toLowerCase().includes(highlight.toLowerCase())) {
      return title;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = title.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} className="text-amber-700 italic font-normal">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <section
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Artisanal Bakery Showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative rounded-3xl bg-[#FAF6F0] border border-amber-900/10 shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-700/20"
    >
      {/* Editorial Decorative Ambiance */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-amber-200/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-radial from-orange-100/40 to-transparent blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-10 lg:p-12">
        {/* Left Column: Brand Story & Text (45% / 5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6 text-left">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-[11px] font-bold tracking-wider uppercase border border-amber-200/70 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            {currentSlide.eyebrow || 'CAKE BOX · KAKINADA'}
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-bold text-stone-900 tracking-tight leading-[1.15] transition-all duration-300">
            {renderHeading(currentSlide.title, currentSlide.highlight_word)}
          </h1>

          {/* Subtitle / Description */}
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-lg font-normal">
            {currentSlide.subtitle ||
              'Freshly baked handcrafted cakes prepared daily with premium ingredients at our Kakinada bakery.'}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={currentSlide.cta_link || '/menu'}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 active:bg-amber-950 text-white font-semibold text-sm shadow-sm hover:shadow transition-all group"
            >
              {currentSlide.cta_label || 'Explore Menu'}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to={currentSlide.secondary_cta_link || '/custom-cake'}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-semibold text-sm border border-stone-200/90 shadow-2xs transition-all"
            >
              <Cake className="w-4 h-4 mr-2 text-amber-700" />
              {currentSlide.secondary_cta_label || 'Custom Cake'}
            </Link>
          </div>

          {/* Subtle Trust Indicators */}
          <div className="pt-4 border-t border-amber-900/10 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-700" /> Kakinada Delivery (10 km)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-amber-700" /> Handcrafted Fresh Daily
            </span>
          </div>
        </div>

        {/* Right Column: Large Showcase Image Slider (55% / 7 cols) */}
        <div
          className="lg:col-span-7 relative w-full"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Main Visual Frame */}
          <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 shadow-md border border-stone-200/70">
            {slides.map((slide, index) => {
              const isActive = index === currentIndex;
              return (
                <div
                  key={slide.id}
                  aria-hidden={!isActive}
                  className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out ${
                    isActive
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className={`w-full h-full object-cover transition-transform duration-5000 ease-out ${
                      isActive && !prefersReducedMotion ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  {/* Subtle editorial vignette gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-black/10 pointer-events-none" />

                  {/* Minimal subtle badge overlay on image */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/95 text-xs drop-shadow-sm pointer-events-none">
                    <span className="font-serif tracking-wide text-xs sm:text-sm font-medium bg-stone-900/40 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20">
                      {slide.eyebrow}
                    </span>
                    <span className="text-[11px] font-mono tracking-wider bg-stone-900/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                      0{index + 1} / 0{totalSlides}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Desktop / Tablet Slider Arrows */}
            <button
              onClick={goToPrev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md hover:shadow-lg flex items-center justify-center transition-all backdrop-blur-xs focus:outline-none focus:ring-2 focus:ring-amber-700/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={goToNext}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md hover:shadow-lg flex items-center justify-center transition-all backdrop-blur-xs focus:outline-none focus:ring-2 focus:ring-amber-700/50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Slider Pagination Controls (Dots & Progress) */}
          <div className="flex items-center justify-between pt-4 px-1">
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-700/40 ${
                    index === currentIndex
                      ? 'w-8 bg-amber-800'
                      : 'w-2 bg-stone-300 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>

            {/* Autoplay status hint */}
            <span className="text-[11px] text-stone-400 font-medium">
              {isPaused ? 'Paused' : 'Swipe or click to view'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
