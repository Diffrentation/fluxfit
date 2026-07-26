"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { productDatabase } from "@/lib/productDatabase";
import {
  IconTrash,
  IconPlus,
  IconMinus,
  IconShare,
  IconArrowLeft,
  IconTag,
  IconX,
  IconShoppingCart,
  IconHeart,
  IconEye,
  IconLock,
  IconShieldCheck,
  IconTruckDelivery,
  IconArrowBackUp,
  IconHeadset,
  IconRosetteDiscountCheck,
  IconShoppingBag,
  IconTruck,
  IconRefresh
} from "@tabler/icons-react";
import { Button, message, Input } from "antd";

// Format price helper - prices are already in INR
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const CartPage = () => {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
    addToCart,
  } = useCart();
  const { savedForLaterItems, addToSavedForLater, removeFromSavedForLater } =
    useWishlist();
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(item.id, item.size, item.color, item.customization);
      message.success("Item removed from cart");
    } else {
      updateQuantity(
        item.id,
        item.size,
        item.color,
        item.customization,
        newQuantity
      );
    }
  };

  const handleDelete = (item) => {
    removeFromCart(item.id, item.size, item.color, item.customization);
    message.success("Item removed from cart");
  };

  const handleSaveForLater = (item) => {
    addToSavedForLater(item);
    removeFromCart(item.id, item.size, item.color, item.customization);
    message.success("Item saved for later");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      message.warning("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    const result = applyCoupon(couponCode.trim());

    if (result.success) {
      message.success(result.message);
      setCouponCode("");
    } else {
      message.error(result.message);
    }

    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    message.success("Coupon removed");
  };

  const handleNavigateToProduct = (item) => {
    const queryParams = new URLSearchParams();
    if (item.size) queryParams.set('size', item.size);
    if (item.color) queryParams.set('color', item.color);
    if (item.quantity) queryParams.set('qty', item.quantity);
    router.push(`/product-details/${item.id}?${queryParams.toString()}`);
  };

  const handleMoveToCart = (item) => {
    const success = addToCart(productDatabase[item.id], {
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    });
    if (success !== false) {
      removeFromSavedForLater(item.id, item.size, item.color);
      message.success("Item moved to cart");
    }
  };

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Check out this product: ${item.name}`,
        url: `${window.location.origin}/product-details/${item.id}`,
      });
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/product-details/${item.id}`
      );
      message.success("Product link copied to clipboard!");
    }
  };

  const getProductDetails = (item) => {
    return productDatabase[item.id] || null;
  };

  const calculateDiscount = (item) => {
    const product = getProductDetails(item);
    if (product && product.originalPrice) {
      const discount =
        ((parseFloat(product.originalPrice) - parseFloat(product.price)) /
          parseFloat(product.originalPrice)) *
        100;
      return Math.round(discount);
    }
    return null;
  };

  const totalItems = getCartCount();
  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const finalTotal = getFinalTotal();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafcfb] pt-24 pb-12 relative overflow-hidden flex flex-col items-center">
        {/* Soft Background Wave */}
        <div className="absolute bottom-0 left-0 w-full h-[400px] pointer-events-none opacity-50 z-0">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
            <path fill="#eef8f2" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,224C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 flex flex-col items-center mt-10 sm:mt-16">
          {/* Custom Empty Cart Illustration */}
          <div className="relative w-64 h-48 mb-8 flex items-center justify-center">
            {/* Soft Green Circle Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#eef8f2] to-transparent rounded-full opacity-60"></div>
            
            {/* Cart Icon */}
            <IconShoppingCart className="w-24 h-24 text-[#1e9a58] relative z-10" stroke={1.5} />
            
            {/* Decorative Leaves/Sparks */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-300 rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-[#1e9a58] rounded-full opacity-40"></div>
            <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            
            <svg className="absolute w-full h-full text-green-200 opacity-50" viewBox="0 0 100 100">
              <path d="M 20 80 Q 50 10 80 20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <polygon points="80,20 75,15 85,25" fill="currentColor" />
            </svg>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] mb-4 tracking-tight">
              Your cart is <span className="text-[#1e9a58]">empty</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 font-medium mb-1">
              Looks like you haven't added anything to your cart yet.
            </p>
            <p className="text-base sm:text-lg text-gray-500 font-medium mb-8">
              Let's change that!
            </p>
            
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-green-200"
            >
              <IconShoppingBag className="w-5 h-5" />
              Continue Shopping
            </button>
          </motion.div>

          {/* Why shop with us? */}
          <div className="mt-24 sm:mt-32 w-full">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px bg-gray-200 flex-1 max-w-[150px]"></div>
              <span className="text-sm font-bold text-gray-800">Why shop with us?</span>
              <div className="h-px bg-gray-200 flex-1 max-w-[150px]"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex items-center gap-5 bg-white px-5 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-[#f4fbf7] rounded-full flex items-center justify-center shrink-0">
                  <IconShieldCheck className="w-7 h-7 text-[#1e9a58]" />
                </div>
                <div>
                  <p className="font-bold text-[#1e9a58] text-base mb-1">Secure Checkout</p>
                  <p className="text-gray-500 text-sm leading-relaxed">Your data and payments are 100% safe.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-5 bg-white px-5 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-[#f4fbf7] rounded-full flex items-center justify-center shrink-0">
                  <IconTruck className="w-7 h-7 text-[#1e9a58]" />
                </div>
                <div>
                  <p className="font-bold text-[#1e9a58] text-base mb-1">Fast Delivery</p>
                  <p className="text-gray-500 text-sm leading-relaxed">Get your order delivered on time, every time.</p>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-white px-5 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-[#f4fbf7] rounded-full flex items-center justify-center shrink-0">
                  <IconRefresh className="w-7 h-7 text-[#1e9a58]" />
                </div>
                <div>
                  <p className="font-bold text-[#1e9a58] text-base mb-1">Easy Returns</p>
                  <p className="text-gray-500 text-sm leading-relaxed">Hassle-free returns within 7 days.</p>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-white px-5 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-[#f4fbf7] rounded-full flex items-center justify-center shrink-0">
                  <IconHeadset className="w-7 h-7 text-[#1e9a58]" />
                </div>
                <div>
                  <p className="font-bold text-[#1e9a58] text-base mb-1">24/7 Support</p>
                  <p className="text-gray-500 text-sm leading-relaxed">We're always here to help you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-28 pb-8 sm:pb-12 transition-colors duration-300 relative overflow-hidden">
      {/* Background Decor Elements */}
      <div className="absolute top-10 right-10 grid grid-cols-4 gap-3 opacity-20 pointer-events-none z-0">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-2 h-2 bg-blue-500 rounded-full"></div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[300px] pointer-events-none opacity-40 z-0">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
          <path fill="#e0f2fe" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,224C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill="#bae6fd" fillOpacity="0.5" d="M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,213C672,213,768,203,864,197.3C960,192,1056,192,1152,208C1248,224,1344,256,1392,272L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 flex items-center gap-4"
        >
          <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
            <IconShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-[#1e9a58]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0d1c2f] to-[#1e3c72] tracking-tight py-0.5 sm:py-1">
              Shopping Cart
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Review your items, update quantities and proceed to checkout.</p>
          </div>
        </motion.div>

        <div className="border-b border-gray-300 dark:border-gray-700 mb-4 sm:mb-6"></div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 relative">
          {/* Cart Items - Scrollable */}
          <div className="flex-1 min-w-0">
            <div className="space-y-4 sm:space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto pr-0 sm:pr-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
              <AnimatePresence>
                {cartItems.map((item, index) => {
                  const product = getProductDetails(item);
                  const discount = calculateDiscount(item);
                  const itemPrice = parseFloat(item.price);
                  const itemTotal = itemPrice * item.quantity;
                  const originalPrice = product?.originalPrice
                    ? parseFloat(product.originalPrice)
                    : null;

                  return (
                    <motion.div
                      key={`${item.id}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 relative"
                    >
                      <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[120px_1fr] md:grid-cols-[140px_1fr] gap-4">
                        {/* Product Image */}
                        <div 
                          className="relative w-full aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden cursor-pointer shrink-0"
                          onClick={() => handleNavigateToProduct(item)}
                        >
                          {/* Floating Top Right Mobile Remove */}
                          <button onClick={() => handleDelete(item)} className="absolute top-1 right-1 z-10 p-1.5 bg-white/90 backdrop-blur rounded-full text-gray-500 hover:text-red-600 shadow-sm md:hidden">
                            <IconX className="w-3.5 h-3.5" />
                          </button>

                          {item.customization?.previewDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.customization.previewDataUrl}
                              alt={item.name}
                              className="w-full h-full object-contain bg-white hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <Image
                              src={item.image || product?.images?.[0] || ""}
                              alt={item.name}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-300"
                            />
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex flex-col relative">
                          {/* Desktop Top Right Icons */}
                          <div className="hidden md:flex absolute top-0 right-0 gap-2 z-10">
                            <button onClick={() => handleSaveForLater(item)} className="p-2 bg-white border border-gray-200 rounded-full text-[#1e9a58] hover:bg-green-50 shadow-sm transition-colors">
                              <IconHeart className="w-4 h-4" stroke={1.5} />
                            </button>
                            <button onClick={() => handleDelete(item)} className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 shadow-sm transition-colors">
                              <IconX className="w-4 h-4" stroke={1.5} />
                            </button>
                          </div>

                          <div className="pr-0 md:pr-20 mb-2">
                            <h2 
                              className="text-[15px] sm:text-base md:text-lg font-bold text-gray-900 mb-1 leading-tight line-clamp-2 cursor-pointer hover:text-[#1e9a58]"
                              onClick={() => handleNavigateToProduct(item)}
                            >
                              {item.name}
                            </h2>
                            {product?.description && (
                              <p className="text-[12px] sm:text-[13px] text-gray-500 line-clamp-1 mb-2">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 bg-green-50 text-[#1e9a58] font-semibold rounded">
                              In stock
                            </span>
                            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 bg-green-50 text-[#1e9a58] font-semibold rounded">
                              Fulfilled
                            </span>
                          </div>

                          {/* Variations */}
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            {item.color && (
                              <span className="text-[12px] sm:text-[13px] text-gray-600">
                                <span className="font-medium text-gray-800">Color:</span> <span className="capitalize">{item.color}</span>
                              </span>
                            )}
                            {item.size && item.size !== "One Size" && (
                              <span className="text-[12px] sm:text-[13px] text-gray-600">
                                <span className="font-medium text-gray-800">Size:</span> {item.size}
                              </span>
                            )}
                          </div>

                          {/* Customization Details Block */}
                          {item.customization && (
                            <div className="mt-1 mb-3 p-2.5 bg-purple-50/50 rounded-xl border border-purple-100">
                              <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider mb-1.5">Custom Design</p>
                              <div className="flex gap-2.5 items-start">
                                {item.customization.previewDataUrl && (
                                  <div className="relative w-12 h-12 bg-white rounded-lg border border-purple-200 overflow-hidden flex-shrink-0 shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.customization.previewDataUrl} alt="Design preview" className="w-full h-full object-contain" />
                                  </div>
                                )}
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  {item.customization.fabricId && (
                                    <p className="text-[10px] sm:text-[11px] text-gray-600 line-clamp-1"><span className="font-semibold text-purple-700">Base:</span> <span className="capitalize">{item.customization.fabricId}</span></p>
                                  )}
                                  {["front", "back"].map((view) => {
                                    const viewData = item.customization.views?.[view];
                                    const activeLayers = (viewData?.layers ?? []).filter(l => l.designId && l.designId !== "none");
                                    if (!activeLayers.length) return null;
                                    return (
                                      <p key={view} className="text-[10px] sm:text-[11px] text-gray-600 line-clamp-1">
                                        <span className="font-semibold text-purple-700 capitalize">{view}:</span> {activeLayers.map(l => l.type === "text" ? "Text" : (l.designId === "upload" ? "Upload" : l.designId)).join(", ")}
                                      </p>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Pricing & Quantity */}
                          <div className="mt-auto pt-2">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2.5">
                              <div className="flex items-baseline gap-1.5 sm:gap-2">
                                <span className="text-lg sm:text-xl font-bold text-gray-900">
                                  ₹{formatPrice(itemTotal)}
                                </span>
                                {originalPrice && (
                                  <span className="text-[11px] sm:text-[13px] text-gray-500 line-through">
                                    ₹{formatPrice(originalPrice)}
                                  </span>
                                )}
                              </div>
                              {discount && originalPrice && (
                                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 bg-red-50 text-red-600 font-bold rounded border border-red-100">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>
                            
                            {/* Quantity Selector */}
                            <div className="inline-flex items-center border border-gray-200 bg-white rounded-lg shadow-sm h-[32px] sm:h-[36px]">
                              {item.quantity === 1 ? (
                                <button type="button" onClick={() => handleDelete(item)} className="w-8 sm:w-10 h-full flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors">
                                  <IconTrash className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]" />
                                </button>
                              ) : (
                                <button type="button" onClick={() => handleQuantityChange(item, parseInt(item.quantity, 10) - 1)} className="w-8 sm:w-10 h-full flex items-center justify-center hover:bg-gray-50 text-gray-700 transition-colors">
                                  <IconMinus className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]" />
                                </button>
                              )}
                              <span className="w-10 sm:w-12 h-full flex items-center justify-center font-semibold text-[13px] sm:text-sm text-gray-900 border-x border-gray-100 bg-gray-50/50">
                                {item.quantity}
                              </span>
                              <button type="button" onClick={() => handleQuantityChange(item, parseInt(item.quantity, 10) + 1)} className="w-8 sm:w-10 h-full flex items-center justify-center hover:bg-gray-50 text-gray-700 transition-colors">
                                <IconPlus className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Grid */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 border-t border-gray-100 pt-4">
                        <button onClick={() => handleDelete(item)} className="h-[40px] sm:h-[44px] flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl text-[13px] sm:text-[14px] font-semibold border border-red-100 hover:bg-red-600 hover:text-white transition-colors shadow-sm">
                          <IconTrash className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" /> <span className="truncate">Delete</span>
                        </button>
                        <button onClick={() => handleSaveForLater(item)} className="h-[40px] sm:h-[44px] flex items-center justify-center gap-2 bg-white text-gray-700 rounded-xl text-[13px] sm:text-[14px] font-semibold border border-gray-200 hover:border-[#1e9a58] hover:text-[#1e9a58] transition-colors shadow-sm">
                          <IconHeart className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" /> <span className="truncate">Save for later</span>
                        </button>
                        <button onClick={() => handleNavigateToProduct(item)} className="h-[40px] sm:h-[44px] flex items-center justify-center gap-2 bg-white text-gray-700 rounded-xl text-[13px] sm:text-[14px] font-semibold border border-gray-200 hover:border-[#1e9a58] hover:text-[#1e9a58] transition-colors shadow-sm">
                          <IconEye className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" /> <span className="truncate">View details</span>
                        </button>
                        <button onClick={() => handleShare(item)} className="h-[40px] sm:h-[44px] flex items-center justify-center gap-2 bg-[#f4fbf7] text-[#1e9a58] rounded-xl text-[13px] sm:text-[14px] font-semibold border border-green-100 hover:bg-[#1e9a58] hover:text-white transition-colors shadow-sm">
                          <IconShare className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" /> <span className="truncate">Share</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Trust Badges Footer */}
              {cartItems.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <div className="flex items-center gap-4 py-2 md:py-0 pr-0 md:pr-4">
                      <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                        <IconShieldCheck className="w-6 h-6 text-[#1e9a58]" stroke={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1e9a58]">100% Safe & Secure</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">We protect your order from checkout to delivery.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 py-4 md:py-0 px-0 md:px-6">
                      <div className="flex -space-x-3 shrink-0">
                        <img src="https://i.pravatar.cc/100?img=11" alt="customer" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                        <img src="https://i.pravatar.cc/100?img=32" alt="customer" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                        <img src="https://i.pravatar.cc/100?img=33" alt="customer" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1e9a58]">Join 50K+ happy customers</p>
                        <p className="text-xs text-gray-500 mt-1">Rated 4.8/5 by our customers</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-4 md:py-0 pl-0 md:pl-6">
                      <div className="w-12 h-12 rounded-xl bg-[#1e9a58] flex items-center justify-center shrink-0 shadow-md">
                        <IconRosetteDiscountCheck className="w-6 h-6 text-white" stroke={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1e9a58]">Quality You Can Trust</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">Premium products, handpicked for you.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subtotal Section - Fixed on Right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[380px] shrink-0"
          >
            <div className="sticky top-20 sm:top-28 space-y-6">
              <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-6 lg:p-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Order Summary
                </h2>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 mb-3 sm:mb-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Subtotal ({totalItems}{" "}
                      {totalItems === 1 ? "item" : "items"}):
                    </p>
                    <span className="text-lg sm:text-xl text-end font-bold text-gray-900 dark:text-white">
                      ₹{formatPrice(subtotal)}
                    </span>
                  </div>

                  {/* Coupon Section */}
                  <div className="space-y-2">
                    {appliedCoupon ? (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 sm:p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconTag className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs sm:text-sm font-semibold text-green-800 dark:text-green-400">
                              {appliedCoupon.code}
                            </span>
                          </div>
                          <button
                            onClick={handleRemoveCoupon}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                          >
                            <IconX className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-700 dark:text-green-400">
                            Discount:
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-green-800 dark:text-green-400">
                            -₹{formatPrice(discount)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onPressEnter={handleApplyCoupon}
                            className="flex-1 border-green-200 hover:border-green-400 focus:border-green-500 rounded-xl"
                            prefix={
                              <IconTag className="w-4 h-4 text-[#1e9a58]" />
                            }
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon}
                            className="w-full sm:w-auto px-4 py-2 border border-green-200 text-[#1e9a58] rounded-xl font-semibold hover:bg-green-50 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                        <p className="text-xs text-[#1e9a58] mt-2 font-medium">
                          Try: WELCOME10, SAVE20, FLAT50, SUMMER25
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm font-bold text-gray-900">Shipping</p>
                    <span className="text-sm font-medium text-gray-500">Calculated at checkout</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <p className="text-sm font-bold text-gray-900">Taxes</p>
                    <span className="text-sm font-medium text-gray-500">Calculated at checkout</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-base font-bold text-gray-900">
                      Total <span className="text-xs text-gray-500 font-normal">(Incl. taxes)</span>
                    </p>
                    <span className="text-sm font-bold text-[#1e9a58]">
                      Calculated at checkout
                    </span>
                  </div>
                </div>
                <button
                  className="w-full py-3.5 mb-4 px-6 rounded-xl text-base font-bold text-white transition-all duration-200 shadow-md bg-[#1e9a58] hover:bg-green-700 flex items-center justify-center gap-2"
                  onClick={() => router.push("/checkout")}
                >
                  <IconLock className="w-5 h-5" /> Proceed to Checkout
                </button>
                <button
                  className="w-full py-3 px-6 rounded-xl text-base font-semibold text-gray-700 transition-all duration-200 border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm"
                  onClick={() => router.push("/")}
                >
                  <IconLock className="w-5 h-5" /> Continue Shopping
                </button>
              </div>

              {/* Why Shop With Us Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8">
                <h3 className="font-bold text-gray-900 mb-6 text-lg">Why shop with us?</h3>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <IconShieldCheck className="w-5 h-5 text-[#1e9a58]" stroke={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Secure Checkout</p>
                      <p className="text-xs text-gray-500 mt-0.5">Your data and payments are safe</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <IconTruckDelivery className="w-5 h-5 text-[#1e9a58]" stroke={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Fast Delivery</p>
                      <p className="text-xs text-gray-500 mt-0.5">Get your order delivered on time</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <IconArrowBackUp className="w-5 h-5 text-[#1e9a58]" stroke={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Easy Returns</p>
                      <p className="text-xs text-gray-500 mt-0.5">Not happy? Return within 7 days</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <IconHeadset className="w-5 h-5 text-[#1e9a58]" stroke={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">24/7 Support</p>
                      <p className="text-xs text-gray-500 mt-0.5">We're always here to help you</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Saved for Later Section */}
        {savedForLaterItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 sm:mt-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Saved for Later ({savedForLaterItems.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {savedForLaterItems.map((item, index) => {
                const product = getProductDetails(item);
                const itemPrice = parseFloat(item.price);
                const itemTotal = itemPrice * item.quantity;

                return (
                  <motion.div
                    key={`${item.id}-${item.size}-${item.color}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-3xl shadow-sm p-4 sm:p-5 border border-gray-200"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <Image
                          src={item.image || product?.images?.[0] || ""}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                          {item.name}
                        </h3>
                        {item.size && item.size !== "One Size" && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Size: {item.size}
                          </p>
                        )}
                        {item.color && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 capitalize">
                            Color: {item.color}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                          ₹{formatPrice(itemTotal)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="small"
                            type="primary"
                            icon={<IconShoppingCart className="w-4 h-4" />}
                            onClick={() => handleMoveToCart(item)}
                            className="flex-1"
                          >
                            Move to Cart
                          </Button>
                          <Button
                            size="small"
                            danger
                            icon={<IconTrash className="w-4 h-4" />}
                            onClick={() => {
                              removeFromSavedForLater(
                                item.id,
                                item.size,
                                item.color
                              );
                              message.success("Item removed");
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
