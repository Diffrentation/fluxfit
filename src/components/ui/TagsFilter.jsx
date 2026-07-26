"use client";
import React from "react";
import { motion } from "framer-motion";
import Accordion from "./Accordion";
import { IconTags } from "@tabler/icons-react";

const TagsFilter = ({ selectedTags, onChange, tags }) => {
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <Accordion title="Tags & Categories" icon={IconTags} defaultOpen={true}>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <motion.button
              key={tag}
              onClick={() => toggleTag(tag)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-2.5 py-1 rounded-full border text-[12px] font-medium transition-all ${
                isSelected
                  ? "bg-[#1e9a58] text-white border-[#1e9a58] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1e9a58] hover:text-[#1e9a58]"
              }`}
            >
              {tag}
            </motion.button>
          );
        })}
      </div>
    </Accordion>
  );
};

export default TagsFilter;
