"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { getDesignDataUrl } from "./designCanvas";

const FABRIC_HEX = {
  cotton: "#e8e4dc",
  normal: "#d4d0c8",
  "organic-cotton": "#eef2e6",
  linen: "#e6dfd0",
  silk: "#f0ebe4",
  wool: "#c9bfb5",
  denim: "#3d4f6f",
  "polyester-blend": "#c5c9d0",
  "jersey-knit": "#dcd8e0",
  "khadi-handloom": "#d9c9b0",
  velvet: "#4a3f55",
  performance: "#2a3238",
};

const VIEWS = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
];

function fabricFill(fabricId) {
  return FABRIC_HEX[fabricId] || FABRIC_HEX.cotton;
}

function GarmentSvg({ view, color }) {
  const stroke = "rgba(0,0,0,0.08)";
  const sw = 1.2;

  if (view === "front") {
    return (
      <svg
        viewBox="0 0 400 520"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <filter id="ff-soft" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="4"
              floodOpacity="0.14"
            />
          </filter>
        </defs>
        <path
          filter="url(#ff-soft)"
          fill={color}
          stroke={stroke}
          strokeWidth={sw}
          d="M200 100 C140 100 100 135 92 175 L78 215 L102 232 L138 190 L142 430 L258 430 L262 190 L298 232 L322 215 L308 175 C300 135 260 100 200 100 Z"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 400 520"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <filter id="fb-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodOpacity="0.14"
          />
        </filter>
      </defs>
      <path
        filter="url(#fb-soft)"
        fill={color}
        stroke={stroke}
        strokeWidth={sw}
        d="M200 92 C138 92 94 130 86 172 L72 212 L96 228 L132 186 L138 432 L262 432 L268 186 L304 228 L328 212 L314 172 C306 130 262 92 200 92 Z"
      />
    </svg>
  );
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function layerSrc(layer) {
  if (!layer) return null;
  if (layer.customImageDataUrl) return layer.customImageDataUrl;
  const id = layer.designId;
  if (!id || id === "none" || id === "upload") return null;
  const url = getDesignDataUrl(id, 2048);
  return url || null;
}

export default function FlatGarmentCustomizer({
  fabricId,
  /** When set, raster mockup (e.g. admin catalog) replaces vector garment for each view. */
  garmentFrontSrc = null,
  garmentBackSrc = null,
  activeView,
  onActiveViewChange,
  layers,
  activeLayerId,
  onActiveLayerChange,
  onPatchLayer,
  onAddUploadLayer,
  className = "",
}) {
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  const fill = fabricFill(fabricId);
  const rasterSrc =
    activeView === "front" ? garmentFrontSrc : garmentBackSrc;

  const onDropFiles = useCallback(
    (files) => {
      const f = files?.[0];
      if (!f || !f.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          onAddUploadLayer?.(result);
        }
      };
      reader.readAsDataURL(f);
    },
    [onAddUploadLayer]
  );

  const startDrag = useCallback(
    (layer, e) => {
      if (
        !layer ||
        (layer.designId === "none" && !layer.customImageDataUrl)
      ) {
        return;
      }
      onActiveLayerChange(layer.id);
      if (!boardRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const start = {
        layerId: layer.id,
        clientX: e.clientX,
        clientY: e.clientY,
        xPct: layer.xPct,
        yPct: layer.yPct,
      };
      dragRef.current = start;

      const move = (ev) => {
        const s = dragRef.current;
        if (!s || !boardRef.current) return;
        const r = boardRef.current.getBoundingClientRect();
        const dx = ((ev.clientX - s.clientX) / r.width) * 100;
        const dy = ((ev.clientY - s.clientY) / r.height) * 100;
        onPatchLayer(s.layerId, {
          xPct: clamp(s.xPct + dx, 8, 92),
          yPct: clamp(s.yPct + dy, 10, 90),
        });
      };

      const up = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [onActiveLayerChange, onPatchLayer]
  );

  const layerSources = useMemo(() => {
    const m = new Map();
    for (const layer of layers) {
      m.set(layer.id, layerSrc(layer));
    }
    return m;
  }, [layers]);

  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-neutral-100/90 dark:border-neutral-800 dark:bg-neutral-900/80 ${className}`}
    >
      <div className="flex flex-wrap gap-1 border-b border-neutral-200 p-2 dark:border-neutral-800">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onActiveViewChange(v.id)}
            className={[
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeView === v.id
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-white dark:text-neutral-400 dark:hover:bg-neutral-800",
            ].join(" ")}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div
        ref={boardRef}
        className={[
          "relative mx-auto aspect-4/5 max-h-[min(90vh,1040px)] w-full max-w-[min(100%,52rem)] p-5 sm:p-8 md:p-10",
          isOver ? "ring-2 ring-neutral-900 ring-offset-2 dark:ring-white" : "",
        ].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          onDropFiles(e.dataTransfer?.files);
        }}
      >
        <div className="pointer-events-none absolute inset-5 select-none sm:inset-8 md:inset-10">
          {rasterSrc ? (
            <div className="relative h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rasterSrc}
                alt=""
                className="h-full w-full object-contain object-center drop-shadow-md"
                draggable={false}
              />
              <div
                className="absolute inset-0 mix-blend-multiply dark:mix-blend-soft-light"
                style={{
                  backgroundColor: fill,
                  opacity: 0.22,
                }}
                aria-hidden
              />
            </div>
          ) : (
            <GarmentSvg view={activeView} color={fill} />
          )}
        </div>

        {layers.map((layer, i) => {
          const src = layerSources.get(layer.id);
          const show = Boolean(src);
          if (!show) return null;
          const selected = layer.id === activeLayerId;
          return (
            <button
              key={layer.id}
              type="button"
              className={[
                "absolute touch-none active:cursor-grabbing",
                selected
                  ? "z-20 cursor-grab ring-2 ring-neutral-900 ring-offset-2 dark:ring-white"
                  : "z-10 cursor-grab",
              ].join(" ")}
              style={{
                left: `${layer.xPct}%`,
                top: `${layer.yPct}%`,
                transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotationDeg}deg)`,
                width: "min(52%, 320px)",
                maxWidth: "52%",
              }}
              onPointerDown={(e) => startDrag(layer, e)}
              aria-label={`Print layer ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="pointer-events-none w-full drop-shadow-lg"
                draggable={false}
              />
            </button>
          );
        })}

        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-xs text-neutral-500 dark:text-neutral-400">
          HD garment · Drop image to add another print · Drag a print to move
        </p>
      </div>
    </div>
  );
}
