"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { addItemToServerCart } from "@/lib/cart-api-client";

const CartContext = createContext();

function customizationKey(c) {
  if (c == null) return "";
  try {
    return JSON.stringify(c);
  } catch {
    return "";
  }
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Load cart and coupon from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    const savedCoupon = localStorage.getItem("appliedCoupon");

    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }

    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch (error) {
        console.error("Error loading coupon from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Save coupon to localStorage whenever it changes
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("appliedCoupon");
    }
  }, [appliedCoupon]);

  const addToCart = (product, options = {}) => {
    const { size, color, quantity = 1, customization } = options;
    const productId = product?.id ?? product?._id;

    const cKey = customizationKey(customization);

    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.id === productId &&
          item.size === size &&
          item.color === color &&
          customizationKey(item.customization) === cKey,
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
        return updatedItems;
      }

      return [
        ...prevItems,
        {
          id: productId,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.image || product.images?.[0],
          size,
          color,
          quantity,
          ...(customization != null ? { customization } : {}),
        },
      ];
    });

    queueMicrotask(() => {
      addItemToServerCart(productId, {
        size,
        color,
        quantity,
        customization,
      }).catch((err) => {
        console.warn(
          "[cart] Server cart sync failed (local cart still updated):",
          err?.response?.data?.message || err?.message || err,
        );
      });
    });
  };

  const removeFromCart = (itemId, size, color, customization) => {
    const cKey = customizationKey(customization);
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.id === itemId &&
            item.size === size &&
            item.color === color &&
            customizationKey(item.customization) === cKey
          )
      )
    );
  };

  const updateQuantity = (itemId, size, color, newQuantity, customization) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, size, color, customization);
      return;
    }

    const cKey = customizationKey(customization);
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId &&
        item.size === size &&
        item.color === color &&
        customizationKey(item.customization) === cKey
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0
    );
  };

  const applyCoupon = (couponCode) => {
    // Sample coupon codes
    const coupons = {
      WELCOME10: {
        code: "WELCOME10",
        discount: 10,
        type: "percentage",
        minPurchase: 0,
      },
      SAVE20: {
        code: "SAVE20",
        discount: 20,
        type: "percentage",
        minPurchase: 100,
      },
      FLAT50: { code: "FLAT50", discount: 50, type: "fixed", minPurchase: 200 },
      SUMMER25: {
        code: "SUMMER25",
        discount: 25,
        type: "percentage",
        minPurchase: 50,
      },
    };

    const coupon = coupons[couponCode.toUpperCase()];
    if (!coupon) {
      return { success: false, message: "Invalid coupon code" };
    }

    const subtotal = getCartTotal();
    if (subtotal < coupon.minPurchase) {
      return {
        success: false,
        message: `Minimum purchase of ₹${coupon.minPurchase.toFixed(
          2
        )} required`,
      };
    }

    setAppliedCoupon(coupon);
    return { success: true, message: "Coupon applied successfully!" };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;

    const subtotal = getCartTotal();
    if (appliedCoupon.type === "percentage") {
      return (subtotal * appliedCoupon.discount) / 100;
    } else {
      return appliedCoupon.discount;
    }
  };

  const getFinalTotal = () => {
    const subtotal = getCartTotal();
    const discount = getDiscountAmount();
    return Math.max(0, subtotal - discount);
  };

  const value = {
    cartItems,
    appliedCoupon,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
