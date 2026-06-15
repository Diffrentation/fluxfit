"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import FlatGarmentCustomizer from "@/components/CustomClothes/FlatGarmentCustomizer";
import {
  CUSTOM_DESIGN_OPTIONS,
  DesignThumbnail,
  getDesignDataUrl,
  setRemoteCustomDesigns,
} from "@/components/CustomClothes/designCanvas";
import {
  buildCustomClothesPayload,
  createDefaultViewPlacements,
  createLayer,
} from "@/components/CustomClothes/customClothesConfig";
import { useCart } from "@/context/CartContext";

const COLOR_HEX_MAP = {
  white: "#ffffff",
  black: "#111827",
  blue: "#3b82f6",
  pink: "#ec4899",
  gray: "#9ca3af",
  grey: "#9ca3af",
  green: "#22c55e",
  beige: "#f5f5dc",
  brown: "#92400e",
  tan: "#d2b48c",
  silver: "#c0c0c0",
  gold: "#fbbf24",
  maroon: "#7f1d1d",
  red: "#ef4444",
  yellow: "#facc15",
  orange: "#fb923c",
  purple: "#a855f7",
  navy: "#1e3a8a",
};

function resolveColorSwatch(color) {
  const key = String(color || "").trim().toLowerCase();
  return COLOR_HEX_MAP[key] || key || "#d1d5db";
}

function extractImageUrl(image) {
  if (typeof image === "string") return image;
  if (image && typeof image === "object") {
    return image.url || image.secure_url || "";
  }
  return "";
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map(extractImageUrl).filter(Boolean);
}

function resolveVariantImage(variant) {
  if (!variant || typeof variant !== "object") return "";
  const firstImage = Array.isArray(variant.images) ? variant.images[0] : null;
  const candidate =
    variant.image ||
    variant.imageUrl ||
    variant.primaryImage?.url ||
    variant.primaryImage ||
    extractImageUrl(firstImage) ||
    "";
  return typeof candidate === "string" ? candidate : "";
}

function productForCart(product, fallbackImage) {
  return {
    id: product.id || product._id,
    _id: product._id || product.id,
    name: product.name || "Custom clothing",
    slug: product.slug || "custom-clothing",
    price: String(product.basePrice ?? product.price ?? 0),
    image: fallbackImage || null,
  };
}

