"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconArrowRight,
} from "@tabler/icons-react";

const GetInTouch = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.website) {
          setSettings(data.data.website);
        }
      })
      .catch(console.error);
  }, []);

  const email = settings?.email || "fluxfit1@gmail.com";
  const phone = settings?.phone || "+91 9958724005";
  const fullAddress = settings?.address 
    ? `${settings.address.line1}, ${settings.address.city}, ${settings.address.state}, ${settings.address.country}`
    : "Behrampur, Ghaziabad, Uttar Pradesh, India";

  const contactInfo = [
    {
      icon: IconMail,
      text: email,
      link: `mailto:${email}`,
      label: "Email us",
      onClick: (e) => {
        e.preventDefault();
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = `mailto:${email}`;
        } else {
          window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, "_blank");
        }
      }
    },
    {
      icon: IconPhone,
      text: phone,
      link: `tel:${phone.replace(/\s+/g, '')}`,
      label: "Call us",
    },
    {
      icon: IconMapPin,
      text: fullAddress,
      link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
      label: "Visit us",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-[#f4f8ff] to-[#e6f0fe] overflow-hidden">
      {/* Background Decor Elements */}
      
      {/* Subtle Gradient Orbs */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-10 w-[min(500px,90vw)] h-[min(500px,90vw)] bg-blue-300/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-10 w-[min(600px,90vw)] h-[min(600px,90vw)] bg-indigo-300/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Dotted Pattern */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

      {/* Top Wave Divider */}
      <div className="absolute top-0 left-0 w-full h-[150px] md:h-[250px] pointer-events-none opacity-50 z-0 transform rotate-180 mix-blend-overlay">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
          <path fill="#ffffff" fillOpacity="1" d="M0,256L48,224C96,192,192,128,288,128C384,128,480,192,576,213.3C672,235,768,213,864,186.7C960,160,1056,128,1152,128C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have questions about our products or services? We&apos;d love to
              hear from you. Send us a message and we&apos;ll respond as soon as
              possible.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.a
                  key={index}
                  href={info.link}
                  onClick={info.onClick}
                  target={info.link.startsWith("http") || info.onClick ? "_blank" : "_self"}
                  rel={info.link.startsWith("http") ? "noopener noreferrer" : ""}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative overflow-hidden bg-gradient-to-b from-white/95 to-[#f8fafe]/95 backdrop-blur-md p-5 sm:p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 border border-white/60 hover:border-blue-200 group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#1e9a58] transition-colors duration-300">
                      <Icon className="w-7 h-7 text-green-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {info.label}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed break-words max-w-full">
                      {info.text}
                    </p>
                  </div>
                </motion.a>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1e9a58] hover:bg-[#188149] text-white rounded-md font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Send Us a Message
              <IconArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default GetInTouch;

