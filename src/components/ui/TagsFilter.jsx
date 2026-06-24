"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  IconTags,
  IconShirt,
  IconLeaf,
  IconTag,
  IconX,
  IconPlus,
  IconTagFilled
} from "@tabler/icons-react";

const getTagIcon = (tag) => {
  const t = tag.toLowerCase();
  if (t === "fashion") return IconShirt;
  if (t === "lifestyle") return IconLeaf;
  return IconTag;
};

const TagsFilter = ({ selectedTags, onChange, tags }) => {
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-extrabold text-[#0d1c2f]">Tags</h3>
        <IconTags className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 space-y-2 mb-6">
        {tags.map((tag, index) => {
          const isSelected = selectedTags.includes(tag);
          const Icon = getTagIcon(tag);
          return (
            <motion.button
              key={tag}
              onClick={() => toggleTag(tag)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all ${
                isSelected
                  ? "bg-[#f2fcf6] border-[#1e9a58] shadow-sm"
                  : "bg-white border-dashed border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isSelected ? "text-[#1e9a58]" : "text-gray-500"}`} />
                <span className={`font-semibold ${isSelected ? "text-gray-800" : "text-gray-500"}`}>{tag}</span>
              </div>
              {isSelected ? (
                <IconX className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
              ) : (
                <IconPlus className="w-4 h-4 text-blue-500" />
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-auto bg-[#f8fafc] rounded-xl p-4 flex gap-3 items-start border border-gray-100">
        <IconTagFilled className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-[#0d1c2f] mb-0.5">Use tags</span>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Add tags to find products that match your style.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TagsFilter;
