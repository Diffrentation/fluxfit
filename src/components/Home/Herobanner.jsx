"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";

const slides = [
  {
    id: 1,
    subtitle: "Women Collection 2018",
    title: "NEW SEASON",
    buttonText: "SHOP NOW",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&q=80",
  },
  {
    id: 2,
    subtitle: "Men Collection 2018",
    title: "SUMMER SALE",
    buttonText: "SHOP NOW",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&q=80",
  },
  {
    id: 3,
    subtitle: "Accessories Collection",
    title: "TRENDING NOW",
    buttonText: "SHOP NOW",
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1000&fit=crop&q=80",
  },
];

function Herobanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slideVariants = {
    enter: {
      opacity: 0,
    },
    center: {
      zIndex: 1,
      opacity: 1,
    },
    exit: {
      zIndex: 0,
      opacity: 0,
    },
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto-play functionality (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000); // Change slide every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full p-1.5 sm:p-2 md:p-2.5 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Previous slide"
        suppressHydrationWarning
      >
        <IconChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-200" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Next slide"
        suppressHydrationWarning
      >
        <IconChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Slider Container */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: {
              duration: 0.8,
              ease: "easeInOut",
            },
          }}
          className="absolute inset-0 w-full h-full"
        >
          <div className="w-full h-full flex items-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full items-center">
              {/* Left Side - Text Content */}
              <div className="flex flex-col justify-center space-y-2 sm:space-y-3 md:space-y-4 text-left">
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium tracking-wide">
                  {slides[currentSlide]?.subtitle || ""}
                </p>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                  {slides[currentSlide]?.title || ""}
                </h1>
                <button
                  className="self-start px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md font-semibold text-xs sm:text-sm transition-colors duration-200 shadow-lg hover:shadow-xl"
                  suppressHydrationWarning
                >
                  {slides[currentSlide]?.buttonText || "SHOP NOW"}
                </button>
              </div>

              {/* Right Side - Image */}
              <div className="relative w-full h-[200px] sm:h-[250px] md:h-[350px] lg:h-[450px] xl:h-[550px] rounded-lg overflow-hidden dark:ring-2 dark:ring-gray-700">
                {slides[currentSlide]?.image && (
                  <Image
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].title || "Product"}
                    fill
                    className="object-cover object-center"
                    priority={currentSlide === 0}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index);
            }}
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
    </div>
  );
}

export default Herobanner;
