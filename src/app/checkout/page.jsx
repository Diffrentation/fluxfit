"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCart } from "@/context/CartContext";
import { isLoggedInForCheckout } from "@/lib/checkout-order";
import {
  normalizeProductDetailForPage,
  findMatchingProductVariant,
  getVariantAwarePricing,
} from "@/lib/publicProductsApi";
import {
  IconArrowLeft,
  IconMapPin,
  IconCreditCard,
  IconCheck,
  IconChevronRight,
  IconFileText,
  IconLock,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Button, Steps, message, Spin } from "antd";
import AddressStep from "@/components/Checkout/AddressStep";
import PaymentStep from "@/components/Checkout/PaymentStep";
import ReviewStep from "@/components/Checkout/ReviewStep";
import { blockAdminAction } from "@/lib/adminBlocker";

const { Step } = Steps;

const CheckoutPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartItems, getCartTotal, getFinalTotal, getDiscountAmount } =
    useCart();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentDetails, setPaymentDetails] = useState({});
  const [orderData, setOrderData] = useState(null);
  const [realEstimate, setRealEstimate] = useState(null);

  // Buy Now: a direct, single-product checkout that never reads or touches
  // the user's real cart. Triggered by /checkout?mode=buy-now&productId=...
  const isBuyNow = searchParams.get("mode") === "buy-now";
  const [buyNow, setBuyNow] = useState({
    loading: isBuyNow,
    error: "",
    product: null,
    variant: null,
    pricing: null,
    quantity: 1,
  });

  useEffect(() => {
    if (!isBuyNow) return;

    const productId = searchParams.get("productId") || "";
    const size = searchParams.get("size") || "";
    const color = searchParams.get("color") || "";
    const qtyParam = parseInt(searchParams.get("quantity"), 10);
    const quantity = Number.isFinite(qtyParam) && qtyParam > 0 ? qtyParam : 1;

    if (!productId) {
      setBuyNow((s) => ({ ...s, loading: false, error: "Missing product for Buy Now." }));
      return;
    }

    let cancelled = false;
    setBuyNow((s) => ({ ...s, loading: true, error: "" }));

    axios
      .get(`/api/products/${encodeURIComponent(productId)}`)
      .then(({ data }) => {
        if (cancelled) return;
        const raw = data?.success ? data.data?.product : null;
        const product = raw ? normalizeProductDetailForPage(raw) : null;
        if (!product) {
          setBuyNow((s) => ({
            ...s,
            loading: false,
            error: "This product is no longer available.",
          }));
          return;
        }

        const variant = findMatchingProductVariant(product.variants, size, color);
        const pricing = getVariantAwarePricing(product, variant);

        if (!pricing.inStock) {
          setBuyNow((s) => ({
            ...s,
            loading: false,
            error: "The selected item is out of stock.",
          }));
          return;
        }
        if (pricing.stock < quantity) {
          setBuyNow((s) => ({
            ...s,
            loading: false,
            error: `Only ${pricing.stock} item${pricing.stock === 1 ? "" : "s"} available for this item.`,
          }));
          return;
        }

        setBuyNow({ loading: false, error: "", product, variant, pricing, quantity });
      })
      .catch(() => {
        if (!cancelled) {
          setBuyNow((s) => ({
            ...s,
            loading: false,
            error: "Failed to load this product for checkout.",
          }));
        }
      });

    return () => {
      cancelled = true;
    };
    // Query params are fixed for the lifetime of this page instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuyNow]);

  const buyNowItem = useMemo(() => {
    if (!isBuyNow || !buyNow.product) return null;
    const { product, variant, pricing, quantity } = buyNow;
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0],
      price: pricing.price,
      originalPrice: pricing.originalPrice,
      size: variant?.size || "",
      color: variant?.color || "",
      quantity,
    };
  }, [isBuyNow, buyNow]);

  // Replace the flat ₹50 + 18% GST guess below with the real
  // ShippingRule/TaxRate-resolved numbers for whichever address the user
  // actually selects — same server logic /api/orders uses at order
  // creation, via the shared /api/orders/estimate endpoint. Depends on
  // `cartItems`/`selectedAddress` (real state) rather than calling
  // `getFinalTotal` in the dependency array, since that function isn't
  // memoized in CartContext and would refire this effect every render.
  useEffect(() => {
    if (!selectedAddress?.id) {
      setRealEstimate(null);
      return;
    }
    if (!isBuyNow && cartItems.length === 0) {
      setRealEstimate(null);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    const orderValue = isBuyNow
      ? (buyNowItem ? buyNowItem.price * buyNowItem.quantity : 0)
      : getFinalTotal();
    if (!(orderValue > 0)) return;

    let cancelled = false;
    axios
      .post(
        "/api/orders/estimate",
        { addressId: selectedAddress.id, orderValue },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(({ data }) => {
        if (cancelled || !data?.success) return;
        setRealEstimate(data.data);
      })
      .catch(() => {
        if (!cancelled) setRealEstimate(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress, cartItems, isBuyNow, buyNowItem]);

  // Redirect if cart is empty — never applies to Buy Now, which doesn't
  // require (or touch) the real cart at all.
  useEffect(() => {
    if (isBuyNow) return;
    if (cartItems.length === 0) {
      message.warning("Your cart is empty. Please add items to checkout.");
      router.push("/cart");
    }
  }, [isBuyNow, cartItems, router]);

  useEffect(() => {
    if (!isBuyNow && cartItems.length === 0) return;
    if (!isLoggedInForCheckout()) {
      message.info("Sign in to complete checkout and sync your cart with your account.");
      const qs = typeof window !== "undefined" ? window.location.search : "";
      router.push(`/auth/login?returnUrl=${encodeURIComponent(`/checkout${qs}`)}`);
    }
  }, [isBuyNow, cartItems.length, router]);

  const steps = [
    {
      title: "Delivery Address",
      subtitle: "Add or select delivery address",
      icon: <IconMapPin className="w-5 h-5" />,
    },
    {
      title: "Payment",
      subtitle: "Choose a payment method",
      icon: <IconCreditCard className="w-5 h-5" />,
    },
    {
      title: "Review Order",
      subtitle: "Review and place your order",
      icon: <IconFileText className="w-5 h-5" />,
    },
  ];

  const handleAddressSelect = (address, shouldProceed = false) => {
    if (blockAdminAction()) return;
    setSelectedAddress(address);
    if (shouldProceed) {
      setCurrentStep(1);
    }
  };

  const handlePaymentSelect = (method, details = {}) => {
    if (blockAdminAction()) return;
    setPaymentMethod(method);
    setPaymentDetails(details);
    setCurrentStep(2);
  };

  const handleOrderPlace = (order) => {
    if (blockAdminAction()) return;
    setOrderData(order);
    const ref = order?.orderNumber || order?.orderId;
    router.push(
      `/checkout/confirmation?orderNumber=${encodeURIComponent(ref || "")}`,
    );
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (isBuyNow) {
      // Buy Now never came from the cart — send them back to wherever they
      // triggered checkout from (the product page), not to /cart.
      router.back();
    } else {
      router.push("/cart");
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      message.error("Please select a delivery address");
      return;
    }
    setCurrentStep(1);
  };

  const handleProceedToReview = () => {
    if (!paymentMethod) {
      message.error("Please select and confirm a payment method");
      return;
    }
    setCurrentStep(2);
  };

  if (!isBuyNow && cartItems.length === 0) {
    return null;
  }

  if (isBuyNow && buyNow.loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
        <Spin size="large" tip="Loading your item…" />
      </div>
    );
  }

  if (isBuyNow && (buyNow.error || !buyNowItem)) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <IconAlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Can&apos;t check out this item
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {buyNow.error || "This product could not be loaded."}
          </p>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // All prices are in INR. Buy Now never applies a coupon, so discount is
  // always 0 there — the per-item price already reflects any variant
  // discount, it's just not a separate coupon line.
  const subtotal = (
    isBuyNow
      ? buyNowItem.price * buyNowItem.quantity
      : getCartTotal()
  ).toFixed(2);
  const discount = (isBuyNow ? 0 : getDiscountAmount()).toFixed(2);
  const finalTotal = (isBuyNow ? parseFloat(subtotal) : getFinalTotal()).toFixed(2);

  // Flat fallback (₹50 + 18% GST) used until the real ShippingRule/TaxRate
  // estimate for the selected address comes back from /api/orders/estimate.
  const shipping = realEstimate ? realEstimate.shippingCost : 50;
  const taxRatePercent = realEstimate ? realEstimate.taxRatePercent : 18;
  const tax = (
    realEstimate ? realEstimate.taxAmount : parseFloat(finalTotal) * 0.18
  ).toFixed(2);
  const grandTotal = (
    realEstimate
      ? realEstimate.total
      : parseFloat(finalTotal) + parseFloat(shipping) + parseFloat(tax)
  ).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 pb-8 sm:pb-12 transition-colors duration-300 relative overflow-hidden">
      {/* Background Decor Elements */}
      <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[#eef8f2] rounded-bl-full opacity-100 pointer-events-none z-0" style={{ right: '-10%', top: '-10%' }}></div>
      <div className="absolute top-32 right-32 grid grid-cols-4 gap-3 opacity-20 pointer-events-none z-0">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-2 h-2 bg-green-600 rounded-full"></div>
        ))}
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#1e9a58] font-bold hover:text-green-700 transition-colors mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            {isBuyNow ? "Back" : "Back to Cart"}
          </button>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] mb-2 tracking-tight">
            Checkout
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium">
            {isBuyNow
              ? "Complete your purchase for this item"
              : "Complete your purchase in a few simple steps"}
          </p>
        </motion.div>

        {/* Progress Steps Custom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 sm:mb-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4 md:gap-0">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isPending = index > currentStep;
              
              return (
                <div key={index} className="flex-1 flex items-center w-full">
                  <div className="flex items-center gap-4 relative z-10 w-full md:w-auto bg-white pr-4">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isActive || isCompleted ? 'border-[#1e9a58] bg-green-50 text-[#1e9a58]' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                        {step.icon}
                      </div>
                      <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white transition-colors duration-300 ${isActive || isCompleted ? 'bg-[#1e9a58] text-white' : 'bg-gray-400 text-white'}`}>
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className={`font-bold text-sm sm:text-base transition-colors duration-300 ${isActive || isCompleted ? 'text-[#1e9a58]' : 'text-gray-500'}`}>{step.title}</p>
                      <p className="text-xs text-gray-400 font-medium hidden lg:block">{step.subtitle}</p>
                    </div>
                  </div>
                  {/* Connecting Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block flex-1 h-[2px] mx-4 relative overflow-hidden bg-gray-100">
                      <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${isCompleted ? 'bg-[#1e9a58] w-full' : isActive ? 'bg-gradient-to-r from-[#1e9a58] to-gray-100 w-1/2' : 'w-0'}`}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 min-w-0">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AddressStep
                    onAddressSelect={handleAddressSelect}
                    selectedAddress={selectedAddress}
                  />
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PaymentStep
                    onPaymentSelect={handlePaymentSelect}
                    selectedMethod={paymentMethod}
                    paymentDetails={paymentDetails}
                    amount={grandTotal}
                  />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ReviewStep
                    address={selectedAddress}
                    paymentMethod={paymentMethod}
                    paymentDetails={paymentDetails}
                    onOrderPlace={handleOrderPlace}
                    onBack={() => setCurrentStep(1)}
                    buyNowItem={isBuyNow ? buyNowItem : null}
                    orderSummary={{
                      subtotal: parseFloat(subtotal),
                      discount: parseFloat(discount),
                      shipping: parseFloat(shipping),
                      tax: parseFloat(tax),
                      grandTotal: parseFloat(grandTotal),
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1 w-full">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-20 sm:top-24 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col h-full lg:h-auto"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#1e9a58]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Order Summary
                </h2>
              </div>
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="flex justify-between text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span>Subtotal ({isBuyNow ? 1 : cartItems.length} item{(isBuyNow ? 1 : cartItems.length) === 1 ? "" : "s"})</span>
                  <span>
                    ₹
                    {parseFloat(subtotal).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {parseFloat(discount) > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>
                      -₹
                      {parseFloat(discount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span>Shipping {realEstimate ? "(for selected address)" : "(estimated)"}</span>
                  <span>₹{shipping}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <span>Tax {realEstimate ? `(GST ${taxRatePercent}%)` : "(estimated, GST 18%)"}</span>
                  <span>₹{tax}</span>
                </div>
                <p className="text-[11px] text-gray-400 -mt-1">
                  {realEstimate
                    ? "Calculated for your selected delivery address."
                    : "Select a delivery address to see the real shipping and tax for your order."}
                </p>
                <div className="border-t border-gray-100 pt-4 flex justify-between mt-4">
                  <span className="text-lg font-bold text-gray-900">
                    Total
                  </span>
                  <span className="text-xl font-extrabold text-[#1e9a58]">
                    ₹
                    {parseFloat(grandTotal).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Security Alert Box */}
              <div className="mt-6 mb-6 bg-[#f4fbf7] border border-green-100 rounded-2xl p-4 flex gap-3">
                <IconLock className="w-5 h-5 text-[#1e9a58] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#1e9a58] mb-0.5">Safe & Secure Checkout</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Your payment information is encrypted and secure.</p>
                </div>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="flex flex-col gap-3 mt-auto">
                {currentStep === 0 && (
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md"
                  >
                    <IconLock className="w-5 h-5" />
                    Continue to Payment
                  </button>
                )}
                {currentStep === 1 && (
                  <button
                    onClick={handleProceedToReview}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md"
                  >
                    <IconLock className="w-5 h-5" />
                    Continue to Review
                  </button>
                )}
                {/* Place Order button is handled in ReviewStep for now, or we can handle it here if hoisted. Since ReviewStep handles the API call, we leave Step 2 button inside ReviewStep or trigger it. Actually, ReviewStep has its own buttons. Let's hide this wrapper's button on step 2, ReviewStep renders it. */}
                <button
                  onClick={handleBack}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-base transition-colors"
                >
                  <IconArrowLeft className="w-4 h-4" />
                  {currentStep === 0
                    ? isBuyNow
                      ? "Back"
                      : "Back to Cart"
                    : currentStep === 1
                      ? "Back to Address"
                      : "Back to Payment"}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
            <Spin size="large" />
          </div>
        }
      >
        <CheckoutPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
