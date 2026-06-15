"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconUpload,
  IconX,
  IconPhoto,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

export default function ImageUploadZone({ label, value, onChange, side }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const uploadFile = useCallback(
    async (file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Only JPG, PNG, WebP, GIF images are allowed");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`Image must be under ${MAX_SIZE_MB}MB`);
        return;
      }

      setUploading(true);
      setProgress(10);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", `fluxfit/custom-orders/${side}`);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 80) + 10);
          }
        };

        const result = await new Promise((resolve, reject) => {
          xhr.open("POST", "/api/upload/image");
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.onload = () => {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Invalid response"));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(formData);
        });

        setProgress(100);

        if (!result?.success || !result?.data?.url) {
          throw new Error(result?.message || "Upload failed");
        }

        onChange(result.data.url);
        toast.success(`${label} uploaded!`);
      } catch (err) {
        toast.error(err.message || "Upload failed");
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [label, onChange, side]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      
      const file = e.dataTransfer.files?.[0];
      if (file) {
        uploadFile(file);
        return;
      }

      // Check for dropped URL from another element
      const url = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list");
      if (url && typeof url === "string" && (url.startsWith("http") || url.startsWith("/"))) {
        onChange(url);
        toast.success(`${label} design applied!`);
      }
    },
    [uploadFile, onChange, label]
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative group overflow-hidden rounded-2xl border-2 border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 shadow-md"
          >
            <img
              src={value}
              alt={label}
              className="w-full h-40 object-contain p-2"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onChange(null)}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
              >
                <IconX size={16} />
              </button>
            </div>
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
              <IconCheck size={12} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={[
              "relative h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none",
              dragging
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]"
                : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-3 px-4 w-full">
                <IconLoader2 size={28} className="text-indigo-500 animate-spin" />
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Uploading {progress}%…
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <div className={`p-3 rounded-full transition-colors ${dragging ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-gray-100 dark:bg-gray-700"}`}>
                  {dragging ? (
                    <IconPhoto size={24} className="text-indigo-500" />
                  ) : (
                    <IconUpload size={24} className="text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {dragging ? "Drop here" : "Drop image or click"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    JPG, PNG, WebP · Max {MAX_SIZE_MB}MB
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
