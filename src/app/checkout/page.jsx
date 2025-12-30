"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import {
  IconArrowLeft,
  IconMapPin,
  IconCreditCard,
  IconCheck,
  IconChevronRight,
} from "@tabler/icons-react";
import { Button, Steps, message } from "antd";
import AddressStep from "@/components/Checkout/AddressStep";
import PaymentStep from "@/components/Checkout/PaymentStep";
import ReviewStep from "@/components/Checkout/ReviewStep";

const { Step } = Steps;

const CheckoutPage = () => {
  const router = useRouter();
  const { cartItems, getCartTotal, getFinalTotal, getDiscountAmount } =
    useCart();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});
  const [orderData, setOrderData] = useState(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      message.warning("Your cart is empty. Please add items to checkout.");
      router.push("/cart");
    }
  }, [cartItems, router]);

  const steps = [
    {
      title: "Delivery Address",
      icon: <IconMapPin className="w-5 h-5" />,
    },
    {
      title: "Payment",
      icon: <IconCreditCard className="w-5 h-5" />,
    },
    {
      title: "Review Order",
      icon: <IconCheck className="w-5 h-5" />,
    },
  ];

  const handleAddressSelect = (address, shouldProceed = false) => {
    setSelectedAddress(address);
    if (shouldProceed) {
      setCurrentStep(1);
    }
  };

  const handlePaymentSelect = (method, details = {}) => {
    setPaymentMethod(method);
    setPaymentDetails(details);
    setCurrentStep(2);
  };

  const handleOrderPlace = (order) => {
    setOrderData(order);
    // Navigate to order confirmation
    router.push(`/checkout/confirmation?orderId=${order.orderId}`);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push("/cart");
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  // Convert USD to INR (rate: 1 USD = 83 INR)
  const USD_TO_INR_RATE = 83;

  // All cart totals are in USD, convert to INR
  const subtotalUSD = getCartTotal();
  const discountUSD = getDiscountAmount();
  const finalTotalUSD = getFinalTotal();

  // Convert to INR
  const subtotal = (subtotalUSD * USD_TO_INR_RATE).toFixed(2);
  const discount = (discountUSD * USD_TO_INR_RATE).toFixed(2);
  const finalTotal = (finalTotalUSD * USD_TO_INR_RATE).toFixed(2);

  const shipping = 50; // Shipping cost in INR
  const tax = (parseFloat(finalTotal) * 0.18).toFixed(2); // 18% GST on final total in INR
  const grandTotal = (
    parseFloat(finalTotal) +
    parseFloat(shipping) +
    parseFloat(tax)
  ).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            type="text"
            icon={<IconArrowLeft className="w-4 h-4" />}
            onClick={handleBack}
            className="mb-4"
          >
            Back to Cart
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Checkout
          </h1>
          <p className="text-gray-600">
            Complete your purchase in a few simple steps
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <Steps
            current={currentStep}
            className="hidden md:block"
            items={steps.map((step, index) => ({
              title: step.title,
              icon: step.icon,
            }))}
          />
          {/* Mobile Steps */}
          <div className="md:hidden flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col items-center flex-1 ${
                  index < steps.length - 1 ? "border-r border-gray-200" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    index <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < currentStep ? (
                    <IconCheck className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={`text-xs text-center ${
                    index <= currentStep
                      ? "text-blue-600 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
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
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                {parseFloat(discount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span>₹{shipping}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax (GST 18%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-blue-600">
                    ₹{grandTotal}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
