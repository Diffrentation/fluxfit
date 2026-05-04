"use client";

function imageUrl(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      return first.url || first.secure_url || "";
    }
  }
  return "";
}

export default function ProductGrid({
  heading,
  products,
  onBack,
  onSelect,
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {heading}
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Back
        </button>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const img = imageUrl(product);
          return (
            <li key={String(product.id || product._id)}>
              <button
                type="button"
                onClick={() => onSelect(product)}
                className="flex w-full flex-col rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                <div className="aspect-4/5 w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={product.name || "Product"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
                      No image
                    </div>
                  )}
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-white">
                  {product.name}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Tap to customize
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
