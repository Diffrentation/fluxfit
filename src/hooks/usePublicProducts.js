"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  buildPublicProductsQuery,
  normalizeProductForCard,
} from "@/lib/publicProductsApi";
import { publicApiUrl } from "@/lib/apiBaseUrl";

/**
 * Fetches catalog products from GET /api/products with stable request cancellation.
 * Params are derived with useMemo so we do not recreate objects unnecessarily.
 */
export function usePublicProducts({
  page = 1,
  limit = 24,
  category,
  categoryLabel,
  debouncedSearch = "",
  sortBy,
  priceFilter,
  minPrice,
  maxPrice,
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
        category,
        categoryLabel,
        search: debouncedSearch,
        sortBy,
        priceFilter,
        minPrice,
        maxPrice,
        color: colorFilter,
        tags: selectedTags,
      }),
    [
      page,
      limit,
      categoryLabel,
      category,
      debouncedSearch,
      sortBy,
      priceFilter,
      minPrice,
      maxPrice,
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
      const qs = new URLSearchParams();
      Object.entries(queryParams || {}).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        if (Array.isArray(v)) {
          v.forEach((item) => qs.append(k, String(item)));
        } else {
          qs.set(k, String(v));
        }
      });
      const url = `${publicApiUrl("/api/products")}?${qs.toString()}`;
      if (process.env.NODE_ENV !== "production") {
        console.log("[usePublicProducts] GET", url);
      }
      const res = await fetch(url, { cache: "no-store", signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to load products (${res.status})`);
      }
      const raw = data.data?.products || [];
      setProducts(raw.map(normalizeProductForCard).filter(Boolean));
      setPagination(data.data?.pagination || null);
    } catch (e) {
      if (e.name === "AbortError") {
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

  // Let admin screens force-refresh public storefront lists immediately after edits.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => {
      fetchProducts();
    };

    window.addEventListener("products:refresh", handleRefresh);
    return () => window.removeEventListener("products:refresh", handleRefresh);
  }, [fetchProducts]);

  return { products, pagination, loading, error, refetch: fetchProducts };
}
