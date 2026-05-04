"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const productsCache = new Map();

function buildProductsUrl(filters) {
  const params = new URLSearchParams();
  params.set("limit", "60");
  params.set("status", "active");

  if (filters?.subcategoryId) {
    params.set("subcategoryId", String(filters.subcategoryId));
  } else if (filters?.categoryId) {
    params.set("categoryId", String(filters.categoryId));
  }

  return `/api/products?${params.toString()}`;
}

export function useProducts(filters, enabled = true) {
  const queryKey = useMemo(() => JSON.stringify(filters || {}), [filters]);
  const [products, setProducts] = useState(() =>
    queryKey ? productsCache.get(queryKey) || [] : []
  );
  const [loading, setLoading] = useState(Boolean(enabled && queryKey && !productsCache.has(queryKey)));
  const [error, setError] = useState("");

  const fetchProducts = useCallback(
    async (force = false) => {
      if (!enabled || !queryKey) {
        setProducts([]);
        setLoading(false);
        setError("");
        return;
      }

      if (!force && productsCache.has(queryKey)) {
        setProducts(productsCache.get(queryKey));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const url = buildProductsUrl(filters);
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load products");
        }

        const list = Array.isArray(data?.data?.products) ? data.data.products : [];
        productsCache.set(queryKey, list);
        setProducts(list);
      } catch (err) {
        setError(err?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [enabled, queryKey, filters]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: () => fetchProducts(true),
  };
}
