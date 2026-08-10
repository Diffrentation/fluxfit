// Single source of truth for which payment methods are actually accepted.
// Only COD is active — Razorpay integration (create-intent / verify /
// webhook in src/app/api/payments/*, src/lib/razorpay.js) already exists
// but is intentionally not wired into checkout yet. To activate it later,
// add "razorpay" here and to the `methods` list below — both
// src/app/api/orders/route.js (server-side validation) and
// src/app/api/payments/methods/route.js (what the UI is told is available)
// read from this file, so nothing else needs to change.
export const ACTIVE_PAYMENT_METHODS = ["cod"];

export const PAYMENT_METHOD_CATALOG = [
  {
    id: "razorpay",
    name: "Razorpay",
    displayName: "Credit/Debit Card, UPI, Net Banking",
    type: "gateway",
    methods: ["card", "upi", "netbanking", "wallet"],
    currencies: ["INR"],
    icon: "💳",
    description: "Secure payment via Razorpay",
    minAmount: 1,
    maxAmount: null,
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    displayName: "Cash on Delivery",
    type: "cod",
    methods: ["cod"],
    currencies: ["INR"],
    icon: "💰",
    description: "Pay when you receive your order",
    minAmount: 0,
    maxAmount: 5000,
  },
];
