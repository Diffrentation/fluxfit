// Utility functions for managing recently viewed products
const STORAGE_KEY = "fluxfit_recently_viewed";
const MAX_ITEMS = 8; // Maximum number of recently viewed products to store

/**
 * Get recently viewed products from localStorage
 * @returns {Array} Array of product IDs in order of most recently viewed
 */
export const getRecentlyViewed = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading recently viewed products:", error);
    return [];
  }
};

/**
 * Add a product to recently viewed
 * @param {number} productId - The ID of the product to add
 */
export const addToRecentlyViewed = (productId) => {
  if (typeof window === "undefined") return;

  try {
    let recent = getRecentlyViewed();

    // Remove the product if it already exists (to avoid duplicates)
    recent = recent.filter((id) => id !== productId);

    // Add to the beginning
    recent.unshift(productId);

    // Limit to MAX_ITEMS
    recent = recent.slice(0, MAX_ITEMS);

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error("Error saving recently viewed product:", error);
  }
};

/**
 * Clear all recently viewed products
 */
export const clearRecentlyViewed = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing recently viewed products:", error);
  }
};

/**
 * Get recently viewed products with full product data
 * @param {Object} productDatabase - The product database object
 * @returns {Array} Array of product objects
 */
export const getRecentlyViewedProducts = (productDatabase) => {
  const recentIds = getRecentlyViewed();

  return recentIds
    .map((id) => {
      const product = productDatabase[id];
      if (!product) return null;

      // Return product with image from images array if available
      return {
        ...product,
        image: product.images?.[0] || product.image || "",
      };
    })
    .filter((product) => product !== null);
};
