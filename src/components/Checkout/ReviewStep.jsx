"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { productDatabase } from "@/lib/productDatabase";
import {
  syncLocalCartToServer,
  createOrderFromServerCart,
  isLoggedInForCheckout,
} from "@/lib/checkout-order";
import { mapApiOrderToLegacyUi } from "@/lib/order-display";
import {
  IconArrowLeft,
  IconCheck,
  IconMapPin,
  IconCreditCard,
  IconFileText,
  IconLock,
} from "@tabler/icons-react";
import { Button, Card, message, Checkbox } from "antd";
import Image from "next/image";

const ReviewStep = ({
  address,
  paymentMethod,
  paymentDetails,
  onOrderPlace,
  onBack,
  orderSummary,
}) => {
  const router = useRouter();
  const { cartItems, clearCart, appliedCoupon } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Format price helper - prices are already in INR
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getProductDetails = (item) => {
    return productDatabase[item.id] || null;
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      cod: "Cash on Delivery",
      card: "Credit/Debit Card",
      upi: "UPI",
      netbanking: "Net Banking",
      razorpay: "Razorpay",
      stripe: "Stripe",
      paypal: "PayPal",
    };
    return methods[method] || method;
  };

  const handlePlaceOrder = async () => {
    if (!agreeToTerms) {
      message.warning("Please agree to the terms and conditions");
      return;
    }

    if (!isLoggedInForCheckout()) {
      message.warning("Please sign in to place your order");
      router.push("/auth/login?returnUrl=/checkout");
      return;
    }

    const shippingAddressId = address?.id || address?._id;
    if (!shippingAddressId) {
      message.error("Selected address is missing an ID. Save the address again or pick another.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      await syncLocalCartToServer(cartItems, appliedCoupon);

      const apiOrder = await createOrderFromServerCart({
        shippingAddressId: String(shippingAddressId),
        paymentMethod,
        shippingCost: Number(orderSummary?.shipping) || 0,
        shippingMethod: "standard",
        clearCart: true,
      });

      clearCart();
      const orderUi = {
        ...mapApiOrderToLegacyUi(apiOrder),
        paymentDetails: paymentDetails || {},
      };
      onOrderPlace(orderUi);
    } catch (err) {
      console.error("Place order error:", err);
      const res = err.response?.data;
      const first =
        res?.errors?.[0]?.message || res?.message || err.message;
      message.error(first || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!address || !paymentMethod) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center">
        <p className="text-sm sm:text-base text-gray-500 font-medium mb-4">Please complete previous steps</p>
        <button onClick={onBack} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Order Items */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-3 sm:space-y-4">
          {cartItems.map((item, index) => {
            const product = getProductDetails(item);
            const itemPrice = parseFloat(item.price);
            const itemTotal = itemPrice * item.quantity;

            return (
              <motion.div
                key={`${item.id}-${item.size}-${item.color}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
                  <Image
                    src={item.image || product?.images?.[0] || ""}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                    {item.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-2">
                    {item.size && item.size !== "One Size" && (
                      <span>Size: {item.size}</span>
                    )}
                    {item.color && (
                      <span className="capitalize">Color: {item.color}</span>
                    )}
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-[#1e9a58]">
                    ₹{formatPrice(itemTotal)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <IconMapPin className="w-6 h-6 text-[#1e9a58]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Delivery Address</h2>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{address.name}</p>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">{address.phone}</p>
          <p className="text-xs sm:text-sm text-gray-600">
            {address.addressLine1}, {address.addressLine2}
          </p>
          <p className="text-xs sm:text-sm text-gray-600">
            {address.city}, {address.state} - {address.pincode}
          </p>
          {address.landmark && (
            <p className="text-xs text-gray-500 mt-1">
              Landmark: {address.landmark}
            </p>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <IconCreditCard className="w-6 h-6 text-[#1e9a58]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Payment Method</h2>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
            {getPaymentMethodName(paymentMethod)}
          </p>
          {paymentMethod === "card" && paymentDetails.cardDetails && (
            <p className="text-xs sm:text-sm text-gray-600">
              Card ending in {paymentDetails.cardDetails.cardNumber.slice(-4)}
            </p>
          )}
          {paymentMethod === "upi" && paymentDetails.upiId && (
            <p className="text-xs sm:text-sm text-gray-600">{paymentDetails.upiId}</p>
          )}
          {paymentMethod === "netbanking" && paymentDetails.bank && (
            <p className="text-xs sm:text-sm text-gray-600">{paymentDetails.bank}</p>
          )}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-[#f4fbf7] border border-green-100 rounded-2xl p-4">
        <Checkbox
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          className="w-full"
        >
          <span className="text-xs sm:text-sm text-gray-700">
            I agree to the{" "}
            <a href="#" className="text-[#1e9a58] hover:text-green-700 hover:underline">
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#1e9a58] hover:text-green-700 hover:underline">
              Privacy Policy
            </a>
          </span>
        </Checkbox>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
        <button
          onClick={handlePlaceOrder}
          disabled={!agreeToTerms || isPlacingOrder}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
        >
          <IconLock className="w-5 h-5" />
          {isPlacingOrder ? "Placing Order..." : "Place Order"}
        </button>
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-base transition-colors order-2 sm:order-1"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Payment
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;
