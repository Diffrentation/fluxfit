"use client";

import { useCallback, useEffect, useState } from "react";

export function useSubcategories(categoryId) {
  const cacheKey = String(categoryId || "");
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSubcategories = useCallback(async () => {
    if (!cacheKey) {
      setSubcategories([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/subcategories?categoryId=${encodeURIComponent(cacheKey)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load subcategories");
      }

      const list = Array.isArray(data?.data?.subcategories)
        ? data.data.subcategories
        : [];
      setSubcategories(list);
    } catch (err) {
      setError(err?.message || "Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  return {
    subcategories,
    loading,
    error,
    refetch: fetchSubcategories,
  };
}
