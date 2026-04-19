"use client";

import { useEffect, useRef } from "react";

/** Mongo ids / admin-uploaded designs — image URLs resolved here (Custom Clothes only). */
const remoteDesignUrlById = new Map();

export function setRemoteCustomDesigns(list) {
  remoteDesignUrlById.clear();
  if (!Array.isArray(list)) return;
  for (const d of list) {
    if (d?.id && d?.imageUrl) {
      remoteDesignUrlById.set(String(d.id), String(d.imageUrl));
    }
  }
}

function isExternalOrStaticAssetUrl(url) {
  if (!url || typeof url !== "string") return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/")
  );
}

export const CUSTOM_DESIGN_OPTIONS = [
  { id: "none", name: "No print", description: "Solid garment only" },
  { id: "flux", name: "Flux wordmark", description: "Bold logotype" },
  { id: "stripes", name: "Sport stripes", description: "Classic chest bands" },
  { id: "geo", name: "Geo blocks", description: "Modern color blocks" },
  { id: "waves", name: "Waves", description: "Fluid curves" },
  { id: "dots", name: "Dot grid", description: "Minimal pattern" },
  { id: "sunset", name: "Sunset gradient", description: "Warm blend" },
  { id: "mountain", name: "Mountain peak", description: "Outdoor vibe" },
];

/** Raster URL or high-res PNG data URL for presets (sharp when scaled on mockups). */
export function getDesignDataUrl(designId, size = 2048) {
  if (designId === "none") return "";
  const remote = remoteDesignUrlById.get(String(designId));
  if (remote && isExternalOrStaticAssetUrl(remote)) {
    return remote;
  }
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  drawDesignOnCanvas(ctx, size, size, designId);
  return canvas.toDataURL("image/png");
}

export function drawDesignOnCanvas(ctx, w, h, designId) {
  ctx.clearRect(0, 0, w, h);
  const pad = w * 0.06;

  switch (designId) {
    case "none":
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(0, 0, w, h);
      break;
    case "flux": {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#1a1a1a");
      g.addColorStop(1, "#404040");
      ctx.fillStyle = g;
      ctx.fillRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.fillStyle = "#fafafa";
      ctx.font = `900 ${Math.floor(h * 0.22)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("FLUX", w / 2, h / 2);
      break;
    }
    case "stripes": {
      ctx.fillStyle = "#f8f8f8";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#111";
      for (let i = 0; i < 5; i++) {
        const y = pad + i * ((h - pad * 2) / 5);
        ctx.fillRect(pad, y, w - pad * 2, (h - pad * 2) / 12);
      }
      ctx.fillStyle = "#c45c26";
      ctx.fillRect(pad, h * 0.35, w - pad * 2, h * 0.08);
      break;
    }
    case "geo": {
      ctx.fillStyle = "#1e3a5f";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#e85d4c";
      ctx.beginPath();
      ctx.moveTo(pad, pad);
      ctx.lineTo(w - pad, pad);
      ctx.lineTo(w * 0.55, h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f4c542";
      ctx.fillRect(w * 0.45, h * 0.45, w * 0.4, h * 0.35);
      break;
    }
    case "waves": {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0d9488");
      g.addColorStop(0.5, "#6366f1");
      g.addColorStop(1, "#a855f7");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = h * 0.04;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const base = h * 0.2 + i * h * 0.22;
        for (let x = 0; x <= w; x += 16) {
          ctx.lineTo(x, base + Math.sin(x * 0.02 + i) * h * 0.06);
        }
        ctx.stroke();
      }
      break;
    }
    case "dots": {
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#171717";
      const step = w / 14;
      for (let x = step; x < w; x += step) {
        for (let y = step; y < h; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, step * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "sunset": {
      const g = ctx.createRadialGradient(
        w * 0.35,
        h * 0.35,
        0,
        w * 0.5,
        h * 0.5,
        w * 0.65,
      );
      g.addColorStop(0, "#fde047");
      g.addColorStop(0.4, "#f97316");
      g.addColorStop(0.75, "#be123c");
      g.addColorStop(1, "#4c0519");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "mountain": {
      ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(pad, h - pad);
      ctx.lineTo(w * 0.35, h * 0.35);
      ctx.lineTo(w * 0.55, h * 0.5);
      ctx.lineTo(w - pad, h * 0.28);
      ctx.lineTo(w - pad, h - pad);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.42);
      ctx.lineTo(w * 0.42, h * 0.52);
      ctx.lineTo(w * 0.5, h * 0.45);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(pad, pad, w - pad * 2, h - pad * 2);
  }
}

export function DesignThumbnail({ designId, size = 56 }) {
  const ref = useRef(null);
  const preview = typeof window !== "undefined" ? getDesignDataUrl(designId, size) : "";
  const useImg = isExternalOrStaticAssetUrl(preview);

  useEffect(() => {
    if (useImg) return;
    const canvas = ref.current;
    if (!canvas) return;
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const px = Math.round(size * dpr);
    canvas.width = px;
    canvas.height = px;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    drawDesignOnCanvas(ctx, size, size, designId);
  }, [designId, size, useImg]);

  if (useImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={preview}
        alt=""
        width={size}
        height={size}
        className="rounded-lg border border-neutral-200 object-contain dark:border-neutral-700"
        draggable={false}
      />
    );
  }

  return (
    <canvas
      ref={ref}
      className="rounded-lg border border-neutral-200 dark:border-neutral-700"
      aria-hidden
    />
  );
}
