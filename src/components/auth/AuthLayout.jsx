import React from "react";
import Image from "next/image";
import { 
  IconShoppingBag, 
  IconShieldCheck, 
  IconHeadset,
  IconTruck,
  IconArrowBackUp,
  IconCertificate,
  IconLockSquareRounded
} from "@tabler/icons-react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f0f7fb] flex flex-col font-sans">
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1400px] mx-auto p-4 sm:p-8 lg:p-12 gap-8 lg:gap-16">
        
        {/* Left Column: Info & Illustration */}
        <div className="w-full lg:w-5/12 flex flex-col justify-center relative mt-12 lg:mt-0">
          
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] mb-2 tracking-tight">
              Welcome to <br className="hidden lg:block" />
              <span className="text-[#1e9a58]">FluxFit</span>
            </h1>
            <div className="h-1 w-12 bg-[#1e9a58] rounded-full mb-6"></div>
            <p className="text-gray-500 font-medium text-lg max-w-sm">
              Create your account and unlock a better shopping experience.
            </p>
          </div>

          <div className="space-y-8 mb-12">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#1e9a58] flex items-center justify-center shrink-0">
                <IconShoppingBag className="w-6 h-6 text-[#1e9a58]" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Seamless Shopping</h3>
                <p className="text-gray-500 text-sm">Browse and shop your favorite products with ease.</p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#1e9a58] flex items-center justify-center shrink-0">
                <IconShieldCheck className="w-6 h-6 text-[#1e9a58]" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Secure & Safe</h3>
                <p className="text-gray-500 text-sm">Your data is 100% protected and secure.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#1e9a58] flex items-center justify-center shrink-0">
                <IconHeadset className="w-6 h-6 text-[#1e9a58]" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">24/7 Support</h3>
                <p className="text-gray-500 text-sm">We're always here to help you whenever you need.</p>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-[400px] h-[300px]">
            <Image 
              src="/auth-illustration.png" 
              alt="Auth Illustration" 
              fill
              className="object-contain object-left-bottom"
              priority
            />
          </div>
          
          {/* Background decorative dots */}
          <div className="absolute -left-8 top-1/2 w-32 h-32 opacity-20 pointer-events-none hidden lg:block" style={{ backgroundImage: 'radial-gradient(#1e9a58 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
        </div>

        {/* Right Column: Form */}
        <div className="w-full lg:w-7/12 flex items-center justify-center relative z-10">
          <div className="w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 sm:p-10 lg:p-12 relative overflow-hidden">
            {children}
          </div>
        </div>

      </div>

      {/* Footer Trust Badges */}
      <div className="w-full bg-white border-t border-gray-100 py-8 mt-auto relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
            <IconTruck className="w-8 h-8 text-[#1e9a58]" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Free Shipping</p>
              <p className="text-gray-500 text-xs mt-0.5">On all orders above ₹999</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:text-left gap-3">
            <IconArrowBackUp className="w-8 h-8 text-[#1e9a58]" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Easy Returns</p>
              <p className="text-gray-500 text-xs mt-0.5">Hassle-free returns</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:text-left gap-3">
            <IconCertificate className="w-8 h-8 text-[#1e9a58]" />
            <div>
              <p className="font-bold text-gray-900 text-sm">100% Authentic</p>
              <p className="text-gray-500 text-xs mt-0.5">Original products only</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:text-left gap-3">
            <IconLockSquareRounded className="w-8 h-8 text-[#1e9a58]" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Secure Payments</p>
              <p className="text-gray-500 text-xs mt-0.5">Safe & trusted checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
