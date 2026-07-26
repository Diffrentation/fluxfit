"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  IconShirt,
  IconJacket,
  IconPencil,
  IconPalette,
  IconCheck,
  IconHeartHandshake,
  IconTruck,
  IconShieldCheck,
  IconStar,
  IconAward,
  IconUsers,
  IconTrendingUp,
} from "@tabler/icons-react";
import GetInTouch from "@/components/GetInTouch/GetInTouch";

const About = () => {
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    fetch('/api/pages/about')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.data) {
          setPageData(res.data.data);
        }
      })
      .catch(console.error);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const products = [
    {
      icon: IconShirt,
      title: "T-Shirts",
      description: "Premium quality t-shirts in all sizes and colors",
    },
    {
      icon: IconJacket,
      title: "Jackets & Hoodies",
      description: "Stylish jackets and cozy hoodies for all seasons",
    },
    {
      icon: IconShirt,
      title: "Shirts",
      description: "Formal and casual shirts with custom designs",
    },
    {
      icon: IconPalette,
      title: "Custom Paint",
      description: "Specialized paint products for fabric printing",
    },
  ];

  const services = [
    {
      icon: IconPencil,
      title: "Custom Design Printing",
      description:
        "Print any design of your choice on our premium quality garments. From logos to artwork, we bring your vision to life.",
    },
    {
      icon: IconPalette,
      title: "Full-Color Printing",
      description:
        "Vibrant, long-lasting colors using state-of-the-art printing technology that withstands washing and wear.",
    },
    {
      icon: IconTrendingUp,
      title: "Bulk Orders",
      description:
        "Perfect for businesses, events, and organizations. Competitive pricing for large quantity orders.",
    },
    {
      icon: IconAward,
      title: "Quality Assurance",
      description:
        "Every product undergoes rigorous quality checks to ensure you receive the best possible merchandise.",
    },
  ];

  const features = [
    "Premium Quality Materials",
    "Fast Turnaround Times",
    "Eco-Friendly Printing",
    "Custom Sizing Available",
    "100% Satisfaction Guarantee",
    "Competitive Pricing",
  ];

  const stats = [
    { icon: IconUsers, number: "10K+", label: "Happy Customers" },
    { icon: IconShirt, number: "50K+", label: "Products Delivered" },
    { icon: IconAward, number: "5+", label: "Years of Experience" },
    { icon: IconStar, number: "4.9", label: "Average Rating" },
  ];

  return (
    <div className="min-h-screen bg-[#fafcfb]">
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMxZTlhNTgiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]"></div>
        </div>
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#111827] mb-6 tracking-tight">
              About <span className="text-[#1e9a58]">FluxFit</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
              Your Premier Destination for Custom Clothing & Printing
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-6">
                Our Story
              </h2>
              <div className="w-12 h-1 bg-[#1e9a58] mb-8 rounded-full"></div>
              <div className="space-y-6 text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">
                {pageData?.storyText || (
                  <>
                    <p>
                      Welcome to <strong>FluxFit</strong>, where fashion meets
                      creativity! We are a leading provider of custom clothing and
                      printing services, dedicated to helping you express your
                      unique style and personality through high-quality garments.
                    </p>
                    <p>
                      Founded with a passion for design and quality, FluxFit has
                      grown to become a trusted name in the custom printing
                      industry. We specialize in printing any kind of design on
                      clothes - from simple text and logos to intricate artwork and
                      full-color graphics.
                    </p>
                    <p>
                      Whether you're looking for personalized t-shirts, stylish
                      jackets, comfortable hoodies, or any other apparel, we have
                      the expertise and technology to bring your vision to life.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-[400px] lg:h-[550px] rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 border-8 border-white"
            >
              <Image
                src="https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=1000&fit=crop&q=80"
                alt="Custom printing process"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 sm:py-24 bg-[#fafcfb]">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
              What We Offer
            </h2>
            <div className="w-12 h-1 bg-[#1e9a58] mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From custom printing to ready-made apparel, we have everything you
              need.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {products.map((product, index) => {
              const Icon = product.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f4fbf7] rounded-2xl mb-6 text-[#1e9a58]">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] mb-3">
                    {product.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    {product.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-24 bg-white border-y border-gray-50">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
              Our Services
            </h2>
            <div className="w-12 h-1 bg-[#1e9a58] mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Comprehensive printing and customization solutions for all your
              needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-[#eaf5ef] transition-all duration-300 hover:shadow-lg shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-[#1e9a58] rounded-2xl flex items-center justify-center shadow-md shadow-green-100">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#111827] mb-3">
                        {service.title}
                      </h3>
                      <p className="text-gray-500 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#f4fbf7]">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="text-center bg-white py-8 px-4 rounded-3xl border border-[#eaf5ef] shadow-sm"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f4fbf7] text-[#1e9a58] rounded-full mb-4">
                    <Icon className="w-8 h-8" stroke={1.5} />
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111827] mb-2 tracking-tight">
                    {stat.number}
                  </div>
                  <div className="text-sm md:text-base font-semibold text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 order-2 lg:order-1"
            >
              <Image
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1000&fit=crop&q=80"
                alt="Quality clothing"
                fill
                className="object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-6">
                Why Choose <span className="text-[#1e9a58]">FluxFit?</span>
              </h2>
              <div className="w-12 h-1 bg-[#1e9a58] mb-8 rounded-full"></div>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                At FluxFit, we combine premium materials with cutting-edge
                printing technology to deliver products that exceed
                expectations. Our commitment to quality, customer service, and
                innovation sets us apart.
              </p>
              
              <div className="space-y-4 mb-10">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-4 bg-[#fafcfb] p-3 rounded-xl border border-gray-100"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-[#f4fbf7] rounded-full flex items-center justify-center text-[#1e9a58]">
                      <IconCheck className="w-5 h-5" stroke={3} />
                    </div>
                    <span className="text-base font-semibold text-[#111827]">
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </div>
              <Link
                href="/product-list"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl text-lg font-bold transition-all shadow-lg shadow-green-200"
              >
                Shop Now
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 sm:py-24 bg-[#fafcfb]">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 sm:p-10 lg:p-12 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#f4fbf7] rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-[#1e9a58] text-white rounded-2xl flex items-center justify-center">
                    <IconHeartHandshake className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#111827]">
                    Our Mission
                  </h3>
                </div>
                <p className="text-lg text-gray-500 leading-relaxed">
                  To empower individuals and businesses to express their unique
                  identity through high-quality custom apparel and printing
                  services. We strive to deliver exceptional products that combine
                  style, comfort, and durability while maintaining the highest
                  standards of customer satisfaction.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#1e9a58] text-white p-6 sm:p-10 lg:p-12 rounded-3xl shadow-lg relative overflow-hidden"
            >
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-white text-[#1e9a58] rounded-2xl flex items-center justify-center">
                    <IconTrendingUp className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Our Vision
                  </h3>
                </div>
                <p className="text-lg text-green-50 leading-relaxed">
                  To become the leading destination for custom clothing and
                  printing services globally. We envision a future where everyone
                  can easily access premium quality apparel with personalized
                  designs, fostering creativity and self-expression in fashion.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Meet the Founders Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
              Meet the Founders
            </h2>
            <div className="w-12 h-1 bg-[#1e9a58] mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              The visionary leaders behind FluxFit, driving innovation and
              excellence in custom clothing and printing services worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Subhash - Founder & CEO */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#fafcfb] rounded-3xl overflow-hidden border border-gray-100 group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="relative h-72">
                <Image
                  src="/images/founders/founder_subhash.png"
                  alt="Subhash - Founder & CEO"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-8 relative">
                <div className="absolute -top-6 right-8 w-12 h-12 bg-[#1e9a58] rounded-full flex items-center justify-center text-white border-4 border-[#fafcfb]">
                  <IconAward className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-[#111827] mb-1">
                  Subhash
                </h3>
                <p className="text-sm font-bold text-[#1e9a58] uppercase tracking-wider mb-4">
                  Founder & CEO
                </p>
                <p className="text-gray-500 leading-relaxed">
                  As the Founder and CEO, Subhash envisions FluxFit becoming a
                  global powerhouse in custom apparel and printing. His vision
                  is to expand our footprint across continents.
                </p>
              </div>
            </motion.div>

            {/* Mohan - Co-Founder */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#fafcfb] rounded-3xl overflow-hidden border border-gray-100 group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="relative h-72">
                <Image
                  src="/images/founders/founder_mohan.png"
                  alt="Mohan - Co-Founder"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-8 relative">
                <div className="absolute -top-6 right-8 w-12 h-12 bg-white text-[#1e9a58] rounded-full flex items-center justify-center border-4 border-[#fafcfb] shadow-sm">
                  <IconTrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-[#111827] mb-1">
                  Mohan
                </h3>
                <p className="text-sm font-bold text-[#1e9a58] uppercase tracking-wider mb-4">
                  Co-Founder
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Mohan is passionate about scaling FluxFit to
                  global markets. His vision focuses on building strategic
                  partnerships worldwide and establishing a strong brand presence.
                </p>
              </div>
            </motion.div>

            {/* Ashish - Co-Founder */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-[#fafcfb] rounded-3xl overflow-hidden border border-gray-100 group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="relative h-72">
                <Image
                  src="/images/founders/founder_ashish.png"
                  alt="Ashish - Co-Founder"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-8 relative">
                <div className="absolute -top-6 right-8 w-12 h-12 bg-[#111827] text-white rounded-full flex items-center justify-center border-4 border-[#fafcfb]">
                  <IconStar className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-[#111827] mb-1">
                  Ashish
                </h3>
                <p className="text-sm font-bold text-[#1e9a58] uppercase tracking-wider mb-4">
                  Co-Founder
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Ashish drives the vision of worldwide
                  expansion through technological innovation. He leverages cutting-edge printing
                  technologies and sustainable practices.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 sm:py-24 bg-[#1e9a58]">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg sm:text-xl text-green-50 mb-10 opacity-90">
              Browse our collection or contact us for custom printing services
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/product-list"
                className="px-8 py-4 bg-white text-[#1e9a58] rounded-xl text-lg font-bold shadow-lg hover:-translate-y-1 transition-all"
              >
                Shop Products
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl text-lg font-bold hover:bg-green-700 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Get In Touch Section (If applicable, leaving intact but checking if it's the old blue one) */}
      <div className="bg-white">
        <GetInTouch />
      </div>
    </div>
  );
};

export default About;
