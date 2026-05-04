"use client";

import { useCallback, useEffect, useState } from "react";

const subcategoriesCache = new Map();

export function useSubcategories(categoryId) {
  const cacheKey = String(categoryId || "");
  const [subcategories, setSubcategories] = useState(() =>
    cacheKey ? subcategoriesCache.get(cacheKey) || [] : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSubcategories = useCallback(
    async (force = false) => {
      if (!cacheKey) {
        setSubcategories([]);
        setLoading(false);
        setError("");
        return;
      }

      if (!force && subcategoriesCache.has(cacheKey)) {
        setSubcategories(subcategoriesCache.get(cacheKey));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/subcategories?categoryId=${encodeURIComponent(cacheKey)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load subcategories");
        }

        const list = Array.isArray(data?.data?.subcategories)
          ? data.data.subcategories
          : [];
        subcategoriesCache.set(cacheKey, list);
        setSubcategories(list);
      } catch (err) {
        setError(err?.message || "Failed to load subcategories");
      } finally {
        setLoading(false);
      }
    },
    [cacheKey]
  );

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  return {
    subcategories,
    loading,
    error,
    refetch: () => fetchSubcategories(true),
  };
}
