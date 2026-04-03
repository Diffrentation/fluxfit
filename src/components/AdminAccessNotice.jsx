"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { message } from "antd";

/**
 * Shows a warning when middleware redirects non-admins away from /admin (?admin_denied=1).
 */
export default function AdminAccessNotice() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    if (searchParams.get("admin_denied") !== "1") return;
    shown.current = true;
    message.warning(
      "Admin area is restricted. You need an administrator account to access it."
    );
    const clean = new URLSearchParams(searchParams.toString());
    clean.delete("admin_denied");
    const q = clean.toString();
    router.replace(q ? `${pathname}?${q}` : pathname || "/", { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
}
