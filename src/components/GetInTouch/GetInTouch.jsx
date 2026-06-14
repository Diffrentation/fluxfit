"use client";
import React from "react";
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

  const contactInfo = [
    {
      icon: IconMail,
      text: "fluxfit1@gmail.com",
      link: "mailto:fluxfit1@gmail.com",
      label: "Email us",
      onClick: (e) => {
        e.preventDefault();
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = "mailto:fluxfit1@gmail.com";
        } else {
          window.open("https://mail.google.com/mail/?view=cm&fs=1&to=fluxfit1@gmail.com", "_blank");
        }
      }
    },
    {
      icon: IconPhone,
      text: "+91 9958724005",
      link: "tel:+919958724005",
      label: "Call us",
    },
    {
      icon: IconMapPin,
      text: "Behrampur, Ghaziabad, Uttar Pradesh, India",
      link: "https://www.google.com/maps/place/Behrampur,+Ghaziabad,+Uttar+Pradesh,+India",
      label: "Visit us",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4">
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
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors duration-300">
                      <Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {info.label}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
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
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
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

