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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-gray-600 mb-4">Please complete previous steps</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-4">
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
                className="flex gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="relative w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={item.image || product?.images?.[0] || ""}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    {item.size && item.size !== "One Size" && (
                      <span>Size: {item.size}</span>
                    )}
                    {item.color && (
                      <span className="capitalize">Color: {item.color}</span>
                    )}
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{formatPrice(itemTotal)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Delivery Address */}
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <IconMapPin className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-semibold text-gray-900 mb-1">{address.name}</p>
          <p className="text-gray-700 text-sm mb-1">{address.phone}</p>
          <p className="text-gray-700 text-sm">
            {address.addressLine1}, {address.addressLine2}
          </p>
          <p className="text-gray-700 text-sm">
            {address.city}, {address.state} - {address.pincode}
          </p>
          {address.landmark && (
            <p className="text-gray-600 text-xs mt-1">
              Landmark: {address.landmark}
            </p>
          )}
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <IconCreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-semibold text-gray-900 mb-1">
            {getPaymentMethodName(paymentMethod)}
          </p>
          {paymentMethod === "card" && paymentDetails.cardDetails && (
            <p className="text-gray-600 text-sm">
              Card ending in {paymentDetails.cardDetails.cardNumber.slice(-4)}
            </p>
          )}
          {paymentMethod === "upi" && paymentDetails.upiId && (
            <p className="text-gray-600 text-sm">{paymentDetails.upiId}</p>
          )}
          {paymentMethod === "netbanking" && paymentDetails.bank && (
            <p className="text-gray-600 text-sm">{paymentDetails.bank}</p>
          )}
        </div>
      </Card>

      {/* Order Summary */}
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal ({cartItems.length} items)</span>
            <span>₹{formatPrice(orderSummary.subtotal)}</span>
          </div>
          {orderSummary.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₹{formatPrice(orderSummary.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>Shipping</span>
            <span>₹{orderSummary.shipping}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax (GST 18%)</span>
            <span>₹{formatPrice(orderSummary.tax)}</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-blue-600">
              ₹{formatPrice(orderSummary.grandTotal)}
            </span>
          </div>
        </div>
      </Card>

      {/* Terms and Conditions */}
      <Card className="bg-blue-50 border-blue-200">
        <Checkbox
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          className="w-full"
        >
          <span className="text-sm text-gray-700">
            I agree to the{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </span>
        </Checkbox>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
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
