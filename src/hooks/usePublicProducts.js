"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import {
  buildPublicProductsQuery,
  normalizeProductForCard,
} from "@/lib/publicProductsApi";

/**
 * Fetches catalog products from GET /api/products with stable request cancellation.
 * Params are derived with useMemo so we do not recreate objects unnecessarily.
 */
export function usePublicProducts({
  page = 1,
  limit = 24,
  categoryLabel,
  debouncedSearch = "",
  sortBy,
  priceFilter,
  colorFilter,
  selectedTags,
}) {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const queryParams = useMemo(
    () =>
      buildPublicProductsQuery({
        page,
        limit,
        categoryLabel,
        search: debouncedSearch,
        sortBy,
        priceFilter,
        color: colorFilter,
        tags: selectedTags,
      }),
    [
      page,
      limit,
      categoryLabel,
      debouncedSearch,
      sortBy,
      priceFilter,
      colorFilter,
      selectedTags,
    ]
  );

  const fetchProducts = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/products", {
        params: queryParams,
        signal,
      });
      if (!data?.success) {
        throw new Error(data?.message || "Failed to load products");
      }
      const raw = data.data.products || [];
      setProducts(
        raw.map(normalizeProductForCard).filter(Boolean)
      );
      setPagination(data.data.pagination || null);
    } catch (e) {
      if (axios.isCancel?.(e) || e.name === "CanceledError" || e.code === "ERR_CANCELED") {
        return;
      }
      console.error("usePublicProducts:", e);
      setError(e);
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchProducts();
    return () => abortRef.current?.abort();
  }, [fetchProducts]);

  return { products, pagination, loading, error, refetch: fetchProducts };
}
