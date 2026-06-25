/**
 * Serializable payload for custom clothing (local cart, API, orders).
 */

export const CUSTOM_CLOTHES_CONFIG_VERSION = 3;

export const VIEW_IDS = ["front", "back"];

let _uid = 0;
export function newLayerId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  _uid += 1;
  return `layer-${Date.now()}-${_uid}`;
}

/** One draggable print on a garment view. */
export function createLayer(designId, index = 0) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    id: newLayerId(),
    designId: designId ?? "none",
    customImageDataUrl: null,
    xPct: clampPct(48 + col * 10 - 10),
    yPct: clampPct(36 + row * 12),
    scale: 0.4,
    rotationDeg: 0,
  };
}

function clampPct(n) {
  return Math.min(88, Math.max(12, n));
}

export function createDefaultViewPlacements() {
  return {
    front: { layers: [createLayer("flux", 0)] },
    back: { layers: [createLayer("none", 0)] },
  };
}

function trimLayer(layer) {
  if (!layer) return null;
  const entry = {
    id: layer.id,
    designId: layer.designId ?? "none",
    xPct: Number(layer.xPct) || 50,
    yPct: Number(layer.yPct) || 40,
    scale: Number(layer.scale) || 0.4,
    rotationDeg: Number(layer.rotationDeg) || 0,
  };
  const url = layer.customImageDataUrl;
  if (typeof url === "string" && url.startsWith("data:") && url.length < 450000) {
    entry.customImageDataUrl = url;
  } else if (typeof url === "string" && url.length >= 450000) {
    entry.customUploadOmitted = true;
  }
  if (layer.designId === "text") {
    entry.text = layer.text || "";
    entry.font = layer.font || "sans-serif";
    entry.textColor = layer.textColor || "#000000";
  }
  return entry;
}

function trimViewsForStorage(views) {
  const out = {};
  for (const key of VIEW_IDS) {
    const v = views?.[key];
    if (!v?.layers || !Array.isArray(v.layers)) continue;
    out[key] = { layers: v.layers.map(trimLayer).filter(Boolean) };
  }
  return out;
}

export function buildCustomClothesPayload({
  fabricId,
  categoryId,
  categoryName,
  mockupTemplateId,
  mockupTemplateName,
  viewPlacements,
}) {
  const views = trimViewsForStorage(viewPlacements);
  const firstFront = views.front?.layers?.[0];
  return {
    type: "custom_clothes",
    version: CUSTOM_CLOTHES_CONFIG_VERSION,
    fabricId: fabricId ?? "",
    categoryId: categoryId ?? null,
    categoryName: categoryName ?? "",
    mockupTemplateId: mockupTemplateId ?? null,
    mockupTemplateName: mockupTemplateName ?? "",
    views,
    designId: firstFront?.designId ?? "none",
  };
}
