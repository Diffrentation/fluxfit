"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  addItemToServerCart,
  updateItemQuantityOnServerCart,
  removeItemFromServerCart,
  getCartAuthHeaders,
} from "@/lib/cart-api-client";
import { blockAdminAction } from "@/lib/adminBlocker";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();

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

  const _doAddToCart = useCallback((product, options = {}) => {
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
    return true;
  }, []);

  const addToCart = (product, options = {}) => {
    if (blockAdminAction()) return false;
    
    if (!isAuthenticated) {
      sessionStorage.setItem("pendingAddToCart", JSON.stringify({ product, options }));
      toast.error("Please log in to add items to your cart");
      router.push("/auth/login");
      return false;
    }

    return _doAddToCart(product, options);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const pendingCartItem = sessionStorage.getItem("pendingAddToCart");
      if (pendingCartItem) {
        try {
          const { product, options } = JSON.parse(pendingCartItem);
          _doAddToCart(product, options);
          toast.success("Product added to cart successfully.");
        } catch (error) {
          console.error("Failed to restore pending cart item:", error);
        } finally {
          sessionStorage.removeItem("pendingAddToCart");
        }
      }
    }
  }, [isAuthenticated, _doAddToCart]);

  const removeFromCart = (id, size, color, customization = null) => {
    if (blockAdminAction()) return;
    const cKey = customizationKey(customization);
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.id === id &&
            item.size === size &&
            item.color === color &&
            customizationKey(item.customization) === cKey
          )
      )
    );

    if (isAuthenticated) {
      removeItemFromServerCart(id, size, color).catch((err) => {
        console.warn(
          "[cart] Server cart remove failed (local cart still updated):",
          err?.response?.data?.message || err?.message || err,
        );
      });
    }
  };

  const updateQuantity = (id, size, color, customization, newQuantity) => {
    if (blockAdminAction()) return;
    if (newQuantity < 1) {
      removeFromCart(id, size, color, customization);
      return;
    }

    const cKey = customizationKey(customization);
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id &&
        item.size === size &&
        item.color === color &&
        customizationKey(item.customization) === cKey
          ? { ...item, quantity: newQuantity }
          : item
      )
    );

    if (isAuthenticated) {
      updateItemQuantityOnServerCart(id, size, color, newQuantity).catch((err) => {
        console.warn(
          "[cart] Server cart quantity sync failed (local cart still updated):",
          err?.response?.data?.message || err?.message || err,
        );
      });
    }
  };

  const clearCart = () => {
    if (blockAdminAction()) return;
    setCartItems([]);
    setAppliedCoupon(null);
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

  const applyCoupon = async (couponCode) => {
    if (!isAuthenticated) {
      return { success: false, message: "Please log in to apply a coupon" };
    }
    if (cartItems.length === 0) {
      return { success: false, message: "Your cart is empty" };
    }

    try {
      // The coupon is validated against the real Coupon collection using the
      // *server* cart's items/subtotal, so push the current local cart to
      // the server first to guarantee they match (real-time add/qty/remove
      // sync keeps them close, but this removes any doubt).
      const { syncLocalCartToServer } = await import("@/lib/checkout-order");
      await syncLocalCartToServer(cartItems, null);

      const headers = getCartAuthHeaders();
      const { data } = await axios.post(
        "/api/cart/apply-coupon",
        { code: couponCode.trim() },
        { headers },
      );

      if (!data?.success) {
        return { success: false, message: data?.message || "Invalid coupon code" };
      }

      setAppliedCoupon({
        code: data.data.coupon.code,
        discount: data.data.coupon.discount,
        type: data.data.coupon.type,
      });

      return { success: true, message: data.message || "Coupon applied successfully!" };
    } catch (err) {
      return {
        success: false,
        message:
          err?.response?.data?.message || err.message || "Failed to apply coupon",
      };
    }
  };

  const removeCoupon = async () => {
    if (isAuthenticated) {
      try {
        await axios.delete("/api/cart/coupon", { headers: getCartAuthHeaders() });
      } catch (err) {
        console.warn(
          "[cart] Server coupon removal failed (local coupon still cleared):",
          err?.response?.data?.message || err?.message || err,
        );
      }
    }
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
