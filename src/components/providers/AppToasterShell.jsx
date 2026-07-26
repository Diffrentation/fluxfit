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
            maxWidth: "min(100vw - 32px, 350px)",
            zIndex: 2147483647,
            background: "#1e9a58",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: "500",
            lineHeight: "1.4",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
