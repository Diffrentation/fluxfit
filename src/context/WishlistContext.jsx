"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { blockAdminAction } from "@/lib/adminBlocker";
import { useAuth } from "@/context/AuthContext";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

function getWishlistAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Flattens the server's { id, product: {...}, addedAt } shape into the flat
// item shape the wishlist UI (ProductCard, WishlistPreview, /wishlist page)
// already expects, keyed by product id (matching the old localStorage shape)
// so those components didn't need to change.
function mapServerWishlistItem(item) {
  const p = item.product || {};
  return {
    id: p.id,
    wishlistItemId: item.id,
    slug: p.slug,
    name: p.name,
    price: p.basePrice,
    image: p.image,
    originalPrice: p.originalPrice,
    discount: p.discount,
    inStock: p.inStock,
    stock: p.stock,
    // Carried through so "Add to Cart" from a wishlist listing (no
    // size/color picker shown there) can pick a real variant instead of
    // sending a guessed "One Size"/"default" that may not exist on the
    // product and would silently fail to sync to the server cart.
    variants: p.variants || [],
  };
}

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [savedForLaterItems, setSavedForLaterItems] = useState([]);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // "Saved for later" is a cart-side holding bucket with no corresponding
  // backend model (unlike wishlist, which has a real Wishlist collection) —
  // it stays local, which is fine since it isn't meant to sync across devices.
  useEffect(() => {
    const savedForLater = localStorage.getItem("savedForLater");
    if (savedForLater) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavedForLaterItems(JSON.parse(savedForLater));
      } catch (error) {
        console.error(
          "Error loading saved for later from localStorage:",
          error
        );
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("savedForLater", JSON.stringify(savedForLaterItems));
  }, [savedForLaterItems]);

  // Wishlist is server-backed per authenticated user via /api/wishlist*.
  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWishlistItems([]);
      return;
    }
    let cancelled = false;
    axios
      .get("/api/wishlist", { headers: getWishlistAuthHeaders() })
      .then(({ data }) => {
        if (cancelled || !data?.success) return;
        setWishlistItems(
          (data.data.wishlist.items || []).map(mapServerWishlistItem)
        );
      })
      .catch((err) => {
        console.warn(
          "[wishlist] Failed to load wishlist:",
          err?.response?.data?.message || err.message
        );
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const addToWishlist = (product) => {
    if (blockAdminAction()) return false;
    const productId = product?.id ?? product?._id;
    if (!productId) return false;

    if (!isAuthenticated) {
      toast.error("Please log in to add items to your wishlist");
      router.push("/auth/login");
      return false;
    }

    if (wishlistItems.some((item) => item.id === productId)) {
      return true;
    }

    // Optimistic add — the heart fills immediately; rolled back below if the
    // server rejects it (e.g. product no longer exists).
    setWishlistItems((prev) => [
      ...prev,
      {
        id: productId,
        wishlistItemId: null,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image || product.images?.[0],
        originalPrice: product.originalPrice,
        discount: product.discount,
        variants: product.variants || [],
      },
    ]);

    axios
      .post(
        "/api/wishlist/items",
        { productId },
        { headers: getWishlistAuthHeaders() }
      )
      .then(({ data }) => {
        if (!data?.success) {
          throw new Error(data?.message || "Failed to add to wishlist");
        }
        setWishlistItems((prev) =>
          prev.map((item) =>
            item.id === productId
              ? { ...item, wishlistItemId: data.data.item.id }
              : item
          )
        );
      })
      .catch((err) => {
        setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
        toast.error(
          err?.response?.data?.message ||
            err.message ||
            "Failed to add to wishlist"
        );
      });

    return true;
  };

  const removeFromWishlist = (itemId) => {
    if (blockAdminAction()) return;
    const target = wishlistItems.find((item) => item.id === itemId);
    setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));

    if (isAuthenticated && target?.wishlistItemId) {
      axios
        .delete(`/api/wishlist/items/${target.wishlistItemId}`, {
          headers: getWishlistAuthHeaders(),
        })
        .catch((err) => {
          console.warn(
            "[wishlist] Failed to remove item on server:",
            err?.response?.data?.message || err.message
          );
        });
    }
  };

  const isInWishlist = (itemId) => {
    return wishlistItems.some((item) => item.id === itemId);
  };

  const addToSavedForLater = (item) => {
    if (blockAdminAction()) return false;
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
    return true;
  };

  const removeFromSavedForLater = (itemId, size, color) => {
    if (blockAdminAction()) return;
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
