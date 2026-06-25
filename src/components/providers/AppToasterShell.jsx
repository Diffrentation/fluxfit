"use client";

import { Toaster } from "react-hot-toast";
import GlobalAxiosToasts from "@/components/providers/GlobalAxiosToasts";

export default function AppToasterShell() {
  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 2147483646 }}
        toastOptions={{
          duration: 4500,
          style: {
            maxWidth: "min(100vw - 24px, 420px)",
            zIndex: 2147483647,
            background: "#1e9a58",
            color: "#ffffff",
            borderRadius: "9999px",
            padding: "12px 24px",
            fontWeight: "500",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          },
          success: {
            iconTheme: {
              primary: "#ffffff",
              secondary: "#1e9a58",
            },
          },
          error: {
            style: {
              background: "#ef4444",
              color: "#ffffff",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#ef4444",
            },
          },
        }}
      />
      <GlobalAxiosToasts />
    </>
  );
}
