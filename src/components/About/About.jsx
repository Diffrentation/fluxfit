"use client";
import React from "react";
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzMCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About FluxFit
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Your Premier Destination for Custom Clothing & Printing
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-lg">
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
                  Whether you&apos;re looking for personalized t-shirts, stylish
                  jackets, comfortable hoodies, or any other apparel, we have
                  the expertise and technology to bring your vision to life.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=1000&fit=crop&q=80"
                alt="Custom printing process"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From custom printing to ready-made apparel, we have everything you
              need
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {products.map((product, index) => {
              const Icon = product.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {product.title}
                  </h3>
                  <p className="text-gray-600">{product.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive printing and customization solutions for all your
              needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
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
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {stat.number}
                  </div>
                  <div className="text-blue-100">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl"
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
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose FluxFit?
              </h2>
              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <IconCheck className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 text-lg">{feature}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                At FluxFit, we combine premium materials with cutting-edge
                printing technology to deliver products that exceed
                expectations. Our commitment to quality, customer service, and
                innovation sets us apart in the industry.
              </p>
              <Link
                href="/product-list"
                className="inline-block px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Shop Now
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg"
            >
              <div className="flex items-center gap-4 mb-4">
                <IconHeartHandshake className="w-10 h-10 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">
                  Our Mission
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                To empower individuals and businesses to express their unique
                identity through high-quality custom apparel and printing
                services. We strive to deliver exceptional products that combine
                style, comfort, and durability while maintaining the highest
                standards of customer satisfaction.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-lg"
            >
              <div className="flex items-center gap-4 mb-4">
                <IconTrendingUp className="w-10 h-10 text-gray-700" />
                <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                To become the leading destination for custom clothing and
                printing services globally. We envision a future where everyone
                can easily access premium quality apparel with personalized
                designs, fostering creativity and self-expression in fashion.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Meet the Founders Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet the Founders
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The visionary leaders behind FluxFit, driving innovation and
              excellence in custom clothing and printing services worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Subhash - Founder & CEO */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-64 bg-gradient-to-br from-blue-500 to-blue-600">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&q=80"
                  alt="Subhash - Founder & CEO"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    Subhash
                  </h3>
                  <p className="text-blue-200 font-semibold">Founder & CEO</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <IconAward className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600">
                    Visionary Leader
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  As the Founder and CEO, Subhash envisions FluxFit becoming a
                  global powerhouse in custom apparel and printing. His vision
                  is to expand our footprint across continents, bringing
                  high-quality, personalized fashion solutions to customers
                  worldwide while maintaining our commitment to innovation and
                  customer satisfaction.
                </p>
              </div>
            </motion.div>

            {/* Mohan - Co-Founder */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-64 bg-gradient-to-br from-green-500 to-green-600">
                <Image
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&q=80"
                  alt="Mohan - Co-Founder"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-1">Mohan</h3>
                  <p className="text-green-200 font-semibold">Co-Founder</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <IconTrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">
                    Strategic Partner
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Mohan, as a Co-Founder, is passionate about scaling FluxFit to
                  global markets. His vision focuses on building strategic
                  partnerships worldwide, establishing a strong international
                  presence, and ensuring our brand becomes synonymous with
                  quality and innovation in the custom printing industry across
                  different cultures and markets.
                </p>
              </div>
            </motion.div>

            {/* Pankaj - Co-Founder */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-64 bg-gradient-to-br from-purple-500 to-purple-600">
                <Image
                  src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&q=80"
                  alt="Pankaj - Co-Founder"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-1">Pankaj</h3>
                  <p className="text-purple-200 font-semibold">Co-Founder</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <IconStar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-600">
                    Innovation Partner
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Pankaj, Co-Founder of FluxFit, drives the vision of worldwide
                  expansion through technological innovation and operational
                  excellence. He envisions a future where FluxFit sets new
                  industry standards globally, leveraging cutting-edge printing
                  technologies and sustainable practices to serve customers
                  across borders with unmatched quality and service.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Browse our collection or contact us for custom printing services
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/product-list"
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Shop Products
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white rounded-md font-semibold transition-colors duration-200"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Get In Touch Section */}
      <GetInTouch />
    </div>
  );
};

export default About;
