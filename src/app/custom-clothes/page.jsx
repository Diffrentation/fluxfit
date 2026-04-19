"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowLeft, IconSearch, IconX } from "@tabler/icons-react";
import { message } from "antd";
import {
  CUSTOM_DESIGN_OPTIONS,
  DesignThumbnail,
  setRemoteCustomDesigns,
} from "@/components/CustomClothes/designCanvas";
import FlatGarmentCustomizer from "@/components/CustomClothes/FlatGarmentCustomizer";
import {
  buildCustomClothesPayload,
  createDefaultViewPlacements,
  createLayer,
} from "@/components/CustomClothes/customClothesConfig";
import { getMockupsForCategory } from "@/components/CustomClothes/mockupTemplates";
import { useCart } from "@/context/CartContext";

const CUSTOM_CLOTHES_CART_PRODUCT = {
  id: "custom-clothes-local",
  _id: "custom-clothes-local",
  name: "Custom clothing",
  slug: "custom-clothing",
  price: "29.99",
  image: null,
};

/** Fabric / cloth quality options (step 1). */
export const CLOTH_QUALITIES = [
  {
    id: "cotton",
    name: "Cotton",
    hint: "Soft, breathable, everyday wear",
  },
  {
    id: "normal",
    name: "Normal / standard blend",
    hint: "Versatile poly-cotton & basics",
  },
  {
    id: "organic-cotton",
    name: "Organic cotton",
    hint: "Eco-friendly, gentle on skin",
  },
  {
    id: "linen",
    name: "Linen",
    hint: "Light, crisp, summer-friendly",
  },
  {
    id: "silk",
    name: "Silk",
    hint: "Luxury sheen & drape",
  },
  {
    id: "wool",
    name: "Wool",
    hint: "Natural warmth & structure",
  },
  {
    id: "denim",
    name: "Denim",
    hint: "Durable twill for jeans & jackets",
  },
  {
    id: "polyester-blend",
    name: "Polyester blend",
    hint: "Easy care, wrinkle resistant",
  },
  {
    id: "jersey-knit",
    name: "Jersey / knit",
    hint: "Stretchy tees & loungewear",
  },
  {
    id: "khadi-handloom",
    name: "Khadi / handloom",
    hint: "Textured ethnic & casual",
  },
  {
    id: "velvet",
    name: "Velvet / velour",
    hint: "Rich formal & party wear",
  },
  {
    id: "performance",
    name: "Performance / technical",
    hint: "Moisture-wicking, sport-ready",
  },
];

/** Hardcoded custom clothing categories (step 2 — replace with API/CMS later). */
export const CUSTOM_CLOTHES_CATEGORIES = [
  { id: 1, name: "T-Shirts", hint: "Prints, fits & neck styles" },
  { id: 2, name: "Polo shirts", hint: "Collars & embroidery" },
  { id: 3, name: "Shirts", hint: "Formal & casual cuts" },
  { id: 4, name: "Jeans", hint: "Washes & fits" },
  { id: 5, name: "Trousers & chinos", hint: "Tailored lengths" },
  { id: 6, name: "Shorts", hint: "Summer & sport" },
  { id: 7, name: "Dresses", hint: "Lengths & silhouettes" },
  { id: 8, name: "Skirts", hint: "Mini to maxi" },
  { id: 9, name: "Kurtas & kurtis", hint: "Ethnic everyday" },
  { id: 10, name: "Sarees & drapes", hint: "Blouses & pleats" },
  { id: 11, name: "Hoodies & sweatshirts", hint: "Layered comfort" },
  { id: 12, name: "Jackets", hint: "Denim, bomber, utility" },
  { id: 13, name: "Blazers", hint: "Smart casual" },
  { id: 14, name: "Sportswear", hint: "Performance fabrics" },
  { id: 15, name: "Activewear", hint: "Gym & yoga" },
  { id: 16, name: "Loungewear", hint: "Soft sets" },
  { id: 17, name: "Ethnic sets", hint: "Coordinated looks" },
  { id: 18, name: "Kids wear", hint: "Sizes & safety" },
  { id: 19, name: "Workwear", hint: "Uniforms & branding" },
  { id: 20, name: "Outerwear", hint: "Coats & trenches" },
];

const EMPTY_CATEGORY_MOCKUPS = [];

