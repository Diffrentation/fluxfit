"use client";

import { motion } from "framer-motion";
import { IconArrowLeft } from "@tabler/icons-react";

const SUB_COLORS = [
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-sky-500",
  "from-fuchsia-400 to-purple-500",
  "from-lime-400 to-green-500",
];

export default function SubcategoryList({
  categoryName,
  subcategories,
  onBack,
  onSelect,
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          type="button"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <IconArrowLeft size={16} />
          Back
        </motion.button>
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">
            {categoryName}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select a subcategory
          </p>
        </div>
      </div>

      <motion.ul
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {subcategories.map((sub, idx) => {
          const gradient = SUB_COLORS[idx % SUB_COLORS.length];
          return (
            <motion.li
              key={String(sub.id)}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}
            >
              <motion.button
                type="button"
                onClick={() => onSelect(sub)}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 min-h-[100px] flex flex-col justify-between text-left hover:shadow-xl dark:hover:shadow-black/40 transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-white blur-2xl" />
                <div className="text-2xl mb-2">📦</div>
                <div>
                  <p className="font-bold text-white text-sm leading-tight drop-shadow-sm">
                    {sub.name}
                  </p>
                  <p className="text-white/70 text-xs mt-0.5 font-medium">
                    View products →
                  </p>
                </div>
              </motion.button>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
