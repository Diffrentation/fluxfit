"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import CategoryList from "@/components/CustomClothesFlow/CategoryList";
import SubcategoryList from "@/components/CustomClothesFlow/SubcategoryList";
import ProductGrid from "@/components/CustomClothesFlow/ProductGrid";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useProducts } from "@/hooks/useProducts";
import { useCustomDesign } from "@/context/CustomDesignContext";

export default function CustomClothesFlowPage() {
  const router = useRouter();
  const { updateFlowSelection } = useCustomDesign();
  const [categoryPath, setCategoryPath] = useState([]);

  const currentCategory = categoryPath[categoryPath.length - 1] || null;

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const {
    subcategories,
    loading: subcategoriesLoading,
    error: subcategoriesError,
  } = useSubcategories(currentCategory?.id);

  const isShowingProducts = Boolean(currentCategory) && !subcategoriesLoading && !subcategoriesError && subcategories.length === 0;

  const productFilters = useMemo(
    () => ({
      categoryId: currentCategory?.id || null,
    }),
    [currentCategory?.id]
  );

  const { products, loading: productsLoading, error: productsError } = useProducts(
    productFilters,
    isShowingProducts
  );

  const onSelectCategory = (category) => {
    setCategoryPath([...categoryPath, { id: category.id, name: category.name }]);
  };

  const onSelectProduct = (product) => {
    const id = product?.id || product?._id;
    if (!id) return;
    
    // Create flow selection to keep editor context happy
    let flowState = { product: { id, name: product.name || "" } };
    if (categoryPath.length > 0) {
      flowState.category = categoryPath[0];
    }
    if (categoryPath.length > 1) {
      flowState.subcategory = categoryPath[categoryPath.length - 1];
    }
    updateFlowSelection(flowState);
    
    router.push(`/custom-clothes/editor?productId=${encodeURIComponent(String(id))}`);
  };

  const onBreadcrumbClick = (index) => {
    if (index === -1) {
      setCategoryPath([]);
    } else {
      setCategoryPath(categoryPath.slice(0, index + 1));
    }
  };

  const onBack = () => {
    setCategoryPath(categoryPath.slice(0, -1));
  };

  const pageLoading = categoriesLoading || (currentCategory && subcategoriesLoading && !isShowingProducts);

  return (
    <div className="min-h-[70vh] bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-16 sm:py-20 md:py-24">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Custom clothes
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
            Category to design flow
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Pick a category, navigate through subcategories if available, then select a product to open the design editor.
          </p>

          <nav
            aria-label="Breadcrumb"
            className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm"
          >
            <button
              type="button"
              onClick={() => onBreadcrumbClick(-1)}
              className={[
                "rounded-md px-2 py-1",
                categoryPath.length === 0
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
              ].join(" ")}
            >
              Categories
            </button>

            {categoryPath.map((cat, index) => {
              const isLast = index === categoryPath.length - 1;
              return (
                <span key={cat.id} className="flex items-center gap-2">
                  <span className="text-neutral-400">/</span>
                  <button
                    type="button"
                    onClick={() => onBreadcrumbClick(index)}
                    className={[
                      "rounded-md px-2 py-1",
                      isLast
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    {cat.name}
                  </button>
                </span>
              );
            })}
          </nav>
        </header>

        {pageLoading ? (
          <div className="mt-10 flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
            <Spin />
            <span>Loading...</span>
          </div>
        ) : null}

        {categoriesError ? (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {categoriesError}
          </div>
        ) : null}

        {categoryPath.length === 0 && !categoriesLoading ? (
          <CategoryList
            categories={categories}
            activeCategoryId={null}
            onSelect={onSelectCategory}
          />
        ) : null}

        {categoryPath.length > 0 && !subcategoriesLoading && !isShowingProducts ? (
          subcategoriesError ? (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {subcategoriesError}
            </div>
          ) : subcategories.length > 0 ? (
            <SubcategoryList
              categoryName={currentCategory?.name || "Selected category"}
              subcategories={subcategories}
              activeSubcategoryId={null}
              onBack={onBack}
              onSelect={onSelectCategory}
            />
          ) : null
        ) : null}

        {isShowingProducts ? (
          productsError ? (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {productsError}
            </div>
          ) : productsLoading ? (
            <div className="mt-10 flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
              <Spin />
              <span>Loading products...</span>
            </div>
          ) : (
            <ProductGrid
              heading={`Products in ${currentCategory?.name || "category"}`}
              products={products}
              onBack={onBack}
              onSelect={onSelectProduct}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
