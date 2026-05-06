"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

const ALLOWED_NEXT_IMAGE_HOSTS = [
  "images.unsplash.com",
  "res.cloudinary.com",
  "www.mamp.one",
];

const canUseNextImage = (src) => {
  if (!src || typeof src !== "string") return false;
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    return ALLOWED_NEXT_IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
};

// Fallback slides shown while API data loads or if no slides configured
const FALLBACK_SLIDES = [
  {
    _id: "fallback-1",
    subtitle: "Women Collection 2026",
    title: "NEW SEASON",
    buttonText: "SHOP NOW",
    buttonLink: "/product-list",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&q=80",
  },
];

function Herobanner() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/hero-banners")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.banners?.length > 0) {
          setSlides(data.data.banners);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const slideVariants = {
    enter: { opacity: 0 },
    center: { zIndex: 1, opacity: 1 },
    exit: { zIndex: 0, opacity: 0 },
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[currentSlide] || {};

  const discountPct =
    slide.originalPrice && slide.salePrice && slide.originalPrice > slide.salePrice
      ? Math.round(((slide.originalPrice - slide.salePrice) / slide.originalPrice) * 100)
      : null;

  return (
    <div
      className="relative w-full min-w-0 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: slide.bgColor || undefined,
      }}
    >
      {!slide.bgColor && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900" />
      )}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-3 md:left-4 top-[65%] sm:top-[60%] md:top-80 lg:top-1/2 -translate-y-1/2 z-50 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2 sm:p-2.5 md:p-3 shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Previous slide"
            suppressHydrationWarning
          >
            <IconChevronLeft className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-900 dark:text-gray-100" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-3 md:right-4 top-[65%] sm:top-[60%] md:top-80 lg:top-1/2 -translate-y-1/2 z-50 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2 sm:p-2.5 md:p-3 shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Next slide"
            suppressHydrationWarning
          >
            <IconChevronRight className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-900 dark:text-gray-100" />
          </button>
        </>
      )}

      {/* Slider Container */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ opacity: { duration: 0.8, ease: "easeInOut" } }}
          className="absolute inset-0 w-full h-full min-w-0"
        >
          <div className="w-full h-full flex items-center px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 md:gap-6 w-full items-center min-w-0 max-w-full">
              {/* Left Side - Text Content */}
              <div className="flex flex-col justify-center space-y-2 sm:space-y-3 md:space-y-4 text-left min-w-0 w-full">
                {/* Badge */}
                {slide.badge && (
                  <span className="self-start px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded uppercase tracking-wider">
                    {slide.badge}
                  </span>
                )}

                {slide.subtitle && (
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium tracking-wide">
                    {slide.subtitle}
                  </p>
                )}

                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white leading-tight break-words">
                  {slide.title}
                </h1>

                {slide.description && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-md">
                    {slide.description}
                  </p>
                )}

                {/* Discount / Price Row */}
                {(slide.discountText || slide.salePrice || discountPct) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {slide.discountText && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs sm:text-sm font-bold px-2 py-0.5 rounded">
                        {slide.discountText}
                      </span>
                    )}
                    {!slide.discountText && discountPct && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs sm:text-sm font-bold px-2 py-0.5 rounded">
                        {discountPct}% OFF
                      </span>
                    )}
                    {slide.salePrice && (
                      <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        ₹{slide.salePrice.toLocaleString()}
                      </span>
                    )}
                    {slide.originalPrice && slide.salePrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{slide.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                <Link
                  href={slide.buttonLink || "/product-list"}
                  className="self-start px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md font-semibold text-xs sm:text-sm transition-colors duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                  suppressHydrationWarning
                >
                  {slide.buttonText || "SHOP NOW"}
                </Link>
              </div>

              {/* Right Side - Image */}
              <div className="relative w-full h-[200px] sm:h-[250px] md:h-[350px] lg:h-[450px] xl:h-[550px] rounded-lg overflow-hidden dark:ring-2 dark:ring-gray-700 min-w-0">
                {slide.image && (
                  canUseNextImage(slide.image) ? (
                    <Image
                      src={slide.image}
                      alt={slide.title || "Product"}
                      fill
                      className="object-cover object-center"
                      priority={currentSlide === 0}
                    />
                  ) : (
                    <img
                      src={slide.image}
                      alt={slide.title || "Product"}
                      className="w-full h-full object-cover object-center"
                      loading={currentSlide === 0 ? "eager" : "lazy"}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-6 sm:w-8 bg-gray-900 dark:bg-white"
                  : "w-1.5 sm:w-2 bg-gray-400 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              suppressHydrationWarning
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Herobanner;
