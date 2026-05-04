"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CustomDesignContext = createContext(null);
const STORAGE_KEY = "customDesignSelection";
const FLOW_STORAGE_KEY = "customClothesFlowSelection";

const EMPTY_SELECTION = null;
const EMPTY_FLOW = {
  category: null,
  subcategory: null,
  product: null,
};

export const useCustomDesign = () => {
  const context = useContext(CustomDesignContext);
  if (!context) {
    throw new Error("useCustomDesign must be used within a CustomDesignProvider");
  }
  return context;
};

export const CustomDesignProvider = ({ children }) => {
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [flowSelection, setFlowSelection] = useState(EMPTY_FLOW);

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
      const savedFlow = localStorage.getItem(FLOW_STORAGE_KEY);
      if (!savedFlow) return;
      const parsedFlow = JSON.parse(savedFlow);
      if (parsedFlow && typeof parsedFlow === "object") {
        setFlowSelection({
          category: parsedFlow.category || null,
          subcategory: parsedFlow.subcategory || null,
          product: parsedFlow.product || null,
        });
      }
    } catch (error) {
      console.error("Error loading custom clothes flow selection:", error);
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

  useEffect(() => {
    try {
      const hasFlowState =
        Boolean(flowSelection?.category) ||
        Boolean(flowSelection?.subcategory) ||
        Boolean(flowSelection?.product);

      if (!hasFlowState) {
        localStorage.removeItem(FLOW_STORAGE_KEY);
        return;
      }

      localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flowSelection));
    } catch (error) {
      console.error("Error saving custom clothes flow selection:", error);
    }
  }, [flowSelection]);

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

  const updateFlowSelection = useCallback((patch) => {
    if (!patch || typeof patch !== "object") return;
    setFlowSelection((prev) => ({
      category:
        patch.category !== undefined ? patch.category : prev.category,
      subcategory:
        patch.subcategory !== undefined ? patch.subcategory : prev.subcategory,
      product: patch.product !== undefined ? patch.product : prev.product,
    }));
  }, []);

  const resetFlowSelection = useCallback(() => {
    setFlowSelection(EMPTY_FLOW);
  }, []);

  const value = useMemo(
    () => ({
      selection,
      flowSelection,
      setCustomDesignSelection,
      setCustomDesignColor,
      clearCustomDesignSelection,
      updateFlowSelection,
      resetFlowSelection,
    }),
    [selection, flowSelection, updateFlowSelection, resetFlowSelection]
  );

  return (
    <CustomDesignContext.Provider value={value}>
      {children}
    </CustomDesignContext.Provider>
  );
};
