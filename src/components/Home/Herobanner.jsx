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
      nextSlide();
    }, 10000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [currentSlide]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Previous slide"
      >
        <IconChevronLeft className="w-6 h-6 text-gray-700" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Next slide"
      >
        <IconChevronRight className="w-6 h-6 text-gray-700" />
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
          <div className="container mx-auto h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-center px-4 lg:px-8">
              {/* Left Side - Text Content */}
              <div className="flex flex-col justify-center space-y-6 text-left">
                <p className="text-gray-600 text-sm md:text-base font-medium tracking-wide">
                  {slides[currentSlide].subtitle}
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  {slides[currentSlide].title}
                </h1>
                <button className="self-start px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold text-sm md:text-base transition-colors duration-200 shadow-lg hover:shadow-xl">
                  {slides[currentSlide].buttonText}
                </button>
              </div>

              {/* Right Side - Image */}
              <div className="relative w-full h-[400px] lg:h-[600px] rounded-lg overflow-hidden">
                <Image
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  fill
                  className="object-cover object-center"
                  priority={currentSlide === 0}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-8 bg-gray-900"
                : "w-2 bg-gray-400 hover:bg-gray-600"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Herobanner;
