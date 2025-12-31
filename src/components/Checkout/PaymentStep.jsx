"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCreditCard,
  IconWallet,
  IconBuildingBank,
  IconCash,
  IconCheck,
  IconLock,
  IconBrandVisa,
  IconBrandMastercard,
  IconBrandPaypal,
} from "@tabler/icons-react";
import { Button, Radio, Input, Form, message, Card, Divider } from "antd";

const PaymentStep = ({ onPaymentSelect, selectedMethod, paymentDetails, amount }) => {
  const [form] = Form.useForm();
  const [selectedPaymentType, setSelectedPaymentType] = useState(selectedMethod || null);
  const [cardDetails, setCardDetails] = useState(paymentDetails.cardDetails || {});
  const [upiId, setUpiId] = useState(paymentDetails.upiId || "");
  const [netBankingBank, setNetBankingBank] = useState(paymentDetails.bank || "");

  const paymentMethods = [
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: <IconCash className="w-6 h-6" />,
      description: "Pay when you receive your order",
      color: "green",
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <IconCreditCard className="w-6 h-6" />,
      description: "Visa, Mastercard, RuPay",
      color: "blue",
    },
    {
      id: "upi",
      name: "UPI",
      icon: <IconWallet className="w-6 h-6" />,
      description: "Google Pay, PhonePe, Paytm, BHIM",
      color: "purple",
    },
    {
      id: "netbanking",
      name: "Net Banking",
      icon: <IconBuildingBank className="w-6 h-6" />,
      description: "All major banks",
      color: "orange",
    },
    {
      id: "razorpay",
      name: "Razorpay",
      icon: <IconLock className="w-6 h-6" />,
      description: "Secure payment gateway",
      color: "indigo",
    },
    {
      id: "stripe",
      name: "Stripe",
      icon: <IconLock className="w-6 h-6" />,
      description: "International payments",
      color: "blue",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: <IconBrandPaypal className="w-6 h-6" />,
      description: "Pay with PayPal account",
      color: "blue",
    },
  ];

  const banks = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
  ];

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentType(methodId);
    form.resetFields();
    setCardDetails({});
    setUpiId("");
    setNetBankingBank("");
  };

  const handleCardSubmit = (values) => {
    const cardDetails = {
      cardNumber: values.cardNumber.replace(/\s/g, ""),
      cardName: values.cardName,
      expiryMonth: values.expiryMonth,
      expiryYear: values.expiryYear,
      cvv: values.cvv,
    };
    setCardDetails(cardDetails);
    onPaymentSelect("card", { cardDetails });
    message.success("Card details saved");
  };

  const handleUpiSubmit = () => {
    if (!upiId.trim()) {
      message.error("Please enter UPI ID");
      return;
    }
    if (!/^[\w.-]+@[\w]+$/.test(upiId)) {
      message.error("Invalid UPI ID format. Use format: yourname@paytm");
      return;
    }
    onPaymentSelect("upi", { upiId: upiId.trim() });
    message.success("UPI payment method selected");
  };

  const handleNetBankingSubmit = () => {
    if (!netBankingBank) {
      message.error("Please select a bank");
      return;
    }
    onPaymentSelect("netbanking", { bank: netBankingBank });
    message.success("Net Banking selected");
  };

  const handleGatewayPayment = (gateway) => {
    // Simulate payment gateway redirect
    message.loading(`Redirecting to ${gateway}...`, 2);
    setTimeout(() => {
      onPaymentSelect(gateway, { gateway, amount });
      message.success(`${gateway} payment method selected`);
    }, 2000);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Method</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Select your preferred payment method</p>
      </div>

      <Radio.Group
        value={selectedPaymentType}
        onChange={(e) => handlePaymentMethodSelect(e.target.value)}
        className="w-full"
      >
        <div className="space-y-3 sm:space-y-4">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Radio value={method.id} className="w-full">
                <div
                  className={`w-full p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentType === method.id
                      ? method.color === "green"
                        ? "border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20"
                        : method.color === "blue"
                        ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : method.color === "purple"
                        ? "border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : method.color === "orange"
                        ? "border-orange-600 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : method.color === "indigo"
                        ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div
                        className={`p-2 sm:p-3 rounded-lg shrink-0 ${
                          selectedPaymentType === method.id
                            ? method.color === "green"
                              ? "bg-green-600 dark:bg-green-500 text-white"
                              : method.color === "blue"
                              ? "bg-blue-600 dark:bg-blue-500 text-white"
                              : method.color === "purple"
                              ? "bg-purple-600 dark:bg-purple-500 text-white"
                              : method.color === "orange"
                              ? "bg-orange-600 dark:bg-orange-500 text-white"
                              : method.color === "indigo"
                              ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                              : "bg-blue-600 dark:bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6">{method.icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{method.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{method.description}</p>
                      </div>
                    </div>
                    {selectedPaymentType === method.id && (
                      <IconCheck
                        className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${
                          method.color === "green"
                            ? "text-green-600 dark:text-green-400"
                            : method.color === "blue"
                            ? "text-blue-600 dark:text-blue-400"
                            : method.color === "purple"
                            ? "text-purple-600 dark:text-purple-400"
                            : method.color === "orange"
                            ? "text-orange-600 dark:text-orange-400"
                            : method.color === "indigo"
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      />
                    )}
                  </div>
                </div>
              </Radio>
            </motion.div>
          ))}
        </div>
      </Radio.Group>

      {/* Payment Details Forms */}
      <AnimatePresence mode="wait">
        {selectedPaymentType === "card" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <Card className="bg-gray-50 dark:bg-gray-700/50">
              <Form form={form} layout="vertical" onFinish={handleCardSubmit}>
                <Form.Item
                  name="cardNumber"
                  label="Card Number"
                  rules={[
                    { required: true, message: "Please enter card number" },
                    { pattern: /^[\d\s]{13,19}$/, message: "Invalid card number" }
                  ]}
                >
                  <Input
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      form.setFieldsValue({ cardNumber: formatted });
                    }}
                    prefix={<IconCreditCard className="w-4 h-4 text-gray-400" />}
                  />
                </Form.Item>

                <Form.Item
                  name="cardName"
                  label="Cardholder Name"
                  rules={[{ required: true, message: "Please enter cardholder name" }]}
                >
                  <Input placeholder="John Doe" />
                </Form.Item>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Form.Item
                    name="expiryMonth"
                    label="Month"
                    rules={[{ required: true, message: "MM" }]}
                  >
                    <Input placeholder="MM" maxLength={2} />
                  </Form.Item>

                  <Form.Item
                    name="expiryYear"
                    label="Year"
                    rules={[{ required: true, message: "YYYY" }]}
                  >
                    <Input placeholder="YYYY" maxLength={4} />
                  </Form.Item>

                  <Form.Item
                    name="cvv"
                    label="CVV"
                    rules={[
                      { required: true, message: "CVV" },
                      { pattern: /^[0-9]{3,4}$/, message: "Invalid CVV" }
                    ]}
                  >
                    <Input placeholder="123" type="password" maxLength={4} />
                  </Form.Item>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <IconBrandVisa className="w-8 h-8 text-blue-600" />
                  <IconBrandMastercard className="w-8 h-8 text-red-600" />
                  <IconLock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    Your payment information is secure and encrypted
                  </span>
                </div>

                <Button type="primary" htmlType="submit" block size="large">
                  Save Card Details
                </Button>
              </Form>
            </Card>
          </motion.div>
        )}

        {selectedPaymentType === "upi" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <Card className="bg-gray-50 dark:bg-gray-700/50">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  UPI ID
                </label>
                <Input
                  placeholder="yourname@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  size="large"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe)
                </p>
              </div>
              <Button
                type="primary"
                block
                size="large"
                onClick={handleUpiSubmit}
                disabled={!upiId.trim()}
              >
                Verify & Continue
              </Button>
            </Card>
          </motion.div>
        )}

        {selectedPaymentType === "netbanking" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <Card className="bg-gray-50 dark:bg-gray-700/50">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Bank
                </label>
                <select
                  value={netBankingBank}
                  onChange={(e) => setNetBankingBank(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select your bank</option>
                  {banks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="primary"
                block
                size="large"
                onClick={handleNetBankingSubmit}
                disabled={!netBankingBank}
              >
                Continue to Bank
              </Button>
            </Card>
          </motion.div>
        )}

        {["razorpay", "stripe", "paypal"].includes(selectedPaymentType) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <Card className="bg-gray-50 dark:bg-gray-700/50">
              <div className="text-center mb-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                  You will be redirected to {paymentMethods.find(m => m.id === selectedPaymentType)?.name} for secure payment
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Amount to pay: <span className="font-bold">₹{amount}</span>
                </p>
              </div>
              <Button
                type="primary"
                block
                size="large"
                onClick={() => handleGatewayPayment(selectedPaymentType)}
              >
                Continue to {paymentMethods.find(m => m.id === selectedPaymentType)?.name}
              </Button>
            </Card>
          </motion.div>
        )}

        {selectedPaymentType === "cod" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="text-center">
                <IconCash className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Cash on Delivery Selected
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Pay ₹{amount} when you receive your order
                </p>
                <Button
                  type="primary"
                  className="mt-4"
                  onClick={() => onPaymentSelect("cod", {})}
                >
                  Confirm COD
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentStep;

