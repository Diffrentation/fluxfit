"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ImageUploadZone from "./ImageUploadZone";
import {
  IconShirt,
  IconPalette,
  IconPrinter,
  IconPackage,
  IconNotes,
  IconSend,
  IconLoader2,
  IconChevronDown,
} from "@tabler/icons-react";
import axios from "axios";

const CLOTH_TYPES = [
  "T-Shirt",
  "Polo T-Shirt",
  "Hoodie",
  "Sweatshirt",
  "Shirt",
  "Jacket",
  "Tracksuit",
  "Tank Top",
  "Shorts",
  "Joggers",
];

const PRINT_PLACEMENTS = [
  { value: "front", label: "Front Only" },
  { value: "back", label: "Back Only" },
  { value: "left_sleeve", label: "Left Sleeve" },
  { value: "right_sleeve", label: "Right Sleeve" },
  { value: "front_back", label: "Front + Back" },
  { value: "full_custom", label: "Full Custom" },
];

const PRESET_COLORS = [
  { label: "White", hex: "#FFFFFF" },
  { label: "Black", hex: "#111827" },
  { label: "Navy Blue", hex: "#1e3a8a" },
  { label: "Royal Blue", hex: "#3b82f6" },
  { label: "Red", hex: "#ef4444" },
  { label: "Maroon", hex: "#7f1d1d" },
  { label: "Green", hex: "#16a34a" },
  { label: "Olive", hex: "#7c6f3d" },
  { label: "Yellow", hex: "#facc15" },
  { label: "Orange", hex: "#fb923c" },
  { label: "Purple", hex: "#a855f7" },
  { label: "Pink", hex: "#ec4899" },
  { label: "Grey", hex: "#9ca3af" },
  { label: "Charcoal", hex: "#374151" },
  { label: "Beige", hex: "#f5f5dc" },
  { label: "Brown", hex: "#92400e" },
];

const PLACEMENT_IMAGES_MAP = {
  front: ["front"],
  back: ["back"],
  left_sleeve: ["leftSleeve"],
  right_sleeve: ["rightSleeve"],
  front_back: ["front", "back"],
  full_custom: ["front", "back", "leftSleeve", "rightSleeve"],
};

const SIDE_LABELS = {
  front: "Front Design",
  back: "Back Design",
  leftSleeve: "Left Sleeve Design",
  rightSleeve: "Right Sleeve Design",
};

function getToken() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw || raw === "undefined" || raw === "null") return null;
  return raw.trim();
}

