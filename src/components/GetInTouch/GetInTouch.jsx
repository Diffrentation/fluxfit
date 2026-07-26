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
      colSpan: "col-span-1",
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
      colSpan: "col-span-1",
    },
    {
      icon: IconMapPin,
      text: fullAddress,
      link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
      label: "Visit us",
      colSpan: "col-span-2 md:col-span-1",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f4f8ff]/60 to-[#e6f0fe]/60">
      {/* Soft Background Elements */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-200 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-200/50 rounded-full blur-[120px]"></div>
      </div>
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0d1c2f] mb-3 tracking-tight">
            Get In Touch
          </h2>
          <p className="text-[15px] sm:text-base text-gray-500 max-w-2xl mx-auto line-clamp-2 px-2 leading-snug">
            Have questions about our products or services? We'd love to hear from you.
          </p>
        </motion.div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-8 lg:mb-10">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <motion.a
                key={index}
                href={info.link}
                onClick={info.onClick}
                target={info.link.startsWith("http") || info.onClick ? "_blank" : "_self"}
                rel={info.link.startsWith("http") ? "noopener noreferrer" : ""}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex flex-col items-center text-center bg-white p-4 sm:p-5 rounded-[18px] sm:rounded-[20px] shadow-sm border border-gray-100 h-full lg:hover:-translate-y-1.5 lg:hover:shadow-md transition-all duration-300 ${info.colSpan}`}
              >
                <div className="w-12 h-12 bg-[#eaf5ef] rounded-full flex items-center justify-center shrink-0 mb-3 group-hover:bg-[#1e9a58] transition-colors duration-300">
                  <Icon className="w-[22px] h-[22px] text-[#1e9a58] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-base font-semibold text-[#0d1c2f] mb-2 line-clamp-1">
                  {info.label}
                </h3>
                <p className="text-sm text-gray-500 leading-snug break-words max-w-full line-clamp-3">
                  {info.text}
                </p>
              </motion.a>
            );
          })}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center"
        >
          <Link
            href="/contact"
            className="w-full md:w-auto md:min-w-[240px] h-[48px] flex items-center justify-center gap-2 px-6 bg-[#1e9a58] hover:bg-[#188149] text-white rounded-[14px] text-[15px] font-semibold transition-all duration-300 shadow-md hover:shadow-lg shadow-green-500/20 group"
          >
            Send Us a Message
            <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
        
      </div>
    </section>
  );
};

export default GetInTouch;

