"use client";

import React from "react";
import Image from "next/image";
import ContactForm from "@/components/ContactUs/contact";
import { 
  IconHeadphones, 
  IconMail, 
  IconPhoneCall, 
  IconMapPin, 
  IconShieldCheck,
  IconMessageCircle,
  IconUserCheck,
  IconHeartHandshake,
  IconSend
} from "@tabler/icons-react";

function ContactPage() {
  return (
    <div className="min-h-screen bg-[#fafcfb] pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 pt-8 sm:pt-12">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12 gap-8 relative overflow-hidden lg:overflow-visible">
          <div className="z-10 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-[#111827] tracking-tight mb-4">
              We'd Love to <span className="text-[#1e9a58]">Hear From You!</span>
            </h1>
            <div className="w-16 h-1 bg-[#1e9a58] mb-6 rounded-full"></div>
            <p className="text-gray-500 text-lg">
              Have a question, suggestion, or need help? Drop us a message.
              <br className="hidden sm:block" />
              Our team is here to assist you.
            </p>
          </div>
          
          {/* Illustration built with Icons */}
          <div className="absolute right-0 top-0 -mr-10 lg:-mr-0 lg:relative opacity-20 lg:opacity-100 z-0 pointer-events-none lg:w-[400px] h-[250px] flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Decorative dashed line */}
              <svg className="absolute w-[200px] h-[100px] right-[120px] top-[120px] text-green-200" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6">
                <path d="M0 80 Q 100 120 200 20" />
              </svg>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#eaf5ef] rounded-full blur-2xl"></div>
              
              <IconMail stroke={1.5} className="absolute top-[55%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-gray-300 drop-shadow-sm" />
              <div className="absolute top-[55%] left-[50%] ml-12 -mt-10 w-6 h-6 bg-[#1e9a58] rounded-full border-4 border-[#fafcfb] flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full"></span>
              </div>
              <IconSend stroke={1.5} className="absolute top-[25%] left-[30%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-[#1e9a58] -rotate-12 drop-shadow-md" />
            </div>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Contact Info Card */}
          <div className="lg:col-span-4 bg-[#f4fbf7] rounded-3xl p-6 sm:p-8 border border-[#eaf5ef] shadow-sm relative overflow-hidden h-full flex flex-col justify-between">
            {/* Background decoration */}
            <div className="absolute -left-16 top-20 w-40 h-40 bg-white/40 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-8 z-10">
              {/* Let's Connect */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full border-2 border-[#1e9a58]/20 flex items-center justify-center shrink-0 text-[#1e9a58] bg-white">
                  <IconHeadphones className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#111827] text-lg">Let's connect</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    We're here to help and answer any questions you might have.
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-[#1e9a58]/10"></div>

              {/* Email Us */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[#1e9a58] bg-white shadow-sm border border-gray-100">
                  <IconMail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#111827] text-sm mb-0.5">Email Us</h4>
                  <a href="mailto:support@startup.com" className="text-sm text-gray-600 hover:text-[#1e9a58] transition">
                    support@fluxfit.com
                  </a>
                </div>
              </div>

              {/* Call Us */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[#1e9a58] bg-white shadow-sm border border-gray-100">
                  <IconPhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#111827] text-sm mb-0.5">Call Us</h4>
                  <p className="text-sm text-gray-600">
                    +91 98765 43210
                    <br />
                    <span className="text-xs text-gray-400 mt-1 block">(Mon - Sat, 9AM - 7PM)</span>
                  </p>
                </div>
              </div>

              {/* Visit Us */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[#1e9a58] bg-white shadow-sm border border-gray-100">
                  <IconMapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#111827] text-sm mb-0.5">Visit Us</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    FluxFit HQ, 123 Fashion Street,
                    <br />
                    Mumbai, Maharashtra, India - 400001
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Shield */}
            <div className="mt-8 z-10 w-full bg-[#eaf5ef]/50 border border-[#1e9a58]/20 rounded-xl p-4 flex gap-3">
              <div className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center text-[#1e9a58] shadow-sm">
                <IconShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Your privacy matters</h4>
                <p className="text-xs text-gray-600 mt-1 leading-snug">
                  We never share your information with anyone. Ever.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-8 h-full">
            <ContactForm />
          </div>

        </div>

        {/* Footer Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 px-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#f4fbf7] flex items-center justify-center shrink-0">
              <IconMessageCircle className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <div>
              <h4 className="font-bold text-[#111827] text-sm">Quick Response</h4>
              <p className="text-xs text-gray-500 mt-0.5">We reply within a few hours</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#f4fbf7] flex items-center justify-center shrink-0">
              <IconShieldCheck className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <div>
              <h4 className="font-bold text-[#111827] text-sm">Secure & Private</h4>
              <p className="text-xs text-gray-500 mt-0.5">Your data is always protected</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#f4fbf7] flex items-center justify-center shrink-0">
              <IconUserCheck className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <div>
              <h4 className="font-bold text-[#111827] text-sm">Expert Support</h4>
              <p className="text-xs text-gray-500 mt-0.5">Trained team to help you</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#f4fbf7] flex items-center justify-center shrink-0">
              <IconHeartHandshake className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <div>
              <h4 className="font-bold text-[#111827] text-sm">We Care</h4>
              <p className="text-xs text-gray-500 mt-0.5">Your satisfaction is our priority</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ContactPage;
