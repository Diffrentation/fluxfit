"use client";

import { Button } from "antd";

export default function AddCustomDesignButton({ onClick, disabled = false }) {
  return (
    <Button
      size="large"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 px-8"
    >
      ADD CUSTOM DESIGN
    </Button>
  );
}
