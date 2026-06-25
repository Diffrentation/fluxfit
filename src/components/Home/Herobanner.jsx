"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconBolt,
  IconArrowRight,
  IconUsers,
  IconStarFilled,
  IconTruck
} from "@tabler/icons-react";
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

const FALLBACK_SLIDES = [
  {
    _id: "fallback-1",
    badge: "Et aut velit veniam",
    subtitle: "SUNT NESCIUNT NAM T",
    title: "Duis consequat cor",
    description: "Commodo sit id corr",
    buttonText: "Excepturi et proiden",
    buttonLink: "/product-list",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop&q=80",
  },
];

function Herobanner() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [pageData, setPageData] = useState(null);

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

    fetch("/api/pages/home")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.data) {
          setPageData(data.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const slideVariants = {
    enter: { opacity: 0, x: 20 },
    center: { zIndex: 1, opacity: 1, x: 0 },
    exit: { zIndex: 0, opacity: 0, x: -20 },
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

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] bg-transparent overflow-hidden flex items-center pt-10 pb-20">
      {/* Background Decor Elements */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[300px] pointer-events-none overflow-hidden opacity-50 z-0">
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-tr from-green-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-30 left-20 w-[300px] h-[300px] bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        {/* SVG Waves */}
        <svg viewBox="0 0 500 300" className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
          <path d="M0,150 C100,250 200,50 300,150 C400,250 500,100 500,100 L500,300 L0,300 Z" fill="rgba(34, 197, 94, 0.05)" />
          <path d="M0,200 C150,300 250,100 350,200 C450,300 500,150 500,150 L500,300 L0,300 Z" fill="rgba(59, 130, 246, 0.08)" />
          <path d="M0,250 C100,200 200,300 300,200 C400,100 500,250 500,250 L500,300 L0,300 Z" fill="rgba(34, 197, 94, 0.15)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 md:px-8 xl:px-12 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <div className="flex flex-col items-start pt-8 lg:pt-0 relative">
            
            {/* Dotted pattern */}
            <div className="absolute top-0 right-10 grid grid-cols-4 gap-2 opacity-20 pointer-events-none">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 border border-green-100/50 text-green-700 rounded-full text-sm font-semibold mb-8 shadow-sm">
                  <IconBolt size={16} className="text-green-600" />
                  <span>{slide.badge || "Et aut velit veniam"}</span>
                </div>

                {/* Subtitle */}
                <h3 className="text-green-600 font-bold uppercase tracking-[0.2em] text-xs sm:text-sm mb-4">
                  {slide.subtitle || "SUNT NESCIUNT NAM T"}
                </h3>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[5rem] font-extrabold text-[#0d1c2f] leading-[1.1] mb-6 tracking-tight">
                  {slide.title || "Duis consequat cor"}
                </h1>

                {/* Description */}
                <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-lg font-medium">
                  {slide.description || "Commodo sit id corr"}
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-4 mb-16">
                  <Link
                    href={slide.buttonLink || "/product-list"}
                    className="group flex items-center gap-3 px-8 py-4 bg-[#1e9a58] hover:bg-[#188149] text-white rounded-xl font-bold text-base transition-all duration-300 shadow-[0_8px_20px_rgba(30,154,88,0.3)] hover:shadow-[0_12px_25px_rgba(30,154,88,0.4)] hover:-translate-y-0.5"
                  >
                    {slide.buttonText || "Excepturi et proiden"}
                    <IconArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/custom-clothes"
                    className="px-8 py-4 border-2 border-green-600/20 hover:border-green-600 text-green-700 rounded-xl font-bold text-base transition-all duration-300 bg-transparent hover:bg-green-50"
                  >
                    Custom Order
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 sm:gap-12 md:gap-16 pt-8 border-t border-gray-200/60 w-full relative">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-gray-200 to-transparent"></div>

                  <div className="flex flex-col items-center sm:items-start group">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                      <IconUsers className="text-green-600" size={24} />
                    </div>
                    <div className="text-2xl lg:text-3xl font-extrabold text-[#0d1c2f] mb-1">{pageData?.customers || "500+"}</div>
                    <div className="text-sm text-gray-500 font-medium">Happy Customers</div>
                  </div>

                  <div className="flex flex-col items-center sm:items-start group">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                      <IconStarFilled className="text-green-600" size={24} />
                    </div>
                    <div className="text-2xl lg:text-3xl font-extrabold text-[#0d1c2f] mb-1 flex items-baseline gap-1">
                      {pageData?.rating || "4.8"} <IconStarFilled size={18} className="text-[#0d1c2f]" />
                    </div>
                    <div className="text-sm text-gray-500 font-medium">Average Rating</div>
                  </div>

                  <div className="flex flex-col items-center sm:items-start group">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                      <IconTruck className="text-green-600" size={24} />
                    </div>
                    <div className="text-2xl lg:text-3xl font-extrabold text-[#0d1c2f] mb-1">{pageData?.delivery || "24/7"}</div>
                    <div className="text-sm text-gray-500 font-medium">Order Delivery</div>
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Content - Image/Slider */}
          <div className="relative w-full h-[450px] sm:h-[500px] md:h-[600px] lg:h-[700px] rounded-[2.5rem] lg:rounded-[4rem] overflow-hidden bg-gradient-to-b from-[#e1f0ff] to-[#b3d7ff] shadow-xl">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentSlide}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ opacity: { duration: 0.6 }, x: { type: "spring", stiffness: 300, damping: 30 } }}
                className="absolute inset-0 w-full h-full"
              >
                {slide.image && (
                  canUseNextImage(slide.image) ? (
                    <Image
                      src={slide.image}
                      alt={slide.title || "Product"}
                      fill
                      className="object-cover object-center mix-blend-multiply drop-shadow-2xl"
                      priority={currentSlide === 0}
                    />
                  ) : (
                    <img
                      src={slide.image}
                      alt={slide.title || "Product"}
                      className="w-full h-full object-cover object-center mix-blend-multiply drop-shadow-2xl"
                      loading={currentSlide === 0 ? "eager" : "lazy"}
                    />
                  )
                )}
              </motion.div>
            </AnimatePresence>

            {/* Slider Navigation inside image container */}
            <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/5 backdrop-blur-sm px-4 py-2 rounded-full">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-8 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                  suppressHydrationWarning
                />
              ))}
            </div>

            {/* Next/Prev Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center text-gray-800 hover:bg-white hover:scale-110 transition-all"
                >
                  <IconChevronLeft size={20} className="sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center text-gray-800 hover:bg-white hover:scale-110 transition-all"
                >
                  <IconChevronRight size={20} className="sm:w-6 sm:h-6" />
                </button>
              </>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default Herobanner;

