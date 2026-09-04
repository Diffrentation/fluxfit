"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  buildPublicProductsQuery,
  normalizeProductForCard,
} from "@/lib/publicProductsApi";
import { publicApiUrl } from "@/lib/apiBaseUrl";
import { toastApiError } from "@/lib/appToast";

// Module-level (not component state) cache of the last successful response
// per query string, so it survives this hook's component remounting — which
// happens on every back/forward navigation to this page since the route's
// client tree isn't preserved. Without this, going back always starts from
// an empty product list + loading spinner even though the exact same data
// was just on screen a moment ago, which reads as the page "refreshing".
// Capped and unbounded-lifetime-per-entry is fine here: it only ever holds
// a handful of recently-viewed filter combinations for one page session.
const productsCache = new Map();
const MAX_CACHE_ENTRIES = 20;

function buildQueryString(queryParams) {
  const qs = new URLSearchParams();
  Object.entries(queryParams || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) {
      v.forEach((item) => qs.append(k, String(item)));
    } else {
      qs.set(k, String(v));
    }
  });
  return qs.toString();
}

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
  sizeFilter,
  brandFilter,
  minRating,
  inStockOnly,
}) {
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
        size: sizeFilter,
        brand: brandFilter,
        minRating,
        inStockOnly,
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
      sizeFilter,
      brandFilter,
      minRating,
      inStockOnly,
    ]
  );
  const queryString = useMemo(() => buildQueryString(queryParams), [queryParams]);

  const cachedForInit = productsCache.get(queryString);
  const [products, setProducts] = useState(() => cachedForInit?.products ?? []);
  const [pagination, setPagination] = useState(() => cachedForInit?.pagination ?? null);
  // Only show the loading state when there's nothing cached to show in the
  // meantime — a query we've already fetched this session still revalidates
  // in the background, but the grid stays populated instead of flashing to
  // empty, which is what made returning to this page look like a reload.
  const [loading, setLoading] = useState(() => !cachedForInit);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const key = buildQueryString(queryParams);
    if (!productsCache.has(key)) setLoading(true);
    setError(null);
    try {
      const url = `${publicApiUrl("/api/products")}?${key}`;
      if (process.env.NODE_ENV !== "production") {
        console.log("[usePublicProducts] GET", url);
      }
      const res = await fetch(url, { cache: "no-store", signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to load products (${res.status})`);
      }
      const normalized = (data.data?.products || [])
        .map(normalizeProductForCard)
        .filter(Boolean);
      const paginationData = data.data?.pagination || null;

      if (productsCache.size >= MAX_CACHE_ENTRIES && !productsCache.has(key)) {
        const oldestKey = productsCache.keys().next().value;
        productsCache.delete(oldestKey);
      }
      productsCache.set(key, { products: normalized, pagination: paginationData });

      setProducts(normalized);
      setPagination(paginationData);
    } catch (e) {
      if (e.name === "AbortError") {
        return;
      }
      console.error("usePublicProducts:", e);
      toastApiError(e, "Could not load products");
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
