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
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
            <IconShoppingCart className="w-8 h-8 text-[#1e9a58]" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0d1c2f] to-[#1e3c72] tracking-tight py-1">
              Shopping Cart
            </h1>
            <p className="text-gray-500 text-sm font-medium">Review your items, update quantities and proceed to checkout.</p>
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
                      className="bg-white rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8 border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative">
                        {/* Thumbnails (if any) */}
                        <div className="hidden sm:flex flex-col gap-2">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative cursor-pointer hover:border-[#1e9a58]">
                            {item.customization?.previewDataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.customization.previewDataUrl} alt="custom design thumb" className="w-full h-full object-contain" />
                            ) : (
                              <Image src={item.image || product?.images?.[0] || ""} alt="thumb" fill className="object-cover" />
                            )}
                          </div>
                          {[1, 2, 3].map((_, i) => (
                            <div key={i} className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative cursor-pointer hover:border-[#1e9a58]">
                              <Image src={product?.images?.[i + 1] || product?.images?.[0] || item.image || ""} alt="thumb" fill className="object-cover" />
                            </div>
                          ))}
                          <div className="w-12 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 text-xs font-semibold text-gray-600 cursor-pointer">
                            +2
                          </div>
                        </div>

                        {/* Product Image */}
                        <div 
                          className="relative w-full sm:w-48 md:w-56 h-48 sm:h-auto shrink-0 bg-gray-100 rounded-2xl overflow-hidden cursor-pointer"
                          onClick={() => handleNavigateToProduct(item)}
                        >
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
                        <div className="flex-1 flex flex-col relative pt-1">
                          {/* Product Name and Description */}
                          <div className="mb-2 sm:mb-3 pr-24">
                            <h2 
                              className="text-base sm:text-lg font-bold text-gray-900 mb-1 cursor-pointer hover:text-[#1e9a58] transition-colors"
                              onClick={() => handleNavigateToProduct(item)}
                            >
                              {item.name}
                            </h2>
                            {product?.description && (
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>

                          <div className="absolute top-0 right-0 flex gap-2">
                            <button onClick={() => handleSaveForLater(item)} className="p-2 bg-white border border-gray-200 rounded-full text-[#1e9a58] hover:bg-green-50 shadow-sm transition-colors">
                              <IconHeart className="w-5 h-5" stroke={1.5} />
                            </button>
                            <button onClick={() => handleDelete(item)} className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 shadow-sm transition-colors">
                              <IconX className="w-5 h-5" stroke={1.5} />
                            </button>
                          </div>

                          {/* Best Seller Tag */}
                          {product?.rating && product.rating >= 4.5 && (
                            <div className="mb-3">
                              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                                #1 Best Seller
                              </span>
                            </div>
                          )}

                          {/* Stock Status */}
                          <div className="mb-2 sm:mb-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm px-2 py-0.5 bg-green-50 text-[#1e9a58] font-semibold rounded">
                              In stock
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-green-50 text-[#1e9a58] font-semibold rounded">
                              Fulfilled
                            </span>
                            {item.customization && (
                              <span className="text-xs px-2.5 py-0.5 bg-purple-50 text-purple-700 font-bold rounded border border-purple-100 flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                                Customized
                              </span>
                            )}
                          </div>

                          {/* Color */}
                          {item.color && (
                            <div className="mb-2 sm:mb-3">
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Colour:</span>{" "}
                                <span className="capitalize">{item.color}</span>
                              </span>
                            </div>
                          )}

                          {/* Size */}
                          {item.size && item.size !== "One Size" && (
                            <div className="mb-2 sm:mb-3">
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Size:</span>{" "}
                                {item.size}
                              </span>
                            </div>
                          )}

                          {/* Customization Details Block */}
                          {item.customization && (
                            <div className="mt-2 mb-4 p-3 bg-purple-50/50 rounded-2xl border border-purple-100 max-w-md">
                              <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider mb-2">Custom Design Configuration</p>
                              <div className="flex gap-3 items-start">
                                {item.customization.previewDataUrl && (
                                  <div className="relative w-16 h-16 bg-white rounded-xl border border-purple-200 overflow-hidden flex-shrink-0 shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                      src={item.customization.previewDataUrl} 
                                      alt="Design preview" 
                                      className="w-full h-full object-contain" 
                                    />
                                  </div>
                                )}
                                <div className="space-y-1 min-w-0 flex-1">
                                  {item.customization.fabricId && (
                                    <p className="text-[11px] text-gray-600">
                                      <span className="font-semibold text-purple-700">Fabric/Color:</span>{" "}
                                      <span className="capitalize">{item.customization.fabricId}</span>
                                    </p>
                                  )}
                                  {item.customization.mockupTemplateName && (
                                    <p className="text-[11px] text-gray-600">
                                      <span className="font-semibold text-purple-700">Garment Base:</span>{" "}
                                      <span className="capitalize">{item.customization.mockupTemplateName}</span>
                                    </p>
                                  )}
                                  {/* Print layers info */}
                                  {["front", "back"].map((view) => {
                                    const viewData = item.customization.views?.[view];
                                    const activeLayers = (viewData?.layers ?? []).filter(
                                      (l) => l.designId && l.designId !== "none"
                                    );
                                    if (!activeLayers.length) return null;
                                    return (
                                      <p key={view} className="text-[11px] text-gray-600 truncate">
                                        <span className="font-semibold text-purple-700 capitalize">{view} prints:</span>{" "}
                                        <span>
                                          {activeLayers.map((l) => {
                                            if (l.type === "text") {
                                              return `Text ("${l.text || ''}")`;
                                            }
                                            return l.designId === "upload" ? "Custom upload" : l.designId;
                                          }).join(", ")}
                                        </span>
                                      </p>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Price Section */}
                          <div className="mt-auto">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                {discount && originalPrice && (
                                  <div className="mb-2">
                                    <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded mr-2">
                                      {discount}% off
                                    </span>
                                    <span className="text-xs text-red-600 font-semibold">
                                      Limited time deal
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                    ₹{formatPrice(itemTotal)}
                                  </span>
                                  {originalPrice && (
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                                      M.R.P.: ₹{formatPrice(originalPrice)}
                                    </span>
                                  )}
                                </div>
                                {item.quantity > 1 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    ₹{formatPrice(itemPrice)} per item
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex items-center border border-green-200 bg-white rounded-xl overflow-hidden shadow-sm">
                                {item.quantity === 1 ? (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(item)}
                                    className="p-2 hover:bg-red-50 transition-colors text-red-600"
                                    aria-label="Delete item"
                                  >
                                    <IconTrash className="w-5 h-5" />
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                      handleQuantityChange(
                                        item,
                                        parseInt(item.quantity, 10) - 1
                                      )
                                    }
                                    className="p-2 hover:bg-green-50 transition-colors text-[#1e9a58]"
                                    aria-label="Decrease quantity"
                                  >
                                    <IconMinus className="w-5 h-5" />
                                  </motion.button>
                                )}
                                <span className="px-4 py-2 font-bold text-gray-900 border-x border-green-100 bg-white min-w-[60px] text-center">
                                  {item.quantity}
                                </span>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    handleQuantityChange(
                                      item,
                                      parseInt(item.quantity, 10) + 1
                                    )
                                  }
                                  className="p-2 hover:bg-green-50 transition-colors text-[#1e9a58]"
                                  aria-label="Increase quantity"
                                >
                                  <IconPlus className="w-5 h-5" />
                                </motion.button>
                              </div>
                            </div>

                            {/* Action Links */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                              <button
                                onClick={() => handleDelete(item)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100 hover:bg-red-600 hover:text-white transition-colors shadow-sm flex items-center gap-1.5"
                              >
                                <IconTrash className="w-4 h-4" /> Delete
                              </button>
                              <button
                                onClick={() => handleSaveForLater(item)}
                                className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 hover:border-[#1e9a58] hover:text-[#1e9a58] transition-colors shadow-sm flex items-center gap-1.5"
                              >
                                <IconHeart className="w-4 h-4" /> Save for later
                              </button>
                              <button
                                onClick={() => handleNavigateToProduct(item)}
                                className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 hover:border-[#1e9a58] hover:text-[#1e9a58] transition-colors shadow-sm flex items-center gap-1.5"
                              >
                                <IconEye className="w-4 h-4" /> View details
                              </button>
                              <button
                                onClick={() => handleShare(item)}
                                className="px-3 py-1.5 bg-green-50 text-[#1e9a58] rounded-lg text-xs font-semibold border border-green-100 hover:bg-[#1e9a58] hover:text-white transition-colors shadow-sm flex items-center gap-1.5"
                              >
                                <IconShare className="w-4 h-4" /> Share
                              </button>
                            </div>
                          </div>
                        </div>
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
