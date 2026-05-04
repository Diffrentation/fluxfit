"use client";

export default function CategoryList({
  categories,
  activeCategoryId,
  onSelect,
}) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((cat) => {
        const isActive = String(activeCategoryId || "") === String(cat.id || "");
        return (
          <li key={String(cat.id)}>
            <button
              type="button"
              onClick={() => onSelect(cat)}
              className={[
                "w-full rounded-xl border px-4 py-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
                isActive
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/80",
              ].join(" ")}
            >
              <p className="text-base font-semibold">{cat.name}</p>
              <p
                className={[
                  "mt-1 text-sm",
                  isActive ? "opacity-90" : "text-neutral-500 dark:text-neutral-400",
                ].join(" ")}
              >
                {(cat.children?.length || 0) > 0
                  ? `${cat.children.length} subcategories`
                  : "Browse products"}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
