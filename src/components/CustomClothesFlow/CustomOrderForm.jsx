"use client";

import { useState, useEffect } from "react";
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
  IconX,
} from "@tabler/icons-react";
import axios from "axios";
import { blockAdminAction } from "@/lib/adminBlocker";

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

export default function CustomOrderForm({ onSubmitSuccess, previewImage = "", productName = "" }) {
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
  const [adminDesigns, setAdminDesigns] = useState([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const [imagePopupOpen, setImagePopupOpen] = useState(false);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const { data } = await axios.get("/api/custom-clothes-designs");
        if (data?.success) {
          setAdminDesigns(data.data.designs || []);
        }
      } catch (err) {
        console.error("Failed to load admin designs:", err);
      } finally {
        setLoadingDesigns(false);
      }
    };
    fetchDesigns();
  }, []);

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
    if (blockAdminAction()) return;

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
      {/* ── Product Reference Banner (when coming from product details) ─────── */}
      {previewImage && (
        <div className="mb-6 rounded-2xl border border-[#1e9a58]/30 bg-[#f4fbf7] p-4 flex items-center gap-4">
          {/* Clickable thumbnail → opens lightbox */}
          <button
            type="button"
            onClick={() => setImagePopupOpen(true)}
            className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0 shadow-sm group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#1e9a58]"
            title="Click to enlarge"
          >
            <img
              src={previewImage}
              alt={productName || "Product reference"}
              className="w-full h-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
            />
            {/* Zoom overlay */}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0zm-3-1h-2m-2 0H8m2-2v2m0 2v2" />
              </svg>
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1e9a58] uppercase tracking-wide mb-0.5">Customizing product</p>
            <p className="text-sm font-bold text-[#0d1c2f] truncate">{productName || "Selected product"}</p>
            <p className="text-xs text-gray-500 mt-0.5">Fill out the form below and upload your design artwork.</p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1e9a58] text-white">
              ✨ Custom Order
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* ── LEFT PANEL: Configuration ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm space-y-6">
            {/* Cloth Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0d1c2f] mb-3">
                <IconShirt size={16} className="text-[#1e9a58]" />
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
                        ? "bg-[#1e9a58] text-white border-[#1e9a58] shadow-md"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0d1c2f] mb-3">
                <IconPalette size={16} className="text-[#1e9a58]" />
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
                        ? "ring-2 ring-offset-2 ring-[#1e9a58] scale-110 border-white"
                        : "border-gray-200",
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
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0d1c2f] mb-3">
                <IconPrinter size={16} className="text-[#1e9a58]" />
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
                        ? "bg-[#1e9a58] text-white border-[#1e9a58] shadow-md"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0d1c2f] mb-3">
                <IconPackage size={16} className="text-[#1e9a58]" />
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-300 bg-gray-50 text-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
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
                  className="w-20 h-10 text-center rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1e9a58]"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10000, q + 1))}
                  className="w-10 h-10 rounded-xl border border-gray-300 bg-gray-50 text-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  +
                </button>
                <span className="text-sm text-gray-400">pieces</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0d1c2f] mb-3">
                <IconNotes size={16} className="text-[#1e9a58]" />
                Additional Notes{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="e.g. specific font request, special instructions…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e9a58] resize-none transition-colors"
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
          className="space-y-4 lg:space-y-6"
        >
          {/* Admin Designs Card */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-[#0d1c2f] mb-1">
              Design Library
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Drag and drop any of these templates into the upload zones below.
            </p>
            {loadingDesigns ? (
              <div className="flex justify-center p-4">
                <IconLoader2 size={24} className="animate-spin text-[#1e9a58]" />
              </div>
            ) : adminDesigns.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {adminDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="flex-shrink-0 w-24 h-24 relative rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden group cursor-pointer bg-gray-50 dark:bg-gray-700/50"
                    onClick={() => setPreviewModalImage(design.imageUrl)}
                  >
                    <img
                      src={design.imageUrl}
                      alt={design.name}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData("text/plain", design.imageUrl);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="w-full h-full object-contain p-1"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white text-center py-1 truncate px-1">
                        {design.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                No templates available right now.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-[#0d1c2f] mb-1">
              Design Images
            </h3>
            <p className="text-xs text-gray-500 mb-5">
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
            <div className="mt-4 text-xs font-medium text-[#1B8A4D] bg-[#e4f7ed] border border-[#bbf0d4] rounded-xl px-3 py-2.5">
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
              "w-full py-4 px-6 rounded-2xl text-base font-bold text-white transition-all duration-200 shadow-md flex items-center justify-center gap-2",
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#1e9a58] hover:bg-green-700",
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

      {/* Preview Modal */}
      {previewModalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewModalImage(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-3xl w-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded-full transition-colors z-10"
            >
              <IconX size={20} />
            </button>
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
              <img
                src={previewModalImage}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
            <div className="absolute bottom-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md">
              Drag this image to apply it
            </div>
            <img
              src={previewModalImage}
              alt="Drag Source"
              className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", previewImage);
                e.dataTransfer.effectAllowed = "copy";
              }}
            />
          </motion.div>
        </div>
      )}
      {/* Image Lightbox Popup */}
      {imagePopupOpen && previewImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setImagePopupOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setImagePopupOpen(false)}
              className="absolute top-3 right-3 z-10 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 rounded-full p-2 transition-colors shadow-sm"
              title="Close"
            >
              <IconX size={18} />
            </button>
            {/* Product name header */}
            {productName && (
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-semibold text-[#1e9a58] uppercase tracking-wide">Product Reference</p>
                <p className="text-base font-bold text-[#0d1c2f] truncate">{productName}</p>
              </div>
            )}
            {/* Full-size image */}
            <div className="p-4 flex items-center justify-center bg-gray-50">
              <img
                src={previewImage}
                alt={productName || "Product"}
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
            <div className="px-5 py-3 bg-white border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">This is your selected product for customization</p>
            </div>
          </motion.div>
        </div>
      )}
    </form>
  );
}
