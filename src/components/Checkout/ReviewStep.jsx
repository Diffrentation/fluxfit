"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { productDatabase } from "@/lib/productDatabase";
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
  const { cartItems, clearCart } = useCart();
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

    setIsPlacingOrder(true);

    // Simulate order placement
    setTimeout(() => {
      const orderId = `ORD-${Date.now()}`;
      const order = {
        orderId,
        items: cartItems,
        address,
        paymentMethod,
        paymentDetails,
        orderSummary,
        orderDate: new Date().toISOString(),
        status: "confirmed",
        statusHistory: [
          {
            status: "confirmed",
            timestamp: new Date().toISOString(),
          },
        ],
      };

      // Save order to localStorage (dummy)
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.push(order);
      localStorage.setItem("orders", JSON.stringify(orders));

      // Clear cart
      clearCart();

      setIsPlacingOrder(false);
      onOrderPlace(order);
    }, 2000);
  };

  if (!address || !paymentMethod) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-center">
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">Please complete previous steps</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Order Items */}
      <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Order Items</h2>
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
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {item.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {item.size && item.size !== "One Size" && (
                      <span>Size: {item.size}</span>
                    )}
                    {item.color && (
                      <span className="capitalize">Color: {item.color}</span>
                    )}
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    ₹{formatPrice(itemTotal)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Delivery Address */}
      <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <IconMapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Delivery Address</h2>
        </div>
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">{address.name}</p>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1">{address.phone}</p>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            {address.addressLine1}, {address.addressLine2}
          </p>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            {address.city}, {address.state} - {address.pincode}
          </p>
          {address.landmark && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Landmark: {address.landmark}
            </p>
          )}
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <IconCreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Payment Method</h2>
        </div>
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
            {getPaymentMethodName(paymentMethod)}
          </p>
          {paymentMethod === "card" && paymentDetails.cardDetails && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Card ending in {paymentDetails.cardDetails.cardNumber.slice(-4)}
            </p>
          )}
          {paymentMethod === "upi" && paymentDetails.upiId && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{paymentDetails.upiId}</p>
          )}
          {paymentMethod === "netbanking" && paymentDetails.bank && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{paymentDetails.bank}</p>
          )}
        </div>
      </Card>

      {/* Order Summary */}
      <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Order Summary</h2>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between text-sm sm:text-base text-gray-700 dark:text-gray-300">
            <span>Subtotal ({cartItems.length} items)</span>
            <span>₹{formatPrice(orderSummary.subtotal)}</span>
          </div>
          {orderSummary.discount > 0 && (
            <div className="flex justify-between text-sm sm:text-base text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span>-₹{formatPrice(orderSummary.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base text-gray-700 dark:text-gray-300">
            <span>Shipping</span>
            <span>₹{orderSummary.shipping}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base text-gray-700 dark:text-gray-300">
            <span>Tax (GST 18%)</span>
            <span>₹{formatPrice(orderSummary.tax)}</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 sm:pt-3 flex justify-between">
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Total</span>
            <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
              ₹{formatPrice(orderSummary.grandTotal)}
            </span>
          </div>
        </div>
      </Card>

      {/* Terms and Conditions */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <Checkbox
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          className="w-full"
        >
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            I agree to the{" "}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </span>
        </Checkbox>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button
          size="large"
          icon={<IconArrowLeft className="w-4 h-4" />}
          onClick={onBack}
          className="flex-1"
        >
          Back to Payment
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<IconLock className="w-4 h-4" />}
          onClick={handlePlaceOrder}
          loading={isPlacingOrder}
          disabled={!agreeToTerms}
          className="flex-1"
        >
          {isPlacingOrder ? "Placing Order..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
