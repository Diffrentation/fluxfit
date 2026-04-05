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
          },
        }}
      />
      <GlobalAxiosToasts />
    </>
  );
}
