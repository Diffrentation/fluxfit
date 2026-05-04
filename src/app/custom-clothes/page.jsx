"use client";

import { useEffect, useMemo, useState } from "react";
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
  const { flowSelection, updateFlowSelection } = useCustomDesign();
  const [step, setStep] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const {
    subcategories,
    loading: subcategoriesLoading,
    error: subcategoriesError,
  } = useSubcategories(selectedCategory?.id);

  const productFilters = useMemo(
    () => ({
      categoryId: selectedCategory?.id || null,
      subcategoryId: selectedSubcategory?.id || null,
    }),
    [selectedCategory?.id, selectedSubcategory?.id]
  );

  const shouldPrefetchProducts =
    step === "subcategories" &&
    Boolean(selectedCategory?.id) &&
    !subcategoriesLoading &&
    !subcategoriesError &&
    subcategories.length === 0;

  const shouldLoadProducts =
    (step === "products" || shouldPrefetchProducts) &&
    Boolean(selectedCategory?.id || selectedSubcategory?.id);

  const { products, loading: productsLoading, error: productsError } = useProducts(
    productFilters,
    shouldLoadProducts
  );

  useEffect(() => {
    if (!categories.length || selectedCategory || !flowSelection?.category?.id) return;
    const restoredCategory = categories.find(
      (cat) => String(cat.id) === String(flowSelection.category.id)
    );
    if (!restoredCategory) return;

    setSelectedCategory(restoredCategory);
    setStep(flowSelection?.subcategory?.id ? "subcategories" : "categories");
  }, [categories, selectedCategory, flowSelection]);

  useEffect(() => {
    if (
      !subcategories.length ||
      selectedSubcategory ||
      !flowSelection?.subcategory?.id
    ) {
      return;
    }
    const restoredSubcategory = subcategories.find(
      (sub) => String(sub.id) === String(flowSelection.subcategory.id)
    );
    if (!restoredSubcategory) return;

    setSelectedSubcategory(restoredSubcategory);
    setStep("products");
  }, [subcategories, selectedSubcategory, flowSelection]);

  useEffect(() => {
    if (step !== "subcategories" || !selectedCategory?.id || subcategoriesLoading) return;
    if (subcategoriesError) return;

    if (!subcategories.length) {
      setSelectedSubcategory(null);
      setStep("products");
    }
  }, [
    step,
    selectedCategory?.id,
    subcategories,
    subcategoriesLoading,
    subcategoriesError,
  ]);

  const onSelectCategory = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setStep("subcategories");
    updateFlowSelection({
      category: { id: category.id, name: category.name },
      subcategory: null,
      product: null,
    });
  };

  const onSelectSubcategory = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setStep("products");
    updateFlowSelection({
      subcategory: { id: subcategory.id, name: subcategory.name },
      product: null,
    });
  };

  const onSelectProduct = (product) => {
    const id = product?.id || product?._id;
    if (!id) return;
    updateFlowSelection({
      product: { id, name: product.name || "" },
    });
    router.push(`/custom-clothes/editor?productId=${encodeURIComponent(String(id))}`);
  };

  const onBackFromSubcategories = () => {
    setSelectedSubcategory(null);
    setStep("categories");
    updateFlowSelection({ subcategory: null, product: null });
  };

  const onBackFromProducts = () => {
    if (selectedSubcategory) {
      setStep("subcategories");
      updateFlowSelection({ product: null });
      return;
    }
    setStep("categories");
    updateFlowSelection({ subcategory: null, product: null });
  };

  const pageLoading = categoriesLoading || (step === "subcategories" && subcategoriesLoading);

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
            Pick a category, choose a subcategory if available, then select a product to open the design editor.
          </p>

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {step === "categories" && "Step 1: Category"}
            {step === "subcategories" && "Step 2: Subcategory"}
            {step === "products" && "Step 3: Product"}
          </p>

          <nav
            aria-label="Breadcrumb"
            className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm"
          >
            <button
              type="button"
              onClick={() => {
                setStep("categories");
                setSelectedSubcategory(null);
                updateFlowSelection({ subcategory: null, product: null });
              }}
              className={[
                "rounded-md px-2 py-1",
                step === "categories"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
              ].join(" ")}
            >
              Categories
            </button>

            {selectedCategory ? (
              <>
                <span className="text-neutral-400">/</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("subcategories");
                    setSelectedSubcategory(null);
                    updateFlowSelection({ subcategory: null, product: null });
                  }}
                  className={[
                    "rounded-md px-2 py-1",
                    step === "subcategories"
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                  ].join(" ")}
                >
                  {selectedCategory.name}
                </button>
              </>
            ) : null}

            {step === "products" ? (
              <>
                <span className="text-neutral-400">/</span>
                <span className="rounded-md bg-neutral-900 px-2 py-1 text-white dark:bg-white dark:text-neutral-900">
                  {selectedSubcategory?.name || "Products"}
                </span>
              </>
            ) : null}
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

        {step === "categories" && !categoriesLoading ? (
          <CategoryList
            categories={categories}
            activeCategoryId={selectedCategory?.id}
            onSelect={onSelectCategory}
          />
        ) : null}

        {step === "subcategories" && !subcategoriesLoading ? (
          subcategoriesError ? (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {subcategoriesError}
            </div>
          ) : subcategories.length > 0 ? (
            <SubcategoryList
              categoryName={selectedCategory?.name || "Selected category"}
              subcategories={subcategories}
              activeSubcategoryId={selectedSubcategory?.id}
              onBack={onBackFromSubcategories}
              onSelect={onSelectSubcategory}
            />
          ) : null
        ) : null}

        {step === "products" ? (
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
              heading={
                selectedSubcategory?.name
                  ? `Products in ${selectedSubcategory.name}`
                  : `Products in ${selectedCategory?.name || "category"}`
              }
              products={products}
              onBack={onBackFromProducts}
              onSelect={onSelectProduct}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
