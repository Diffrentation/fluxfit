"use client";
import React from "react";
import { motion } from "framer-motion";

const features = [
  {
    icon: "🚀",
    title: "Fast Delivery",
    description: "Tracked, pan-India shipping with your order at your door in days, not weeks",
    bg: "bg-orange-50",
  },
  {
    icon: "✨",
    title: "Premium Quality",
    description: "Premium fabrics and careful craftsmanship in every garment",
    bg: "bg-yellow-50",
  },
  {
    icon: "🎯",
    title: "Custom Orders",
    description: "Create personalized orders exactly how you like them",
    bg: "bg-pink-50",
  },
  {
    icon: "💰",
    title: "Great Prices",
    description: "Affordable pricing without compromising on quality",
    bg: "bg-green-50",
  },
  {
    icon: "🛡️",
    title: "Secure Checkout",
    description: "Safe and secure payment options for your peace of mind",
    bg: "bg-blue-50",
  },
  {
    icon: "👥",
    title: "24/7 Support",
    description: "Always available to help with your questions and concerns",
    bg: "bg-purple-50",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="relative z-10 overflow-hidden bg-transparent">
      {/* Subtle Background Gradients */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-bl from-green-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0d1c2f] mb-3 tracking-tight">
            Why Choose Us
          </h2>
          <p className="text-[15px] sm:text-base text-gray-500 max-w-2xl mx-auto line-clamp-2 px-2">
            Experience quality, convenience, and excellence in every order
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white p-4 sm:p-5 rounded-[18px] sm:rounded-[20px] shadow-sm border border-gray-100 flex flex-col h-full lg:hover:-translate-y-1.5 lg:hover:shadow-md transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-full ${feature.bg} flex items-center justify-center shrink-0 mb-3`}>
                <span className="text-[22px]">{feature.icon}</span>
              </div>
              <h3 className="text-base font-semibold text-[#0d1c2f] mb-2 line-clamp-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-snug line-clamp-3">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
