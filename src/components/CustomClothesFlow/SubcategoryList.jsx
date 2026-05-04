"use client";

export default function SubcategoryList({
  categoryName,
  subcategories,
  activeSubcategoryId,
  onBack,
  onSelect,
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {categoryName} subcategories
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Back to categories
        </button>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {subcategories.map((sub) => {
          const isActive = String(activeSubcategoryId || "") === String(sub.id || "");
          return (
            <li key={String(sub.id)}>
              <button
                type="button"
                onClick={() => onSelect(sub)}
                className={[
                  "w-full rounded-xl border px-4 py-4 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
                  isActive
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/80",
                ].join(" ")}
              >
                <p className="text-base font-semibold">{sub.name}</p>
                <p
                  className={[
                    "mt-1 text-sm",
                    isActive ? "opacity-90" : "text-neutral-500 dark:text-neutral-400",
                  ].join(" ")}
                >
                  View products
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
