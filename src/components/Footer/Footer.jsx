"use client";
import React from "react";
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandLinkedin,
} from "@tabler/icons-react";
import Link from "next/link";

const Footer = () => {
  const navItems = [
    { name: "Home", link: "/" },
    { name: "Shop", link: "/product-list" },
    { name: "About", link: "/about" },
    { name: "Contact", link: "/contact" },
  ];

  const contactInfo = [
    {
      icon: IconMail,
      text: "fluxfit1@gmail.com",
      link: "mailto:fluxfit1@gmail.com",
    },
    {
      icon: IconPhone,
      text: "+91 9958724005",
      link: "tel:+91 9958724005",
    },
    {
      icon: IconMapPin,
      text: "Behrampur, Ghaziabad, Uttar Pradesh, India",
      link: "https://www.google.com/maps/place/Behrampur,+Ghaziabad,+Uttar+Pradesh,+India/@26.7847217,85.1113416,15z/data=!3m1!4b1!4m6!3m5!1s0x39ec105b0e0466e1:0x262a13458380518a!8m2!3d26.7847217!4d85.1113416!16s%2Fg%2F11c402jtvb?entry=ttu&g_ep=EgoyMDI1MDIyMi4wIKXMDSoASAFQAw%3D%3D",
    },
  ];

  const socialLinks = [
    { icon: IconBrandFacebook, link: "#", label: "Facebook" },
    { icon: IconBrandTwitter, link: "#", label: "Twitter" },
    { icon: IconBrandInstagram, link: "#", label: "Instagram" },
    { icon: IconBrandLinkedin, link: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <img
                src="https://assets.aceternity.com/logo-dark.png"
                alt="FluxFit Logo"
                width={40}
                height={40}
                className="group-hover:opacity-80 transition-opacity"
              />
              <span className="text-white text-xl font-bold">FluxFit</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one-stop destination for the latest fashion trends and
              quality products. We bring style and comfort together.
            </p>
            {/* Social Media Links */}
            <div className="flex items-center gap-4 pt-2">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.link}
                    aria-label={social.label}
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.link}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <li key={index}>
                    <a
                      href={info.link}
                      className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors text-sm group"
                    >
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0 group-hover:text-white" />
                      <span className="leading-relaxed">{info.text}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Newsletter
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Subscribe to our newsletter to get updates on new products and
              exclusive offers.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} FluxFit. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/shipping"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Shipping Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
