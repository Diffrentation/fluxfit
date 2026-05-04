"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CustomDesignContext = createContext(null);
const STORAGE_KEY = "customDesignSelection";

const EMPTY_SELECTION = null;

export const useCustomDesign = () => {
  const context = useContext(CustomDesignContext);
  if (!context) {
    throw new Error("useCustomDesign must be used within a CustomDesignProvider");
  }
  return context;
};

export const CustomDesignProvider = ({ children }) => {
  const [selection, setSelection] = useState(EMPTY_SELECTION);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        setSelection(parsed);
      }
    } catch (error) {
      console.error("Error loading custom design selection:", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (!selection) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch (error) {
      console.error("Error saving custom design selection:", error);
    }
  }, [selection]);

  const setCustomDesignSelection = (payload) => {
    if (!payload || typeof payload !== "object") return;

    const normalizedColors = Array.isArray(payload.colors)
      ? payload.colors.map((c) => String(c).toLowerCase())
      : [];

    const normalized = {
      productId: payload.productId,
      name: payload.name || "Custom Product",
      images: Array.isArray(payload.images) ? payload.images.filter(Boolean) : [],
      colorImageMap: payload.colorImageMap && typeof payload.colorImageMap === "object"
        ? payload.colorImageMap
        : {},
      colors: normalizedColors,
      selectedColor:
        String(payload.selectedColor || normalizedColors[0] || "").toLowerCase(),
      selectedImage: payload.selectedImage || payload.images?.[0] || "",
      sourceRoute: payload.sourceRoute || "",
    };

    setSelection(normalized);
  };

  const setCustomDesignColor = (color) => {
    setSelection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedColor: String(color || "").toLowerCase(),
      };
    });
  };

  const clearCustomDesignSelection = () => {
    setSelection(EMPTY_SELECTION);
  };

  const value = useMemo(
    () => ({
      selection,
      setCustomDesignSelection,
      setCustomDesignColor,
      clearCustomDesignSelection,
    }),
    [selection]
  );

  return (
    <CustomDesignContext.Provider value={value}>
      {children}
    </CustomDesignContext.Provider>
  );
};
