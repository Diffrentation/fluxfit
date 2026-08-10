"use client";
import React from "react";
import { motion } from "framer-motion";
import { IconCreditCard, IconCash, IconCheck } from "@tabler/icons-react";

// Cash on Delivery is the only active payment method right now — see
// src/app/api/orders/route.js's ACTIVE_PAYMENT_METHODS for the server-side
// enforcement of the same restriction. Razorpay integration (create-intent /
// verify / webhook) already exists in src/lib/razorpay.js and
// src/app/api/payments/* and is ready to be added back here as a second
// entry in PAYMENT_METHODS once it's wired up and verified end-to-end.
const PAYMENT_METHODS = [
  {
    id: "cod",
    name: "Cash on Delivery",
    icon: <IconCash className="w-6 h-6" />,
    description: "Pay when you receive your order",
  },
];

const PaymentStep = ({ onPaymentSelect, amount }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <IconCreditCard className="w-6 h-6 text-[#1e9a58]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Method</h2>
        </div>
        <p className="text-sm sm:text-base text-gray-500 font-medium ml-13">
          Card and online payments are coming soon — Cash on Delivery is available now.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {PAYMENT_METHODS.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="w-full p-4 border-2 rounded-2xl border-[#1e9a58] bg-green-50/50"
          >
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <div className="p-2.5 rounded-xl shrink-0 bg-[#1e9a58] text-white shadow-sm">
                  <div className="w-5 h-5 sm:w-6 sm:h-6">{method.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">{method.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
              <IconCheck className="w-6 h-6 shrink-0 text-[#1e9a58]" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 bg-green-50 border-green-200 rounded-2xl border p-6 text-center">
        <IconCash className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3" />
        <p className="text-sm sm:text-base text-gray-700 font-medium mb-2">Cash on Delivery Selected</p>
        <p className="text-xs sm:text-sm text-gray-600">Pay ₹{amount} when you receive your order</p>
        <button
          type="button"
          className="w-full py-3.5 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-md mt-4"
          onClick={() => onPaymentSelect("cod", {})}
        >
          Confirm COD
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;
