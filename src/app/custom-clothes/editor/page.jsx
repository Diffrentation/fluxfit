"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin } from "antd";
import { Suspense } from "react";

/**
 * The old custom-clothes/editor page has been replaced.
 * Users are now redirected to the main custom-clothes order form.
 */
function EditorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Forward any productId as a no-op and just redirect cleanly
    router.replace("/custom-clothes");
  }, [router]);

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
