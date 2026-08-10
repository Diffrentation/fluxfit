"use client";
import React from "react";
import Accordion from "./Accordion";
import { IconPackage } from "@tabler/icons-react";

const InStockFilter = ({ value, onChange }) => {
  return (
    <Accordion title="Availability" icon={IconPackage} defaultOpen={true}>
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-[#1e9a58] focus:ring-[#1e9a58] accent-[#1e9a58]"
        />
        <span className="text-[12px] font-medium text-gray-700">
          In stock only
        </span>
      </label>
    </Accordion>
  );
};

export default InStockFilter;
