"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import {
  IconArrowLeft,
  IconListDetails,
  IconPencil,
  IconPackage,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";
import CategoryList from "@/components/CustomClothesFlow/CategoryList";
import SubcategoryList from "@/components/CustomClothesFlow/SubcategoryList";
import ProductGrid from "@/components/CustomClothesFlow/ProductGrid";
import CustomOrderForm from "@/components/CustomClothesFlow/CustomOrderForm";
import OrderStatusTracker from "@/components/CustomClothesFlow/OrderStatusTracker";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useProducts } from "@/hooks/useProducts";
import { useCustomDesign } from "@/context/CustomDesignContext";
import axios from "axios";
import toast from "react-hot-toast";

function getToken() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw || raw === "undefined" || raw === "null") return null;
  return raw.trim();
}

// Tabs: "new-order" | "my-orders" | "categories"
function CustomClothesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateFlowSelection, resetFlowSelection } = useCustomDesign();

  const [activeTab, setActiveTab] = useState("new-order");
  const [categoryPath, setCategoryPath] = useState([]);

  // My orders
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Reset on ?reset=true
  useEffect(() => {
    if (searchParams.get("reset") === "true") {
      setCategoryPath([]);
      resetFlowSelection();
      router.replace("/custom-clothes");
    }
  }, [searchParams, router, resetFlowSelection]);

  const currentCategory = categoryPath[categoryPath.length - 1] || null;

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const {
    subcategories,
    loading: subcategoriesLoading,
    error: subcategoriesError,
  } = useSubcategories(currentCategory?.id);

  // We no longer need to check if there are subcategories to show products
  // because clicking ANY category (main or sub) immediately shows its products.
  const isShowingProducts = Boolean(currentCategory);

  const productFilters = useMemo(
    () => ({ categoryId: currentCategory?.id || null }),
    [currentCategory?.id]
  );

  const { products, loading: productsLoading, error: productsError } = useProducts(
    productFilters,
    isShowingProducts
  );

  const fetchMyOrders = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setOrdersLoading(true);
    try {
      const { data } = await axios.get("/api/custom-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setMyOrders(data.data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "my-orders") fetchMyOrders();
  }, [activeTab, fetchMyOrders]);

  const onSelectCategory = (category) => {
    setCategoryPath([...categoryPath, { id: category.id, name: category.name }]);
  };

  const onSelectProduct = (product) => {
    const id = product?.id || product?._id;
    if (!id) return;
    let flowState = { product: { id, name: product.name || "" } };
    if (categoryPath.length > 0) flowState.category = categoryPath[0];
    if (categoryPath.length > 1)
      flowState.subcategory = categoryPath[categoryPath.length - 1];
    updateFlowSelection(flowState);
    router.push(`/custom-clothes/editor?productId=${encodeURIComponent(String(id))}`);
  };

  const onBack = () => setCategoryPath(categoryPath.slice(0, -1));

  const onBreadcrumbClick = (index) => {
    if (index === -1) setCategoryPath([]);
    else setCategoryPath(categoryPath.slice(0, index + 1));
  };

  const pageLoading = categoriesLoading;

  const showCategories = activeTab === "categories";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        {/* Hero header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold mb-4"
          >
            ✨ Custom Clothes Studio
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight"
          >
            Design Your Perfect Outfit
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-base"
          >
            Choose your style, pick colors, upload your designs — our team
            brings it to life.
          </motion.p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-1 shadow-sm gap-1">
            {[
              { key: "new-order", label: "New Order", icon: IconPencil },
              { key: "my-orders", label: "My Orders", icon: IconPackage },
              { key: "categories", label: "Browse Products", icon: IconListDetails },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={[
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  activeTab === key
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60",
                ].join(" ")}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── NEW ORDER TAB ─────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "new-order" && (
            <motion.div
              key="new-order"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <CustomOrderForm
                onSubmitSuccess={() => {
                  setActiveTab("my-orders");
                }}
              />
            </motion.div>
          )}

          {/* ── MY ORDERS TAB ─────────────────────────── */}
          {activeTab === "my-orders" && (
            <motion.div
              key="my-orders"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    My Custom Orders
                  </h2>
                  <button
                    type="button"
                    onClick={fetchMyOrders}
                    disabled={ordersLoading}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <IconRefresh
                      size={14}
                      className={ordersLoading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>

                {ordersLoading ? (
                  <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                    <IconLoader2 size={22} className="animate-spin" />
                    <span>Loading orders…</span>
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-700">
                    <div className="text-5xl mb-4">🧵</div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No custom orders yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("new-order")}
                      className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Create your first order →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                    {myOrders.map((order) => (
                      <OrderStatusTracker key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── BROWSE PRODUCTS TAB ─────────────────────────── */}
          {activeTab === "categories" && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start"
            >
              {/* Left Sidebar: Categories */}
              <div className="lg:col-span-1">
                {categoriesError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    {categoriesError}
                  </div>
                ) : categoriesLoading ? (
                  <div className="flex items-center gap-3 text-gray-400 p-4">
                    <Spin />
                    <span>Loading categories…</span>
                  </div>
                ) : (
                  <CategoryList
                    categories={categories}
                    activeCategoryId={currentCategory?.id}
                    onSelect={(cat) => {
                      // Clicking any category or subcategory directly sets it as the current category
                      // and fetches products for it.
                      setCategoryPath([{ id: cat.id, name: cat.name }]);
                    }}
                  />
                )}
              </div>

              {/* Right Content: Products */}
              <div className="lg:col-span-3">
                {currentCategory ? (
                  <>
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Products in {currentCategory.name}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setCategoryPath([])}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        (Clear selection)
                      </button>
                    </div>

                    {productsError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        {productsError}
                      </div>
                    ) : productsLoading ? (
                      <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
                        <Spin size="large" />
                        <span>Loading products…</span>
                      </div>
                    ) : (
                      <ProductGrid
                        heading=""
                        products={products}
                        onBack={() => setCategoryPath([])}
                        onSelect={onSelectProduct}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-32 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-700">
                    <div className="text-5xl mb-4">🛍️</div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                      Select a category to view products.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function CustomClothesFlowPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <CustomClothesPageContent />
    </Suspense>
  );
}
