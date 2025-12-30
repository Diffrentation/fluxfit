"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [savedForLaterItems, setSavedForLaterItems] = useState([]);

  // Load wishlist and saved items from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    const savedForLater = localStorage.getItem("savedForLater");

    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error("Error loading wishlist from localStorage:", error);
      }
    }

    if (savedForLater) {
      try {
        setSavedForLaterItems(JSON.parse(savedForLater));
      } catch (error) {
        console.error(
          "Error loading saved for later from localStorage:",
          error
        );
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Save savedForLater to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("savedForLater", JSON.stringify(savedForLaterItems));
  }, [savedForLaterItems]);

  const addToWishlist = (product) => {
    setWishlistItems((prevItems) => {
      // Check if item already exists
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems; // Already in wishlist
      }
      return [
        ...prevItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image || product.images?.[0],
          originalPrice: product.originalPrice,
          discount: product.discount,
        },
      ];
    });
  };

  const removeFromWishlist = (itemId) => {
    setWishlistItems((prevItems) =>
      prevItems.filter((item) => item.id !== itemId)
    );
  };

  const isInWishlist = (itemId) => {
    return wishlistItems.some((item) => item.id === itemId);
  };

  const addToSavedForLater = (item) => {
    setSavedForLaterItems((prevItems) => {
      // Check if item already exists
      const existingItem = prevItems.find(
        (i) =>
          i.id === item.id && i.size === item.size && i.color === item.color
      );
      if (existingItem) {
        return prevItems; // Already saved
      }
      return [...prevItems, { ...item, savedAt: new Date().toISOString() }];
    });
  };

  const removeFromSavedForLater = (itemId, size, color) => {
    setSavedForLaterItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(item.id === itemId && item.size === size && item.color === color)
      )
    );
  };

  const moveToCart = (item) => {
    // This will be handled by CartContext
    removeFromSavedForLater(item.id, item.size, item.color);
    return item;
  };

  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  const getSavedForLaterCount = () => {
    return savedForLaterItems.length;
  };

  const value = {
    wishlistItems,
    savedForLaterItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    addToSavedForLater,
    removeFromSavedForLater,
    moveToCart,
    getWishlistCount,
    getSavedForLaterCount,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