export default function CustomOrderForm({ onSubmitSuccess }) {
  const [clothType, setClothType] = useState("T-Shirt");
  const [clothColor, setClothColor] = useState(PRESET_COLORS[0]);
  const [customColorHex, setCustomColorHex] = useState("#FFFFFF");
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [printPlacement, setPrintPlacement] = useState("front");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [designImages, setDesignImages] = useState({
    front: null,
    back: null,
    leftSleeve: null,
    rightSleeve: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const activeSides = PLACEMENT_IMAGES_MAP[printPlacement] || ["front"];

  const handleColorSelect = (color) => {
    setClothColor(color);
    setUseCustomColor(false);
  };

  const handleCustomColorChange = (hex) => {
    setCustomColorHex(hex);
    setClothColor({ label: "Custom", hex });
    setUseCustomColor(true);
  };

  const handleImageChange = (side, url) => {
    setDesignImages((prev) => ({ ...prev, [side]: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      toast.error("Please log in to submit a custom order");
      return;
    }

    // Validate at least one image is uploaded for required sides
    const hasRequiredImage = activeSides.some((side) => designImages[side]);
    if (!hasRequiredImage) {
      toast.error("Please upload at least one design image");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/api/custom-orders",
        {
          clothType,
          clothColor,
          printPlacement,
          quantity,
          notes,
          designImages,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("🎉 Custom order submitted! We'll review it soon.");
        onSubmitSuccess?.();
        // Reset
        setClothType("T-Shirt");
        setClothColor(PRESET_COLORS[0]);
        setPrintPlacement("front");
        setQuantity(1);
        setNotes("");
        setDesignImages({ front: null, back: null, leftSleeve: null, rightSleeve: null });
      } else {
        toast.error(data.message || "Submission failed");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to submit order. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* ── LEFT PANEL: Configuration ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-6 shadow-sm backdrop-blur-sm space-y-6">
            {/* Cloth Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <IconShirt size={16} className="text-indigo-500" />
                Cloth Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CLOTH_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setClothType(type)}
                    className={[
                      "px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200 border",
                      clothType === type
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
                        : "bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
                    ].join(" ")}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <IconPalette size={16} className="text-indigo-500" />
                Cloth Color
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    title={color.label}
                    onClick={() => handleColorSelect(color)}
                    className={[
                      "w-8 h-8 rounded-full transition-all duration-200 border-2 hover:scale-110 focus:outline-none",
                      clothColor.hex === color.hex && !useCustomColor
                        ? "ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800 scale-110 border-white"
                        : "border-gray-200 dark:border-gray-600",
                    ].join(" ")}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
              {/* Custom color picker */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent p-0.5"
                    title="Pick custom color"
                  />
                  <label className="text-sm text-gray-500 dark:text-gray-400">
                    Custom color
                  </label>
                </div>
                {useCustomColor && (
                  <span
                    className="px-2 py-1 rounded-lg text-xs font-medium text-white shadow-sm"
                    style={{ backgroundColor: customColorHex }}
                  >
                    {customColorHex}
                  </span>
                )}
              </div>
              {/* Selected color preview */}
              <div
                className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
                style={{
                  borderColor: clothColor.hex + "44",
                  backgroundColor: clothColor.hex + "15",
                  color: clothColor.hex === "#FFFFFF" ? "#374151" : clothColor.hex,
                }}
              >
                <span
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: clothColor.hex }}
                />
                Selected: {clothColor.label}
              </div>
            </div>

            {/* Print Placement */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <IconPrinter size={16} className="text-indigo-500" />
                Print Placement
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRINT_PLACEMENTS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPrintPlacement(p.value)}
                    className={[
                      "px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200 border",
                      printPlacement === p.value
                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200 dark:shadow-purple-900/30"
                        : "bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20",
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <IconPackage size={16} className="text-indigo-500" />
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-lg font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  min={1}
                  max={10000}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 h-10 text-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10000, q + 1))}
                  className="w-10 h-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-lg font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  +
                </button>
                <span className="text-sm text-gray-400">pieces</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <IconNotes size={16} className="text-indigo-500" />
                Additional Notes{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="e.g. specific font request, special instructions…"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {notes.length}/1000
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL: Image Uploads ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-6 shadow-sm backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Design Images
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Upload your designs for the selected placement areas. Each image
              should be high-res (min 300 DPI recommended).
            </p>

            <div
              className={[
                "grid gap-4",
                activeSides.length === 1 ? "grid-cols-1" : "grid-cols-2",
              ].join(" ")}
            >
              {activeSides.map((side) => (
                <ImageUploadZone
                  key={side}
                  label={SIDE_LABELS[side]}
                  value={designImages[side]}
                  onChange={(url) => handleImageChange(side, url)}
                  side={side}
                />
              ))}
            </div>

            {/* Placement hint */}
            <div className="mt-4 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2.5">
              💡 Showing upload zones for:{" "}
              <strong>
                {PRINT_PLACEMENTS.find((p) => p.value === printPlacement)?.label}
              </strong>
              . Change your print placement to upload different sides.
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            className={[
              "w-full py-4 px-6 rounded-2xl text-base font-bold text-white transition-all duration-200 shadow-lg flex items-center justify-center gap-2",
              submitting
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200 dark:shadow-indigo-900/40",
            ].join(" ")}
          >
            {submitting ? (
              <>
                <IconLoader2 size={20} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <IconSend size={20} />
                Submit Custom Order
              </>
            )}
          </motion.button>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500 px-4">
            Your order will be reviewed by our team before production begins.
            You&apos;ll be notified of the status on this page.
          </p>
        </motion.div>
      </div>
    </form>
  );
}
