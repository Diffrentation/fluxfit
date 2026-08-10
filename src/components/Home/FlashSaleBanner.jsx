"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { IconBolt, IconClock } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";

function mapToCardProduct(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.salePrice,
    originalPrice: p.originalPrice,
    discount: p.discount,
    image: p.image,
    images: p.image ? [p.image] : [],
    inStock: p.stock > 0,
    stock: p.stock,
  };
}

function formatCountdown(seconds) {
  if (seconds <= 0) return "00:00:00";
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// The public /api/flash-sales endpoint has been real and working since the
// original audit — this was the missing storefront UI to actually surface
// it, so it only renders when a real, currently-running sale exists (no
// section shown at all otherwise, rather than faking one).
function FlashSaleBanner() {
  const router = useRouter();
  const [sale, setSale] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const load = useCallback(() => {
    axios
      .get("/api/flash-sales", { params: { limit: 1, sort: "ending-soon" } })
      .then(({ data }) => {
        if (!data?.success) return;
        const active = (data.data.flashSales || [])[0] || null;
        setSale(active);
        setSecondsLeft(active?.timeRemaining || 0);
      })
      .catch(() => setSale(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sale) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [sale]);

  if (!sale || secondsLeft <= 0 || sale.products.length === 0) return null;

  const handleQuickView = (product) => {
    router.push(`/product-details/${product.id}`);
  };

  return (
    <section className="w-full bg-gradient-to-r from-red-600 to-orange-500 py-6 sm:py-8 md:py-10 transition-colors duration-300">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <IconBolt className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight">
                {sale.name}
              </h2>
              {sale.description && (
                <p className="text-xs sm:text-sm text-white/80">{sale.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
            <IconClock className="w-4 h-4 text-white" />
            <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wider">
              {formatCountdown(secondsLeft)}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {sale.products.slice(0, 10).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <ProductCard
                product={mapToCardProduct(product)}
                onQuickView={handleQuickView}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FlashSaleBanner;
