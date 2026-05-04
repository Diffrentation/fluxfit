"use client";

import { useCallback, useEffect, useState } from "react";

const categoriesCache = new Map();

export function useCategories() {
  const [categories, setCategories] = useState(() => categoriesCache.get("all") || []);
  const [loading, setLoading] = useState(!categoriesCache.has("all"));
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async (force = false) => {
    if (!force && categoriesCache.has("all")) {
      setCategories(categoriesCache.get("all"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/categories?format=tree", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load categories");
      }

      const list = Array.isArray(data?.data?.categories) ? data.data.categories : [];
      categoriesCache.set("all", list);
      setCategories(list);
    } catch (err) {
      setError(err?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: () => fetchCategories(true),
  };
}
