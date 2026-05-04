"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin } from "antd";
import DesignEditor from "@/components/CustomClothesFlow/DesignEditor";
import { useCustomDesign } from "@/context/CustomDesignContext";

function CustomClothesEditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateFlowSelection } = useCustomDesign();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) {
      router.replace("/custom-clothes");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok || !data?.success || !data?.data?.product) {
          throw new Error(data?.message || "Product not found");
        }

        if (!cancelled) {
          setProduct(data.data.product);
          updateFlowSelection({
            product: {
              id: data.data.product?.id || data.data.product?._id || productId,
              name: data.data.product?.name || "",
            },
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load product");
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId, router, updateFlowSelection]);

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-neutral-50 dark:bg-neutral-950">
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
            <Spin />
            <span>Loading editor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] bg-neutral-50 dark:bg-neutral-950">
        <div className="container mx-auto px-4 py-20">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error || "Invalid product selection"}
          </div>
          <button
            type="button"
            onClick={() => router.push("/custom-clothes")}
            className="mt-4 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Go to custom clothes flow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-16 sm:py-20 md:py-24">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Step 4: Design editor
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
            Customize {product.name}
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Add multiple designs, switch colors, and position each print independently.
          </p>
        </header>

        <DesignEditor product={product} />
      </div>
    </div>
  );
}

export default function CustomClothesEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] bg-neutral-50 dark:bg-neutral-950">
          <div className="container mx-auto px-4 py-20">
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
              <Spin />
              <span>Loading editor...</span>
            </div>
          </div>
        </div>
      }
    >
      <CustomClothesEditorPageContent />
    </Suspense>
  );
}
