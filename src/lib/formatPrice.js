/**
 * Format price in INR with proper formatting
 * @param {number|string} price - Price value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, decimals = 2) => {
  return parseFloat(price).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format price with currency symbol
 * @param {number|string} price - Price value
 * @param {string} currency - Currency symbol (default: "₹")
 * @returns {string} - Formatted price string with currency
 */
export const formatPriceWithCurrency = (price, currency = "₹") => {
  return `${currency}${formatPrice(price)}`;
};
