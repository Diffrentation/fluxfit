"use client";
import React from "react";
import { motion } from "framer-motion";
import Accordion from "./Accordion";
import { IconStarFilled, IconStar } from "@tabler/icons-react";

const RATING_OPTIONS = [4, 3, 2, 1];

const Stars = ({ count }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) =>
      i <= count ? (
        <IconStarFilled key={i} className="w-3 h-3 text-amber-400" />
      ) : (
        <IconStar key={i} className="w-3 h-3 text-gray-300" />
      )
    )}
  </span>
);

const RatingFilter = ({ value, onChange }) => {
  return (
    <Accordion title="Rating" icon={IconStarFilled} defaultOpen={true}>
      <div className="flex flex-col gap-1.5">
        {RATING_OPTIONS.map((rating, index) => {
          const isSelected = value === rating;
          return (
            <motion.button
              key={rating}
              onClick={() => onChange(isSelected ? null : rating)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
                isSelected
                  ? "bg-[#f4fbf7] border-[#1e9a58]"
                  : "bg-white border-gray-200 hover:border-[#1e9a58]"
              }`}
            >
              <Stars count={rating} />
              <span className="text-[12px] font-medium text-gray-600">& above</span>
            </motion.button>
          );
        })}
      </div>
    </Accordion>
  );
};

export default RatingFilter;
