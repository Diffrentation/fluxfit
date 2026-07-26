"use client";
import React, { useState, useEffect } from "react";
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconChevronDown,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const Footer = () => {
  const navItems = [
    { name: "Home", link: "/" },
    { name: "Shop", link: "/product-list" },
    { name: "About", link: "/about" },
    { name: "Contact", link: "/contact" },
  ];

  const [settings, setSettings] = useState(null);
  const [openSection, setOpenSection] = useState(null);

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
    },
    {
      icon: IconMapPin,
      text: fullAddress,
      link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
    },
  ];

  const socialLinks = [
    { icon: IconBrandFacebook, link: "#", label: "Facebook" },
    { icon: IconBrandTwitter, link: "#", label: "Twitter" },
    { icon: IconBrandInstagram, link: "#", label: "Instagram" },
    { icon: IconBrandLinkedin, link: "#", label: "LinkedIn" },
  ];

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-[#0f172a] dark:bg-gray-950 text-gray-300 transition-colors duration-300 overflow-hidden relative z-10">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-y-6 lg:gap-8 xl:gap-12">
          
          {/* Column 1: Logo and Description */}
          <div className="flex flex-col gap-5 lg:col-span-1 border-b border-white/5 lg:border-none pb-6 lg:pb-0">
            <Link href="/" className="flex items-center gap-3 group w-max">
              <img
                src="https://assets.aceternity.com/logo-dark.png"
                alt="FluxFit Logo"
                className="w-10 h-10 lg:w-12 lg:h-12 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-white text-xl lg:text-[22px] font-bold tracking-wide">FluxFit</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs line-clamp-3">
              Your one-stop destination for the latest fashion trends and quality products. We bring style and comfort together.
            </p>
            {/* Social Media Links */}
            <div className="grid grid-cols-4 gap-3 w-max mt-2">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.link}
                    aria-label={social.label}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-[#1e9a58] hover:border-[#1e9a58] hover:text-white transition-all duration-300 hover:-translate-y-1"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Quick Links (Accordion on Mobile) */}
          <div className="lg:col-span-1 border-b border-white/5 lg:border-none">
            <button 
              onClick={() => toggleSection('links')}
              className="w-full flex items-center justify-between py-4 lg:py-0 lg:mb-6 cursor-pointer lg:cursor-default"
            >
              <h3 className="text-white font-bold text-base tracking-wide uppercase">Quick Links</h3>
              <IconChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 lg:hidden ${openSection === 'links' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 lg:h-auto lg:opacity-100 ${openSection === 'links' ? 'h-auto opacity-100 pb-6' : 'h-0 opacity-0 lg:pb-0'}`}>
              <ul className="grid grid-cols-2 lg:grid-cols-1 gap-y-3 gap-x-4">
                {navItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.link}
                      className="text-[14px] text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Contact Information (Accordion on Mobile) */}
          <div className="lg:col-span-1 border-b border-white/5 lg:border-none">
            <button 
              onClick={() => toggleSection('contact')}
              className="w-full flex items-center justify-between py-4 lg:py-0 lg:mb-6 cursor-pointer lg:cursor-default"
            >
              <h3 className="text-white font-bold text-base tracking-wide uppercase">Contact Us</h3>
              <IconChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 lg:hidden ${openSection === 'contact' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 lg:h-auto lg:opacity-100 ${openSection === 'contact' ? 'h-auto opacity-100 pb-6' : 'h-0 opacity-0 lg:pb-0'}`}>
              <ul className="flex flex-col gap-4">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <li key={index}>
                      <a
                        href={info.link}
                        onClick={info.onClick}
                        className="flex items-start gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#1e9a58] transition-colors duration-300">
                          <Icon className="w-[18px] h-[18px] text-gray-400 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <span className="text-[14px] text-gray-400 group-hover:text-white leading-relaxed pt-1.5 transition-colors duration-300">
                          {info.text}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Column 4: Newsletter (Accordion on Mobile) */}
          <div className="lg:col-span-1 border-b border-white/5 lg:border-none">
            <button 
              onClick={() => toggleSection('newsletter')}
              className="w-full flex items-center justify-between py-4 lg:py-0 lg:mb-6 cursor-pointer lg:cursor-default"
            >
              <h3 className="text-white font-bold text-base tracking-wide uppercase">Newsletter</h3>
              <IconChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 lg:hidden ${openSection === 'newsletter' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 lg:h-auto lg:opacity-100 ${openSection === 'newsletter' ? 'h-auto opacity-100 pb-6' : 'h-0 opacity-0 lg:pb-0'}`}>
              <p className="text-[14px] text-gray-400 mb-4 leading-relaxed">
                Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
              </p>
              <form className="flex flex-col sm:grid sm:grid-cols-[1fr_auto] gap-2 lg:flex lg:flex-col xl:grid xl:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full h-[44px] px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#1e9a58] focus:bg-white/10 transition-colors text-[14px]"
                  required
                  suppressHydrationWarning
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto lg:w-full xl:w-auto h-[44px] px-6 bg-[#1e9a58] text-white font-semibold rounded-xl hover:bg-[#188149] transition-colors text-[14px] flex items-center justify-center whitespace-nowrap shadow-lg shadow-green-500/20"
                  suppressHydrationWarning
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-6 lg:mt-12 pt-6 lg:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} FluxFit. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[13px]">
            <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-500 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/shipping" className="text-gray-500 hover:text-white transition-colors">Shipping Info</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
