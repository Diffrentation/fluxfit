"use client";
import React from "react";
import { motion } from "framer-motion";

const features = [
  {
    icon: "🚀",
    title: "Fast Delivery",
    description: "Get your order delivered within 30 minutes guaranteed",
  },
  {
    icon: "✨",
    title: "Premium Quality",
    description: "Fresh ingredients and best quality products every time",
  },
  {
    icon: "🎯",
    title: "Custom Orders",
    description: "Create personalized orders exactly how you like them",
  },
  {
    icon: "💰",
    title: "Great Prices",
    description: "Affordable pricing without compromising on quality",
  },
  {
    icon: "🛡️",
    title: "Secure Checkout",
    description: "Safe and secure payment options for your peace of mind",
  },
  {
    icon: "👥",
    title: "24/7 Support",
    description: "Always available to help with your questions and concerns",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-transparent relative z-10 overflow-hidden">
      {/* Subtle Background Gradients */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-60 z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-green-300/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-blue-300/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0d1c2f] mb-4 tracking-tight">
              Why Choose Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Experience quality, convenience, and excellence in every order
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-[#0d1c2f] mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