export default function DesignEditor({ product }) {
  const { addToCart } = useCart();

  const [activeView, setActiveView] = useState("front");
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [viewPlacements, setViewPlacements] = useState(createDefaultViewPlacements);
  const [designPick, setDesignPick] = useState(() => new Set());
  const pendingLayerSelectRef = useRef(null);
  const [adminCustomDesigns, setAdminCustomDesigns] = useState([]);

  const colorImageMap = useMemo(() => {
    const map = {};
    for (const variant of product?.variants || []) {
      const color = String(variant?.color || "").trim().toLowerCase();
      const image = resolveVariantImage(variant);
      if (color && image && !map[color]) {
        map[color] = image;
      }
    }
    return map;
  }, [product?.variants]);

  const imageOptions = useMemo(() => {
    const base = normalizeImages(product?.images);
    const fromVariants = Object.values(colorImageMap || {});
    return [...new Set([...base, ...fromVariants])];
  }, [product?.images, colorImageMap]);

  const colorOptions = useMemo(() => {
    const fromProduct = Array.isArray(product?.colors)
      ? product.colors.map((c) => String(c).toLowerCase())
      : [];
    const fromVariants = Object.keys(colorImageMap);
    return [...new Set([...fromProduct, ...fromVariants])];
  }, [product?.colors, colorImageMap]);

  const [selectedColor, setSelectedColor] = useState(() => colorOptions[0] || "");
  const [selectedImage, setSelectedImage] = useState(() =>
    colorImageMap[colorOptions[0]] || imageOptions[0] || ""
  );
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (!colorOptions.length) {
      setSelectedColor("");
      return;
    }
    setSelectedColor((prev) =>
      colorOptions.includes(String(prev || "").toLowerCase())
        ? prev
        : colorOptions[0]
    );
  }, [colorOptions]);

  useEffect(() => {
    const byColor = colorImageMap[selectedColor];
    setSelectedImage(byColor || imageOptions[0] || "");
  }, [selectedColor, colorImageMap, imageOptions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/custom-clothes-designs", { cache: "no-store" });
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
    const m = new Map(CUSTOM_DESIGN_OPTIONS.map((d) => [d.id, d.name]));
    for (const d of adminCustomDesigns) {
      m.set(d.id, d.name);
    }
    m.set("upload", "Your upload");
    m.set("none", "No print");
    return m;
  }, [adminCustomDesigns]);

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

  const addUploadLayer = useCallback(
    (dataUrl) => {
      setViewPlacements((p) => {
        const L = [...(p[activeView]?.layers ?? [])];
        const nl = createLayer("upload", L.length);
        nl.customImageDataUrl = dataUrl;
        nl.designId = "upload";
        pendingLayerSelectRef.current = nl.id;
        return { ...p, [activeView]: { layers: [...L, nl] } };
      });
    },
    [activeView]
  );

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
      const L = (p[activeView]?.layers ?? []).filter((l) => l.id !== activeLayerId);
      const nextLayers = L.length > 0 ? L : [createLayer("none", 0)];
      return { ...p, [activeView]: { layers: nextLayers } };
    });
  }, [activeLayerId, activeView, layers.length]);

  const resolveLayerSnapshotSource = useCallback((layer) => {
    if (!layer) return "";
    if (layer.customImageDataUrl) return layer.customImageDataUrl;
    if (!layer.designId || layer.designId === "none" || layer.designId === "upload") {
      return "";
    }
    return getDesignDataUrl(layer.designId, 2048) || "";
  }, []);

  const loadImageForCanvas = useCallback((src) => {
    if (!src) return Promise.resolve(null);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }, []);

  const drawSimpleGarmentFallback = useCallback((ctx, width, height, fill) => {
    ctx.fillStyle = fill || "#d4d0c8";
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 2;

    const p = new Path2D();
    p.moveTo(width * 0.5, height * 0.16);
    p.bezierCurveTo(width * 0.35, height * 0.16, width * 0.25, height * 0.24, width * 0.23, height * 0.33);
    p.lineTo(width * 0.18, height * 0.42);
    p.lineTo(width * 0.24, height * 0.46);
    p.lineTo(width * 0.33, height * 0.36);
    p.lineTo(width * 0.35, height * 0.86);
    p.lineTo(width * 0.65, height * 0.86);
    p.lineTo(width * 0.67, height * 0.36);
    p.lineTo(width * 0.76, height * 0.46);
    p.lineTo(width * 0.82, height * 0.42);
    p.lineTo(width * 0.77, height * 0.33);
    p.bezierCurveTo(width * 0.75, height * 0.24, width * 0.65, height * 0.16, width * 0.5, height * 0.16);
    p.closePath();

    ctx.fill(p);
    ctx.stroke(p);
  }, []);

  const createCustomizationSnapshot = useCallback(async () => {
    const canvas = document.createElement("canvas");
    const width = 640;
    const height = 800;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return selectedImage || imageOptions[0] || "";

    ctx.clearRect(0, 0, width, height);

    const views = ["front", "back"];
    const bestView = views
      .map((view) => {
        const count = (viewPlacements[view]?.layers ?? []).filter((layer) =>
          Boolean(resolveLayerSnapshotSource(layer))
        ).length;
        return { view, count };
      })
      .sort((a, b) => b.count - a.count)[0]?.view || activeView;

    const layersForSnapshot = viewPlacements[bestView]?.layers ?? [];

    const garmentImg = await loadImageForCanvas(selectedImage || imageOptions[0] || "");

    if (garmentImg) {
      const scale = Math.min(width / garmentImg.width, height / garmentImg.height);
      const drawW = garmentImg.width * scale;
      const drawH = garmentImg.height * scale;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;
      ctx.drawImage(garmentImg, dx, dy, drawW, drawH);
    } else {
      drawSimpleGarmentFallback(ctx, width, height, resolveColorSwatch(selectedColor));
    }

    const layerSources = layersForSnapshot
      .map((layer) => ({ layer, src: resolveLayerSnapshotSource(layer) }))
      .filter((entry) => Boolean(entry.src));

    for (const entry of layerSources) {
      const img = await loadImageForCanvas(entry.src);
      if (!img) continue;

      const cx = (Number(entry.layer.xPct) / 100) * width;
      const cy = (Number(entry.layer.yPct) / 100) * height;
      const baseW = width * 0.52;
      const w = Math.max(20, baseW * (Number(entry.layer.scale) || 0.4));
      const h = w * (img.height / Math.max(1, img.width));
      const rotationRad = ((Number(entry.layer.rotationDeg) || 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotationRad);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    try {
      return canvas.toDataURL("image/jpeg", 0.86);
    } catch {
      return selectedImage || imageOptions[0] || "";
    }
  }, [
    activeView,
    drawSimpleGarmentFallback,
    imageOptions,
    loadImageForCanvas,
    resolveLayerSnapshotSource,
    selectedColor,
    selectedImage,
    viewPlacements,
  ]);

  /** Generate a compact thumbnail for storing in the order (smaller than cart preview). */
  const createAdminThumbnail = useCallback(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 375;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.clearRect(0, 0, 300, 375);

    const garmentImg = await loadImageForCanvas(selectedImage || imageOptions[0] || "");
    if (garmentImg) {
      const scale = Math.min(300 / garmentImg.width, 375 / garmentImg.height);
      const drawW = garmentImg.width * scale;
      const drawH = garmentImg.height * scale;
      ctx.drawImage(garmentImg, (300 - drawW) / 2, (375 - drawH) / 2, drawW, drawH);
    } else {
      drawSimpleGarmentFallback(ctx, 300, 375, resolveColorSwatch(selectedColor));
    }

    const frontLayers = (viewPlacements.front?.layers ?? [])
      .map((layer) => ({ layer, src: resolveLayerSnapshotSource(layer) }))
      .filter((e) => Boolean(e.src));

    for (const entry of frontLayers) {
      const img = await loadImageForCanvas(entry.src);
      if (!img) continue;
      const cx = (Number(entry.layer.xPct) / 100) * 300;
      const cy = (Number(entry.layer.yPct) / 100) * 375;
      const w = Math.max(10, 300 * 0.52 * (Number(entry.layer.scale) || 0.4));
      const h = w * (img.height / Math.max(1, img.width));
      const rot = ((Number(entry.layer.rotationDeg) || 0) * Math.PI) / 180;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    try {
      return canvas.toDataURL("image/jpeg", 0.7);
    } catch {
      return "";
    }
  }, [
    drawSimpleGarmentFallback,
    imageOptions,
    loadImageForCanvas,
    resolveLayerSnapshotSource,
    selectedColor,
    selectedImage,
    viewPlacements,
  ]);

  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);

    try {
      const [snapshotImage, adminThumbnail] = await Promise.all([
        createCustomizationSnapshot(),
        createAdminThumbnail(),
      ]);

      const customization = buildCustomClothesPayload({
        fabricId: selectedColor || "default",
        categoryId: product?.category?.id || product?.category?._id || null,
        categoryName: product?.category?.name || "",
        mockupTemplateId: product?.id || product?._id || null,
        mockupTemplateName: product?.name || "",
        viewPlacements,
      });

      // Attach compact preview for order/admin display
      if (adminThumbnail) {
        customization.previewDataUrl = adminThumbnail;
      }

      const success = addToCart(productForCart(product, snapshotImage || selectedImage), {
        size: "Custom",
        color: selectedColor || "default",
        quantity: 1,
        customization,
      });

      if (success !== false) {
        message.success("Custom design added to cart");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Product colors
          </h2>
          {colorOptions.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const active = String(selectedColor || "") === String(color || "");
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(String(color || "").toLowerCase())}
                    className={[
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                        : "border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: resolveColorSwatch(color) }}
                      aria-hidden
                    />
                    <span className="capitalize">{color}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              No color variants found.
            </p>
          )}

          {imageOptions.length ? (
            <ul className="mt-4 grid grid-cols-4 gap-2 md:grid-cols-6">
              {imageOptions.map((img) => {
                const active = selectedImage === img;
                return (
                  <li key={img}>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={[
                        "w-full overflow-hidden rounded-lg border",
                        active
                          ? "border-neutral-900 dark:border-white"
                          : "border-neutral-200 dark:border-neutral-700",
                      ].join(" ")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt="Garment option"
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <FlatGarmentCustomizer
          fabricId={selectedColor || "cotton"}
          garmentFrontSrc={selectedImage || null}
          garmentBackSrc={selectedImage || null}
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
            Select one or more designs and add them to {activeView}. You can drag and resize each print.
          </p>

          <button
            type="button"
            onClick={addSelectedDesignsToActiveView}
            disabled={designPick.size === 0}
            className="mt-3 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900"
          >
            Add selected to {activeView} ({designPick.size})
          </button>

          <div className="mt-4 max-h-88 overflow-y-auto pr-1">
            <ul className="grid grid-cols-2 auto-rows-[112px] gap-2">
              {designPickerOptions.map((d) => {
                const picked = designPick.has(d.id);
                const disabled = d.id === "none";
                return (
                  <li key={d.id} className="h-full">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleDesignPick(d.id)}
                      className={[
                        "flex h-full w-full flex-col gap-2 overflow-hidden rounded-xl border p-3 text-left transition-colors",
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
                            <span className="text-[10px] text-neutral-900 dark:text-white">✓</span>
                          ) : null}
                        </span>
                        <DesignThumbnail designId={d.id} size={48} />
                      </span>
                      <span className="text-xs font-semibold leading-tight">{d.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              Upload custom design
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string") {
                    addUploadLayer(reader.result);
                    message.success("Upload added");
                  }
                };
                reader.readAsDataURL(file);
                e.currentTarget.value = "";
              }}
              className="block w-full text-xs text-neutral-500 file:mr-2 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-2 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-700 dark:text-neutral-400 dark:file:bg-white dark:file:text-neutral-900"
            />
          </div>
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
                  #{idx + 1} · {designNameLookup.get(l.designId) ?? l.designId}
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
            Selected print controls
          </h3>

          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Horizontal</span>
              <span>{activeLayer ? `${Math.round(activeLayer.xPct)}%` : "—"}</span>
            </div>
            <input
              type="range"
              min={8}
              max={92}
              step={1}
              value={activeLayer?.xPct ?? 50}
              disabled={!activeLayer || !layerHasContent(activeLayer)}
              onChange={(e) =>
                activeLayer && patchActiveLayer(activeLayer.id, { xPct: Number(e.target.value) })
              }
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Vertical</span>
              <span>{activeLayer ? `${Math.round(activeLayer.yPct)}%` : "—"}</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              step={1}
              value={activeLayer?.yPct ?? 40}
              disabled={!activeLayer || !layerHasContent(activeLayer)}
              onChange={(e) =>
                activeLayer && patchActiveLayer(activeLayer.id, { yPct: Number(e.target.value) })
              }
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Scale</span>
              <span>{activeLayer ? activeLayer.scale.toFixed(2) : "—"}</span>
            </div>
            <input
              type="range"
              min={0.01}
              max={2.2}
              step={0.01}
              value={activeLayer?.scale ?? 0.4}
              disabled={!activeLayer || !layerHasContent(activeLayer)}
              onChange={(e) =>
                activeLayer && patchActiveLayer(activeLayer.id, { scale: Number(e.target.value) })
              }
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Rotation</span>
              <span>{activeLayer ? `${activeLayer.rotationDeg}°` : "—"}</span>
            </div>
            <input
              type="range"
              min={-360}
              max={360}
              step={1}
              value={activeLayer?.rotationDeg ?? 0}
              disabled={!activeLayer || !layerHasContent(activeLayer)}
              onChange={(e) =>
                activeLayer &&
                patchActiveLayer(activeLayer.id, { rotationDeg: Number(e.target.value) })
              }
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setViewPlacements(createDefaultViewPlacements());
              setActiveLayerId(null);
            }}
            className="mt-4 w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Reset design
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {isAddingToCart ? "Generating preview..." : "Add configuration to cart"}
        </button>
      </aside>
    </div>
  );
}
