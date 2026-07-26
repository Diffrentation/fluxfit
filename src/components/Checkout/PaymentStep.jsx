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
  const [selectedPaymentType, setSelectedPaymentType] = useState(selectedMethod || "cod");
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
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <IconCreditCard className="w-6 h-6 text-[#1e9a58]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Method</h2>
        </div>
        <p className="text-sm sm:text-base text-gray-500 font-medium ml-13">Select your preferred payment method</p>
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
                  className={`w-full p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                    selectedPaymentType === method.id
                      ? "border-[#1e9a58] bg-green-50/50"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          selectedPaymentType === method.id
                            ? "bg-[#1e9a58] text-white shadow-sm"
                            : "bg-gray-100 text-gray-500"
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
                      <IconCheck className="w-6 h-6 shrink-0 text-[#1e9a58]" />
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

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md mt-4"
                >
                  Save Card Details
                </button>
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
              <button
                type="button"
                className="w-full py-3.5 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpiSubmit}
                disabled={!upiId.trim()}
              >
                Verify & Continue
              </button>
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
              <button
                type="button"
                className="w-full py-3.5 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleNetBankingSubmit}
                disabled={!netBankingBank}
              >
                Continue to Bank
              </button>
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
              <button
                type="button"
                className="w-full py-3.5 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md"
                onClick={() => handleGatewayPayment(selectedPaymentType)}
              >
                Continue to {paymentMethods.find(m => m.id === selectedPaymentType)?.name}
              </button>
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
                <button
                  type="button"
                  className="w-full py-3.5 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md mt-4"
                  onClick={() => onPaymentSelect("cod", {})}
                >
                  Confirm COD
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentStep;