function cardButtonClass(selected) {
  return [
    "w-full rounded-xl border px-4 py-4 text-left transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
    selected
      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/80",
  ].join(" ");
}

export default function CustomClothesPage() {
  const { addToCart } = useCart();

  /** 1 = fabric, 2 = category, 3 = flat design preview */
  const [wizardStep, setWizardStep] = useState(1);

  const [selectedFabric, setSelectedFabric] = useState(null);
  const [fabricQuery, setFabricQuery] = useState("");
  const [activeFabricId, setActiveFabricId] = useState(null);

  const [categoryQuery, setCategoryQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  /** Set when entering step 3 */
  const [lockedCategory, setLockedCategory] = useState(null);
  const [activeView, setActiveView] = useState("front");
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [designPick, setDesignPick] = useState(() => new Set());
  const [viewPlacements, setViewPlacements] = useState(
    createDefaultViewPlacements
  );
  const pendingLayerSelectRef = useRef(null);
  const [selectedMockupId, setSelectedMockupId] = useState(null);
  /** Admin / seeded designs — Custom Clothes only (see /admin/custom-clothes-designs). */
  const [adminCustomDesigns, setAdminCustomDesigns] = useState([]);

  const designPickerOptions = useMemo(() => {
    const builtIns = CUSTOM_DESIGN_OPTIONS.filter((d) => d.id !== "none");
    const fromAdmin = adminCustomDesigns.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description || "From admin catalog",
    }));
    const none = CUSTOM_DESIGN_OPTIONS.find((d) => d.id === "none");
    return [none, ...builtIns, ...fromAdmin].filter(Boolean);
  }, [adminCustomDesigns]);

  const designNameLookup = useMemo(() => {
    const m = new Map(
      CUSTOM_DESIGN_OPTIONS.map((d) => [d.id, d.name])
    );
    for (const d of adminCustomDesigns) {
      m.set(d.id, d.name);
    }
    m.set("upload", "Your upload");
    m.set("none", "No print");
    return m;
  }, [adminCustomDesigns]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/custom-clothes-designs", {
          cache: "no-store",
        });
        const data = await res.json();
        const list = data?.data?.designs ?? [];
        if (cancelled) return;
        setAdminCustomDesigns(Array.isArray(list) ? list : []);
        setRemoteCustomDesigns(list);
      } catch {
        if (!cancelled) {
          setAdminCustomDesigns([]);
          setRemoteCustomDesigns([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMockups = useMemo(() => {
    if (lockedCategory?.id == null) return EMPTY_CATEGORY_MOCKUPS;
    return getMockupsForCategory(lockedCategory.id);
  }, [lockedCategory?.id]);

  const selectedMockup = useMemo(() => {
    if (!categoryMockups.length) return null;
    return (
      categoryMockups.find((m) => m.id === selectedMockupId) ??
      categoryMockups[0]
    );
  }, [categoryMockups, selectedMockupId]);

  useEffect(() => {
    setViewPlacements(createDefaultViewPlacements());
    setActiveView("front");
    setActiveLayerId(null);
    setDesignPick(new Set());
  }, [lockedCategory?.id]);

  useEffect(() => {
    if (lockedCategory?.id == null) {
      setSelectedMockupId(null);
      return;
    }
    const list = getMockupsForCategory(lockedCategory.id);
    setSelectedMockupId(list[0]?.id ?? null);
  }, [lockedCategory?.id]);

  const layers = viewPlacements[activeView]?.layers ?? [];

  useEffect(() => {
    if (!layers.length) return;
    const ok = layers.some((l) => l.id === activeLayerId);
    if (!ok) setActiveLayerId(layers[0].id);
  }, [activeView, layers, activeLayerId]);

  useEffect(() => {
    const id = pendingLayerSelectRef.current;
    if (id != null) {
      pendingLayerSelectRef.current = null;
      setActiveLayerId(id);
    }
  }, [viewPlacements]);

  const activeLayer =
    layers.find((l) => l.id === activeLayerId) ?? layers[0] ?? null;

  const layerHasContent = (l) =>
    Boolean(
      l &&
        (l.customImageDataUrl ||
          (l.designId && l.designId !== "none" && l.designId !== "upload") ||
          (l.designId === "upload" && l.customImageDataUrl))
    );

  const patchLayer = useCallback((viewKey, layerId, patch) => {
    setViewPlacements((p) => ({
      ...p,
      [viewKey]: {
        layers: (p[viewKey]?.layers ?? []).map((l) =>
          l.id === layerId ? { ...l, ...patch } : l
        ),
      },
    }));
  }, []);

  const patchActiveLayer = useCallback(
    (layerId, patch) => {
      patchLayer(activeView, layerId, patch);
    },
    [activeView, patchLayer]
  );

  const addUploadLayer = useCallback((dataUrl) => {
    setViewPlacements((p) => {
      const L = [...(p[activeView]?.layers ?? [])];
      const nl = createLayer("upload", L.length);
      nl.customImageDataUrl = dataUrl;
      nl.designId = "upload";
      pendingLayerSelectRef.current = nl.id;
      return { ...p, [activeView]: { layers: [...L, nl] } };
    });
  }, [activeView]);

  const toggleDesignPick = useCallback((designId) => {
    if (designId === "none") return;
    setDesignPick((prev) => {
      const next = new Set(prev);
      if (next.has(designId)) next.delete(designId);
      else next.add(designId);
      return next;
    });
  }, []);

  const addSelectedDesignsToActiveView = useCallback(() => {
    const ids = [...designPick];
    if (!ids.length) {
      message.info("Select one or more designs first.");
      return;
    }
    setViewPlacements((p) => {
      let L = [...(p[activeView]?.layers ?? [])];
      let lastId = null;
      for (const did of ids) {
        const nl = createLayer(did, L.length);
        L.push(nl);
        lastId = nl.id;
      }
      if (lastId) pendingLayerSelectRef.current = lastId;
      return { ...p, [activeView]: { layers: L } };
    });
    setDesignPick(new Set());
    message.success(`Added ${ids.length} print(s) to ${activeView}.`);
  }, [activeView, designPick]);

  const removeActiveLayer = useCallback(() => {
    if (!activeLayerId || !layers.length) return;
    setViewPlacements((p) => {
      const L = (p[activeView]?.layers ?? []).filter(
        (l) => l.id !== activeLayerId
      );
      const nextLayers =
        L.length > 0 ? L : [createLayer("none", 0)];
      return { ...p, [activeView]: { layers: nextLayers } };
    });
  }, [activeLayerId, activeView, layers.length]);

  const handleAddCustomToCart = useCallback(() => {
    if (!selectedFabric || !lockedCategory) return;
    const customization = buildCustomClothesPayload({
      fabricId: selectedFabric.id,
      categoryId: lockedCategory.id,
      categoryName: lockedCategory.name,
      mockupTemplateId: selectedMockup?.id ?? null,
      mockupTemplateName: selectedMockup?.name ?? "",
      viewPlacements,
    });
    addToCart(CUSTOM_CLOTHES_CART_PRODUCT, {
      size: lockedCategory.name,
      color: selectedFabric.id,
      quantity: 1,
      customization,
    });
    message.success(
      "Custom configuration added to your cart. Server sync requires a real product ID in the catalogue."
    );
  }, [
    addToCart,
    lockedCategory,
    selectedFabric,
    selectedMockup,
    viewPlacements,
  ]);

  const filteredFabrics = useMemo(() => {
    const q = fabricQuery.trim().toLowerCase();
    if (!q) return CLOTH_QUALITIES;
    return CLOTH_QUALITIES.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.hint.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
    );
  }, [fabricQuery]);

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return CUSTOM_CLOTHES_CATEGORIES;
    return CUSTOM_CLOTHES_CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.hint.toLowerCase().includes(q) ||
        String(c.id).includes(q)
    );
  }, [categoryQuery]);

  useEffect(() => {
    if (
      activeFabricId != null &&
      !filteredFabrics.some((f) => f.id === activeFabricId)
    ) {
      setActiveFabricId(null);
    }
  }, [filteredFabrics, activeFabricId]);

  useEffect(() => {
    if (
      activeCategoryId != null &&
      !filteredCategories.some((c) => c.id === activeCategoryId)
    ) {
      setActiveCategoryId(null);
    }
  }, [filteredCategories, activeCategoryId]);

  const confirmFabric = () => {
    const fabric = CLOTH_QUALITIES.find((f) => f.id === activeFabricId);
    if (!fabric) return;
    setSelectedFabric(fabric);
    setCategoryQuery("");
    setActiveCategoryId(null);
    setLockedCategory(null);
    setWizardStep(2);
  };

  const backToFabrics = () => {
    setSelectedFabric(null);
    setCategoryQuery("");
    setActiveCategoryId(null);
    setLockedCategory(null);
    setWizardStep(1);
  };

  const confirmCategory = () => {
    const cat = CUSTOM_CLOTHES_CATEGORIES.find((c) => c.id === activeCategoryId);
    if (!cat) return;
    setLockedCategory(cat);
    setWizardStep(3);
  };

  const backToCategories = () => {
    setLockedCategory(null);
    setWizardStep(2);
  };

  return (
    <div className="min-h-[70vh] bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-16 sm:py-20 md:py-24">
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Step {wizardStep} of 3
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
            Custom clothes
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            {wizardStep === 1 &&
              "Pick the fabric or cloth quality you want, then choose a category and design."}
            {wizardStep === 2 &&
              selectedFabric &&
              `Choose a category for your ${selectedFabric.name.toLowerCase()} piece. You can change fabric anytime.`}
            {wizardStep === 3 &&
              lockedCategory &&
              selectedFabric &&
              `Pick an admin-style garment mockup, then place one or more designs on the front and back of your ${lockedCategory.name.toLowerCase()} (${selectedFabric.name}). Artwork renders up to 2048px.`}
          </p>
        </header>

        <AnimatePresence mode="wait">
          {wizardStep === 1 ? (
            <motion.div
              key="step-fabric"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="mt-10 text-lg font-semibold text-neutral-900 dark:text-white">
                Cloth / fabric quality
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Select one option, then continue to categories.
              </p>

              <div className="mt-6 max-w-xl">
                <label htmlFor="fabric-search" className="sr-only">
                  Search fabric types
                </label>
                <div className="relative">
                  <IconSearch
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <input
                    id="fabric-search"
                    type="search"
                    value={fabricQuery}
                    onChange={(e) => setFabricQuery(e.target.value)}
                    placeholder="Search cotton, silk, blend…"
                    autoComplete="off"
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-11 text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/30"
                  />
                  {fabricQuery ? (
                    <button
                      type="button"
                      onClick={() => setFabricQuery("")}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      aria-label="Clear search"
                    >
                      <IconX className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {filteredFabrics.length} of {CLOTH_QUALITIES.length} fabric
                  types
                  {fabricQuery.trim() ? ` matching “${fabricQuery.trim()}”` : ""}
                </p>
              </div>

              {filteredFabrics.length === 0 ? (
                <div className="mt-10 rounded-xl border border-dashed border-neutral-300 bg-white/60 px-6 py-14 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">
                    No fabrics match your search
                  </p>
                  <button
                    type="button"
                    onClick={() => setFabricQuery("")}
                    className="mt-4 text-sm font-semibold text-neutral-900 underline dark:text-white"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <ul
                  className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  role="list"
                >
                  {filteredFabrics.map((f, index) => {
                    const selected = activeFabricId === f.id;
                    return (
                      <li key={f.id}>
                        <motion.button
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02, duration: 0.2 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setActiveFabricId((id) =>
                              id === f.id ? null : f.id
                            )
                          }
                          className={cardButtonClass(selected)}
                          aria-pressed={selected}
                        >
                          <span className="font-semibold text-base">
                            {f.name}
                          </span>
                          <span
                            className={
                              selected
                                ? "mt-1 block text-sm opacity-90"
                                : "mt-1 block text-sm text-neutral-500 dark:text-neutral-400"
                            }
                          >
                            {f.hint}
                          </span>
                        </motion.button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!activeFabricId}
                  onClick={confirmFabric}
                  className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Continue to categories
                </button>
                {!activeFabricId ? (
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Select a fabric to continue
                  </span>
                ) : null}
              </div>
            </motion.div>
          ) : wizardStep === 2 ? (
            <motion.div
              key="step-categories"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={backToFabrics}
                  className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                >
                  <IconArrowLeft className="h-4 w-4" aria-hidden />
                  Change fabric
                </button>
                <div className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Fabric:{" "}
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {selectedFabric?.name}
                  </span>
                </div>
              </div>

              <h2 className="mt-10 text-lg font-semibold text-neutral-900 dark:text-white">
                Clothing category
              </h2>

              <div className="mt-6 max-w-xl">
                <label htmlFor="custom-clothes-search" className="sr-only">
                  Search categories
                </label>
                <div className="relative">
                  <IconSearch
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <input
                    id="custom-clothes-search"
                    type="search"
                    value={categoryQuery}
                    onChange={(e) => setCategoryQuery(e.target.value)}
                    placeholder="Search by name, keyword, or #…"
                    autoComplete="off"
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-11 text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/30"
                  />
                  {categoryQuery ? (
                    <button
                      type="button"
                      onClick={() => setCategoryQuery("")}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      aria-label="Clear search"
                    >
                      <IconX className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Showing {filteredCategories.length} of{" "}
                  {CUSTOM_CLOTHES_CATEGORIES.length} categories
                  {categoryQuery.trim()
                    ? ` for “${categoryQuery.trim()}”`
                    : ""}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {filteredCategories.length === 0 ? (
                  <motion.div
                    key="empty-cat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-10 rounded-xl border border-dashed border-neutral-300 bg-white/60 px-6 py-14 text-center dark:border-neutral-700 dark:bg-neutral-900/40"
                  >
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">
                      No categories match your search
                    </p>
                    <button
                      type="button"
                      onClick={() => setCategoryQuery("")}
                      className="mt-4 text-sm font-semibold text-neutral-900 underline dark:text-white"
                    >
                      Clear search
                    </button>
                  </motion.div>
                ) : (
                  <motion.ul
                    key="grid-cat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    role="list"
                  >
                    {filteredCategories.map((cat, index) => {
                      const selected = activeCategoryId === cat.id;
                      return (
                        <li key={cat.id}>
                          <motion.button
                            type="button"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: index * 0.02,
                              duration: 0.25,
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              setActiveCategoryId((id) =>
                                id === cat.id ? null : cat.id
                              )
                            }
                            className={cardButtonClass(selected)}
                            aria-pressed={selected}
                          >
                            <span className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-base">
                                {cat.name}
                              </span>
                              <span
                                className={
                                  selected
                                    ? "text-xs opacity-80"
                                    : "text-xs text-neutral-400 dark:text-neutral-500"
                                }
                              >
                                #{cat.id}
                              </span>
                            </span>
                            <span
                              className={
                                selected
                                  ? "mt-1 block text-sm opacity-90"
                                  : "mt-1 block text-sm text-neutral-500 dark:text-neutral-400"
                              }
                            >
                              {cat.hint}
                            </span>
                          </motion.button>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!activeCategoryId}
                  onClick={confirmCategory}
                  className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Continue to design
                </button>
                {!activeCategoryId ? (
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Select a category to continue
                  </span>
                ) : null}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-flat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="mt-8"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <button
                  type="button"
                  onClick={backToCategories}
                  className="inline-flex w-fit items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                >
                  <IconArrowLeft className="h-4 w-4" aria-hidden />
                  Back to categories
                </button>
                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Fabric:{" "}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {selectedFabric?.name}
                    </span>
                  </div>
                  <div className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Category:{" "}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {lockedCategory?.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:items-start">
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                      Garment mockup
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      Five catalog styles per category (hardcoded placeholders for
                      admin-uploaded mockups). Hue shifts by category; your fabric
                      choice still tints the preview lightly.
                    </p>
                    <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                      {categoryMockups.map((m) => {
                        const picked = selectedMockup?.id === m.id;
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedMockupId(m.id)}
                              className={[
                                "flex w-full flex-col gap-2 rounded-xl border p-2 text-left transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
                                picked
                                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/80",
                              ].join(" ")}
                              aria-pressed={picked}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m.frontUrl}
                                alt=""
                                className="aspect-4/5 w-full rounded-lg bg-neutral-100 object-contain dark:bg-neutral-800"
                              />
                              <span className="text-xs font-semibold leading-tight">
                                {m.name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <FlatGarmentCustomizer
                    fabricId={selectedFabric?.id ?? "cotton"}
                    garmentFrontSrc={selectedMockup?.frontUrl ?? null}
                    garmentBackSrc={selectedMockup?.backUrl ?? null}
                    activeView={activeView}
                    onActiveViewChange={setActiveView}
                    layers={layers}
                    activeLayerId={activeLayerId}
                    onActiveLayerChange={setActiveLayerId}
                    onPatchLayer={patchActiveLayer}
                    onAddUploadLayer={addUploadLayer}
                    className="w-full"
                  />
                </div>

                <aside className="flex flex-col gap-6">
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                      Designs
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      Built-in patterns plus admin prints (from{" "}
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        Custom clothes prints
                      </span>{" "}
                      in the dashboard). Tick several, then add them on the{" "}
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {activeView === "front" ? "Front" : "Back"}
                      </span>{" "}
                      tab. Drop images on the mockup for extra uploads. Drag to
                      move; click a print for sliders.
                    </p>
                    <button
                      type="button"
                      onClick={addSelectedDesignsToActiveView}
                      disabled={designPick.size === 0}
                      className="mt-3 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900"
                    >
                      Add selected to {activeView === "front" ? "front" : "back"}{" "}
                      ({designPick.size})
                    </button>
                    <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                      {designPickerOptions.map((d) => {
                        const picked = designPick.has(d.id);
                        const disabled = d.id === "none";
                        return (
                          <li key={d.id}>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleDesignPick(d.id)}
                              className={[
                                "flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
                                disabled
                                  ? "cursor-not-allowed opacity-50"
                                  : picked
                                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/80",
                              ].join(" ")}
                              aria-pressed={picked}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={[
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                    picked
                                      ? "border-white bg-white dark:border-neutral-900 dark:bg-neutral-900"
                                      : "border-neutral-400 dark:border-neutral-500",
                                  ].join(" ")}
                                  aria-hidden
                                >
                                  {picked ? (
                                    <span className="text-[10px] text-neutral-900 dark:text-white">
                                      ✓
                                    </span>
                                  ) : null}
                                </span>
                                <DesignThumbnail designId={d.id} size={48} />
                              </span>
                              <span className="text-xs font-semibold leading-tight">
                                {d.name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Prints on {activeView} ({layers.length})
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {layers.map((l, idx) => (
                        <li key={l.id}>
                          <button
                            type="button"
                            onClick={() => setActiveLayerId(l.id)}
                            className={[
                              "rounded-lg border px-2 py-1 text-xs font-medium",
                              l.id === activeLayerId
                                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                                : "border-neutral-200 dark:border-neutral-600",
                            ].join(" ")}
                          >
                            #{idx + 1} ·{" "}
                            {designNameLookup.get(l.designId) ?? l.designId}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={removeActiveLayer}
                      disabled={!activeLayerId || layers.length <= 1}
                      className="mt-3 w-full rounded-lg border border-red-200 py-2 text-xs font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400"
                    >
                      Remove selected print
                    </button>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Selected print
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Sliders apply to the highlighted print on the mockup or in
                      the list above.
                    </p>

                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Scale</span>
                        <span>
                          {activeLayer ? activeLayer.scale.toFixed(2) : "—"}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.15}
                        max={1.1}
                        step={0.01}
                        value={activeLayer?.scale ?? 0.4}
                        disabled={!activeLayer || !layerHasContent(activeLayer)}
                        onChange={(e) =>
                          activeLayer &&
                          patchActiveLayer(activeLayer.id, {
                            scale: Number(e.target.value),
                          })
                        }
                        className="w-full accent-neutral-900 dark:accent-white"
                      />
                    </div>

                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Rotation</span>
                        <span>
                          {activeLayer ? `${activeLayer.rotationDeg}°` : "—"}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={activeLayer?.rotationDeg ?? 0}
                        disabled={!activeLayer || !layerHasContent(activeLayer)}
                        onChange={(e) =>
                          activeLayer &&
                          patchActiveLayer(activeLayer.id, {
                            rotationDeg: Number(e.target.value),
                          })
                        }
                        className="w-full accent-neutral-900 dark:accent-white"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!activeLayer || !layerHasContent(activeLayer)}
                      onClick={() => {
                        const d = createDefaultViewPlacements();
                        setViewPlacements((p) => ({
                          ...p,
                          [activeView]: { ...d[activeView] },
                        }));
                        const first = d[activeView].layers[0];
                        if (first) setActiveLayerId(first.id);
                      }}
                      className="mt-4 w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      Reset this side (front/back)
                    </button>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Cart
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Saves fabric, category, mockup style, and each view&apos;s
                      placement.
                      Large uploads may be omitted from the payload; keep files
                      under ~300KB base64 for full persistence. Replace{" "}
                      <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
                        custom-clothes-local
                      </code>{" "}
                      with a real product ID for server cart sync.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddCustomToCart}
                      className="mt-3 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      Add configuration to cart
                    </button>
                  </div>
                </aside>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
