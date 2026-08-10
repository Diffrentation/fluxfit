"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Spin } from "antd";
import { Suspense } from "react";

/**
 * Legacy /custom-clothes/editor route. The design editor itself now lives on
 * /custom-clothes (CustomOrderForm), so this page's only job is to resolve
 * the ?productId it was given into the same ?previewImage/?productName
 * query params the "ADD CUSTOM DESIGN" button on the product-details page
 * already links with, then hand off — so a product picked from the Browse
 * Products tab lands on a form that's actually pre-filled with that product,
 * instead of a blank one.
 */
function EditorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const productId = searchParams.get("productId");

    if (!productId) {
      router.replace("/custom-clothes");
      return;
    }

    let cancelled = false;

    axios
      .get(`/api/products/${productId}`)
      .then(({ data }) => {
        if (cancelled) return;
        const product = data?.data?.product || data?.data;
        const name = product?.name || "";
        const image =
          product?.primaryImage ||
          product?.images?.find((img) => img.isPrimary)?.url ||
          product?.images?.[0]?.url ||
          "";
        const params = new URLSearchParams();
        if (image) params.set("previewImage", image);
        if (name) params.set("productName", name);
        router.replace(`/custom-clothes?${params.toString()}`);
      })
      .catch(() => {
        if (!cancelled) router.replace("/custom-clothes");
      });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Spin size="large" />
        <p className="text-gray-500 text-sm">Redirecting…</p>
      </div>
    </div>
  );
}

export default function CustomClothesEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Spin size="large" />
        </div>
      }
    >
      <EditorRedirect />
    </Suspense>
  );
}
