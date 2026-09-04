"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import {
  IconHeart,
  IconShoppingCart,
  IconStar,
  IconStarFilled,
  IconMinus,
  IconPlus,
  IconArrowLeft,
  IconShare,
  IconTruck,
  IconShieldCheck,
  IconRefresh,
  IconCheck,
  IconArrowUp,
  IconThumbUp,
  IconActivity,
  IconBattery,
  IconBluetooth,
  IconLeaf,
  IconLock,
  IconFileDescription,
  IconStars,
  IconWiperWash,
  IconMedal,
  IconMoonStars,
  IconScissors,
  IconWashMachine,
  IconReceipt,
  IconPackage,
  IconShield,
  IconChevronDown,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Button, message, Spin } from "antd";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCustomDesign } from "@/context/CustomDesignContext";
import axios from "axios";
import GetInTouch from "@/components/GetInTouch/GetInTouch";
import ProductCard from "@/components/ui/ProductCard";
import AddCustomDesignButton from "@/components/product-detail/AddCustomDesignButton";
import {
  normalizeProductDetailForPage,
  normalizeProductForCard,
  findMatchingProductVariant,
  getVariantAwarePricing,
  getProductDetailPath,
} from "@/lib/publicProductsApi";

// Format price helper - prices are already in INR
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatShortDate = (date) =>
  date.toLocaleDateString("en-US", { day: "numeric", month: "short" });

// No real shipping-partner ETA API exists yet, so this is a fixed-offset
// illustration (order today -> ships tomorrow -> delivered in 4-8 days)
// computed from "now" rather than the previously hardcoded specific dates,
// so it no longer shows a fixed date range regardless of when it's viewed.
function getDeliveryEstimate() {
  const now = new Date();
  const addDays = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d;
  };
  return {
    orderPlaced: now,
    shipped: addDays(1),
    inTransit: addDays(2),
    deliveryStart: addDays(4),
    deliveryEnd: addDays(8),
  };
}

// Today's order cutoff for same/next-day dispatch — counts down for real
// instead of showing a frozen "02h : 45m : 12s" that never moves.
function getNextCutoff() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(18, 0, 0, 0);
  if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1);
  return cutoff;
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}h : ${m}m : ${s}s`;
}

function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [canHoverZoom, setCanHoverZoom] = useState(false);
  const imageContainerRef = useRef(null);
  const infoSectionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    setCanHoverZoom(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();


  const [otherProducts, setOtherProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPagination, setReviewsPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });
  const [reviewRatingFilter, setReviewRatingFilter] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [helpfulLoadingId, setHelpfulLoadingId] = useState(null);
  const [helpfulClickedMap, setHelpfulClickedMap] = useState({});
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submitReviewLoading, setSubmitReviewLoading] = useState(false);
  const [isReviewAuth, setIsReviewAuth] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [reviewImages, setReviewImages] = useState([]);
  const reviewImageInputRef = useRef(null);

  const deliveryEstimate = useMemo(() => getDeliveryEstimate(), []);
  const [cutoffMsRemaining, setCutoffMsRemaining] = useState(
    () => getNextCutoff() - new Date()
  );

  useEffect(() => {
    const tick = () => setCutoffMsRemaining(getNextCutoff() - new Date());
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const ratingOptions = [
    { label: "All Ratings", value: "" },
    { label: "5 stars", value: "5" },
    { label: "4 stars", value: "4" },
    { label: "3 stars", value: "3" },
    { label: "2 stars", value: "2" },
    { label: "1 star", value: "1" },
  ];
  const getIconComponent = useCallback((iconName) => {
    switch (iconName) {
      case "activity": return IconActivity;
      case "battery": return IconBattery;
      case "bluetooth": return IconBluetooth;
      case "leaf": return IconLeaf;
      case "wash_machine": return IconWashMachine;
      case "shield": return IconShield;
      case "star": return IconStar;
      case "droplet": return IconWiperWash; 
      case "sun": return IconMoonStars; 
      case "wind": return IconRefresh; 
      default: return IconActivity;
    }
  }, []);

  const [activeSection, setActiveSection] = useState("overview");

  const scrollToSection = (id) => {
    setActiveSection(id);
  };

  const isOtherThanCurrentProduct = (p, routeParam, excludeProduct) => {
    const pid = String(p._id || p.id || "");
    const rid = String(routeParam || "");
    if (excludeProduct) {
      const exId = String(excludeProduct._id || excludeProduct.id || "");
      if (pid === exId) return false;
      if (excludeProduct.slug && p.slug === excludeProduct.slug) return false;
    }
    if (pid === rid) return false;
    if (p.slug && p.slug === rid) return false;
    return true;
  };

  const getProductCategoryId = useCallback((productLike) => {
    const category = productLike?.category;
    return String(
      typeof category === "object" && category !== null
        ? category.id || category._id || ""
        : category || ""
    );
  }, []);

  const fetchRelatedProducts = useCallback(async (categoryId, signal, excludeProduct) => {
    try {
      const targetCount = 5;
      const currentCategoryId = String(categoryId || "");
      let selectedProducts = [];

      if (currentCategoryId) {
        const { data } = await axios.get(
          `/api/products?category=${encodeURIComponent(currentCategoryId)}&limit=${targetCount + 1}&status=active`,
          { signal }
        );
        if (data.success && Array.isArray(data.data?.products)) {
          selectedProducts = data.data.products
            .filter((p) => isOtherThanCurrentProduct(p, params.id, excludeProduct))
            .slice(0, targetCount);
        }
      }

      // Fill remaining cards from other categories only. This keeps products
      // from the current category first while avoiding a short recommendation row.
      if (selectedProducts.length < targetCount) {
        const { data } = await axios.get(
          `/api/products?limit=100&status=active`,
          { signal }
        );
        if (data.success && Array.isArray(data.data?.products)) {
          const selectedIds = new Set(
            selectedProducts.map((p) => String(p._id || p.id || ""))
          );
          const fallbackProducts = data.data.products.filter((p) => {
            const id = String(p._id || p.id || "");
            return (
              !selectedIds.has(id) &&
              isOtherThanCurrentProduct(p, params.id, excludeProduct) &&
              getProductCategoryId(p) !== currentCategoryId
            );
          });
          selectedProducts = [...selectedProducts, ...fallbackProducts].slice(0, targetCount);
        }
      }

      setRelatedProducts(
        selectedProducts.map((p) => normalizeProductForCard(p)).filter(Boolean)
      );
    } catch (error) {
      if (axios.isCancel?.(error) || error.name === "CanceledError") return;
      console.error("Failed to fetch related products", error);
    }
  }, [getProductCategoryId, params.id]);

  useEffect(() => {
    const ac = new AbortController();
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/products/${params.id}`, {
          signal: ac.signal,
        });
        if (data.success && data.data?.product) {
          const productData = data.data.product;
          const normalized = normalizeProductDetailForPage(productData);
          setProduct(normalized);
          
          const paramSize = searchParams.get('size');
          const paramColor = searchParams.get('color');
          const paramQty = searchParams.get('qty');

          setSelectedSize(paramSize || normalized.sizes?.[0] || "One Size");
          setSelectedColor(paramColor || normalized.colors?.[0] || "");
          if (paramQty) {
            setQuantity(parseInt(paramQty, 10) || 1);
          }

          const cat = productData.category;
          const categoryId =
            typeof cat === "object" && cat !== null
              ? cat.id || cat._id
              : cat;
          fetchRelatedProducts(categoryId, ac.signal, productData);
        } else {
          message.error("Product not found");
          setProduct(null);
        }
      } catch (error) {
        if (axios.isCancel?.(error) || error.name === "CanceledError") return;
        console.error("Failed to fetch product:", error);
        if (error.response?.status === 404) {
          setProduct(null);
          message.error("Product not found");
        } else {
          message.error("Failed to load product details");
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProduct();
    return () => ac.abort();
  }, [fetchRelatedProducts, params.id]);

  useEffect(() => {
    if (!product?.id) return;
    // Silently no-op for guests (endpoint requires auth) — recently-viewed
    // tracking is per-account, not per-browser.
    axios
      .post("/api/recently-viewed", { productId: product.id })
      .catch(() => {});
  }, [product]);

  const fetchOtherProducts = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/products?limit=8&status=active`);
      if (data.success && Array.isArray(data.data?.products)) {
        setOtherProducts(
          data.data.products
            .filter((p) => isOtherThanCurrentProduct(p, params.id, product))
            .map((p) => normalizeProductForCard(p))
            .filter(Boolean)
        );
      }
    } catch (error) {
      console.error("Failed to fetch other products", error);
    }
  }, [params.id, product]);

  useEffect(() => {
    if (params.id) fetchOtherProducts();
  }, [fetchOtherProducts, params.id]);

  const fetchReviews = useCallback(async () => {
    if (!product?.id) return;
    try {
      setReviewsLoading(true);
      const { data } = await axios.get("/api/reviews", {
        params: {
          productId: product.id,
          page: reviewsPagination.page,
          limit: reviewsPagination.limit,
          rating: reviewRatingFilter || undefined,
          search: reviewSearch || undefined,
        },
      });

      if (data?.success) {
        const nextReviews = data.reviews || data.data?.reviews || [];
        const pagination = data.data?.pagination || {};
        setReviews(nextReviews);
        setReviewsPagination((prev) => ({
          ...prev,
          total: pagination.total || 0,
          totalPages: pagination.totalPages || 1,
        }));
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [product?.id, reviewsPagination.page, reviewsPagination.limit, reviewRatingFilter, reviewSearch]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsReviewAuth(!!token && token !== "undefined" && token !== "null");
    }
  }, []);

  const handleMarkHelpful = useCallback(
    async (reviewId) => {
      if (!reviewId || helpfulClickedMap[reviewId]) return;
      const token = localStorage.getItem("token");
      if (!token) {
        message.warning("Please login to mark reviews as helpful");
        return;
      }

      const previous = reviews;
      setHelpfulLoadingId(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                helpful: {
                  ...(r.helpful || {}),
                  count: (r.helpful?.count || 0) + 1,
                },
              }
            : r
        )
      );

      try {
        const { data } = await axios.post(
          `/api/reviews/${reviewId}/helpful`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (data?.success) {
          // Reconcile with the server's real count instead of trusting the
          // optimistic +1 — if this was already marked helpful earlier
          // (e.g. a stale click after a previous success), the server
          // doesn't increment again and the optimistic bump above would
          // otherwise stay applied, permanently overcounting by 1.
          const serverCount = data.data?.review?.helpful?.count;
          if (serverCount !== undefined) {
            setReviews((prev) =>
              prev.map((r) =>
                r.id === reviewId
                  ? { ...r, helpful: { ...(r.helpful || {}), count: serverCount } }
                  : r
              )
            );
          }
          setHelpfulClickedMap((prev) => ({ ...prev, [reviewId]: true }));
          message.success(data.message || "Marked as helpful");
        } else {
          setReviews(previous);
          message.error("Failed to mark as helpful");
        }
      } catch (error) {
        setReviews(previous);
        message.error(error?.response?.data?.message || "Failed to mark as helpful");
      } finally {
        setHelpfulLoadingId(null);
      }
    },
    [helpfulClickedMap, reviews]
  );

  const handleReviewImageSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = 5 - reviewImages.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReviewImages((prev) => [...prev, { file, dataUrl: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, [reviewImages.length]);

  const handleRemoveReviewImage = useCallback((index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmitReview = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") {
      message.warning("Please login to write a review");
      return;
    }
    if (!product?.id) return;
    if (!newReviewComment.trim()) {
      message.error("Review comment is required");
      return;
    }
    if (newReviewRating < 1 || newReviewRating > 5) {
      message.error("Rating must be between 1 and 5");
      return;
    }

    try {
      setSubmitReviewLoading(true);
      const { data } = await axios.post(
        `/api/products/${product.id}/reviews`,
        {
          rating: Number(newReviewRating),
          comment: newReviewComment.trim(),
          images: reviewImages.map((img) => img.dataUrl),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data?.success) {
        setNewReviewComment("");
        setNewReviewRating(5);
        setReviewImages([]);
        message.success(
          data.message || "Review submitted. It will be visible after admin approval."
        );
        fetchReviews();
      } else {
        message.error("Failed to submit review");
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitReviewLoading(false);
    }
  }, [fetchReviews, newReviewComment, newReviewRating, product?.id, reviewImages]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const selectedVariant = useMemo(
    () =>
      findMatchingProductVariant(
        product?.variants,
        selectedSize,
        selectedColor
      ),
    [product?.variants, selectedSize, selectedColor]
  );

  const displayPricing = useMemo(
    () => getVariantAwarePricing(product, selectedVariant),
    [product, selectedVariant]
  );

  const handleSizeSelect = (size) => {
    // Size is the axis the shopper just picked, so it wins; color adapts to
    // whatever's actually sold in that size, shifting price/photos with it.
    const variant = findMatchingProductVariant(product?.variants, size, selectedColor, { prefer: "size" });
    setSelectedSize(size);
    if (variant?.color !== undefined) setSelectedColor(variant.color || "");
    const tempPricing = getVariantAwarePricing(product, variant);
    if (!tempPricing.inStock) {
      message.warning(`The selected variant (${size}, ${variant?.color || selectedColor || "default"}) is out of stock.`);
    }
  };

  const handleColorSelect = (color) => {
    // Color is the axis the shopper just picked, so it wins; size adapts to
    // whatever's actually sold in that color, shifting price/photos with it.
    const variant = findMatchingProductVariant(product?.variants, selectedSize, color, { prefer: "color" });
    setSelectedColor(color);
    if (variant?.size !== undefined) setSelectedSize(variant.size || "");
    const tempPricing = getVariantAwarePricing(product, variant);
    if (!tempPricing.inStock) {
      message.warning(`The selected variant (${variant?.size || selectedSize || "One Size"}, ${color}) is out of stock.`);
    }
  };

  const handleQuickView = (p) => {
    router.push(getProductDetailPath(p));
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!displayPricing.inStock) {
      if (!product.inStock || product.stock === 0) {
        message.error(`Sorry, ${product.name} is completely out of stock.`);
      } else {
        message.error(`Sorry, the selected variant (${selectedSize}, ${selectedColor}) is out of stock.`);
      }
      return;
    }

    const success = addToCart(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: displayPricing.price,
        image: product.images?.[0],
        images: product.images,
      },
      {
        size: selectedSize || "One Size",
        color: selectedColor || "default",
        quantity,
      }
    );
    if (success === false) return;
    message.success("Added to cart");
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (!displayPricing.inStock) {
      if (!product.inStock || product.stock === 0) {
        message.error(`Sorry, ${product.name} is completely out of stock.`);
      } else {
        message.error(`Sorry, the selected variant (${selectedSize}, ${selectedColor}) is out of stock.`);
      }
      return;
    }

    // Buy Now is a direct checkout for this product/variant only — it never
    // calls addToCart, never touches localStorage["cart"], and never syncs
    // or clears the server cart. The checkout page re-fetches and
    // re-validates the product/variant/price/stock from the DB itself.
    const params = new URLSearchParams({
      mode: "buy-now",
      productId: String(product.id),
      quantity: String(quantity),
    });
    if (selectedSize) params.set("size", selectedSize);
    if (selectedColor) params.set("color", selectedColor);
    router.push(`/checkout?${params.toString()}`);
  };

  const getVariantImage = (variant) => {
    if (!variant || typeof variant !== "object") return "";

    const firstImage = Array.isArray(variant.images) ? variant.images[0] : null;
    const candidate =
      variant.image ||
      variant.imageUrl ||
      variant.primaryImage?.url ||
      variant.primaryImage ||
      (typeof firstImage === "string" ? firstImage : firstImage?.url) ||
      "";

    return typeof candidate === "string" ? candidate : "";
  };

  const variantImageUrl = product ? getVariantImage(selectedVariant) : "";
  const displayImages = useMemo(() => {
    // Prefer the selected variant's own photos so the gallery reflects only
    // the size/color the shopper picked, not every variant's images merged.
    const variantImages = Array.isArray(selectedVariant?.images)
      ? selectedVariant.images.filter((url) => typeof url === "string" && url)
      : [];
    if (variantImages.length > 0) return variantImages;

    // Legacy variants without their own gallery fall back to the product's
    // full image set, at least leading with the variant's resolved image.
    const base = product?.images || [];
    if (variantImageUrl && !base.includes(variantImageUrl)) {
      return [variantImageUrl, ...base];
    }
    return base;
  }, [selectedVariant, variantImageUrl, product?.images]);

  // Jump back to the variant's own image (or the first shot) whenever the
  // selected variant changes, so the gallery doesn't keep showing an image
  // for a color/size the shopper is no longer looking at.
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant?._id, selectedVariant?.sku]);

  const handleImageMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  const handleAddCustomDesign = () => {
    if (!product) return;

    // Build the product preview image URL to pass along to the custom clothes page
    const previewImageUrl =
      product.images?.[selectedImage] ||
      product.images?.[0] ||
      "";

    const customProductId = product.id || product._id || params?.id;

    if (!customProductId) {
      message.error("Unable to open custom design for this product");
      return;
    }

    // Redirect to the custom-clothes order form with the product image as a reference
    const url = new URL("/custom-clothes", window.location.origin);
    if (previewImageUrl) url.searchParams.set("previewImage", previewImageUrl);
    url.searchParams.set("productName", product.name || "");
    router.push(url.pathname + url.search);
  };

  const scrollToTop = () => {
    const smoother = ScrollSmoother.get?.();
    if (smoother) {
      smoother.scrollTo(0, true);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const productWishlisted = product ? isInWishlist(product.id) : false;

  const toggleWishlist = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      message.success("Removed from wishlist");
    } else {
      const success = addToWishlist({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: displayPricing.price,
        image: product.images?.[0],
        images: product.images,
        originalPrice: displayPricing.originalPrice ?? product.originalPrice,
        discount: displayPricing.discountPercent ?? product.discount,
      });
      if (success !== false) {
        message.success("Added to wishlist");
      }
    }
  };

  const colorMap = {
    white: "bg-white border-2 border-gray-300",
    black: "bg-black",
    blue: "bg-blue-500",
    pink: "bg-pink-500",
    gray: "bg-gray-400",
    green: "bg-green-500",
    beige: "bg-amber-100",
    brown: "bg-amber-800",
    tan: "bg-amber-200",
    silver: "bg-gray-300",
    gold: "bg-yellow-400",
    "sky blue": "bg-sky-400",
    olive: "bg-olive-500",
    maroon: "bg-red-900",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 pt-10">
        <Spin size="large" />
        <p className="text-gray-600 text-sm">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 pt-10 px-4">
        <p className="text-gray-800">Product not found</p>
        <Button type="primary" onClick={() => router.push("/product-list")}>
          Browse products
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-28 lg:pt-32 relative overflow-hidden">
      
      {/* Background Decor Elements */}
      <div className="absolute top-10 right-10 grid grid-cols-4 gap-3 opacity-20 pointer-events-none z-0">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-2 h-2 bg-[#1e9a58] rounded-full"></div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[300px] pointer-events-none opacity-40 z-0">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
          <path fill="#eaf5ef" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,165.3C672,171,768,213,864,224C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path fill="#f4fbf7" fillOpacity="0.5" d="M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,213C672,213,768,203,864,197.3C960,192,1056,192,1152,208C1248,224,1344,256,1392,272L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 py-6 relative z-10"
      >
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-600 mb-4 max-w-full"
        >
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ x: -2 }}
            className="hover:text-gray-900 transition-colors shrink-0"
          >
            Home
          </motion.button>
          <span className="shrink-0">/</span>
          <span className="text-gray-900 shrink-0">{product.category || "—"}</span>
          <span className="shrink-0">/</span>
          <span className="text-gray-900 break-words">{product.name}</span>
        </motion.div>
        {/* Main Product Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-md p-6 lg:p-8 mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 relative items-start">
            {/* Left Column (Image Gallery) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 lg:sticky lg:top-24"
            >
              {/* Thumbnail rail: below main image on mobile, left of it from sm+ */}
              {displayImages.length > 1 && (
                <div className="flex sm:flex-col gap-2 sm:gap-3 overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto sm:max-h-[600px] lg:max-h-[750px] pb-1 sm:pb-0 sm:pr-1">
                  {displayImages.map((img, idx) => (
                    <button
                      key={img + idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] border-2 overflow-hidden bg-[#fafcfb] transition-all ${
                        selectedImage === idx
                          ? "border-[#1e9a58] ring-1 ring-[#1e9a58]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      aria-label={`View image ${idx + 1}`}
                      aria-pressed={selectedImage === idx}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image with zoom */}
              <div
                ref={imageContainerRef}
                data-testid="pdp-main-image"
                onMouseEnter={() => canHoverZoom && setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={canHoverZoom ? handleImageMouseMove : undefined}
                className="relative w-full sm:flex-1 bg-[#fafcfb] rounded-[32px] p-0 flex flex-col items-center justify-center h-[420px] sm:h-[600px] lg:h-[750px] overflow-hidden shrink-0"
              >
                {displayPricing.discountPercent > 0 && (
                  <div className="absolute top-6 left-6 z-20 bg-[#1e9a58] text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm">
                    -{displayPricing.discountPercent}%
                  </div>
                )}

                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={displayImages[selectedImage] || displayImages[0]}
                    alt={product.name}
                    fill
                    className="object-cover drop-shadow-2xl rounded-[32px]"
                    priority
                  />
                </motion.div>

                {/* Lens over the image for desktop */}
                {canHoverZoom && isZooming && (
                  <div
                    className="hidden lg:block absolute pointer-events-none bg-blue-400/20 border border-blue-400/50"
                    style={{
                      width: '20%',
                      height: '20%',
                      left: `${zoomPos.x}%`,
                      top: `${zoomPos.y}%`,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                    }}
                  />
                )}

                {/* Fallback internal hover magnifier for tablet (sm but not lg) */}
                {canHoverZoom && isZooming && (
                  <div
                    data-testid="pdp-zoom-overlay"
                    className="hidden sm:block lg:hidden absolute inset-0 pointer-events-none bg-no-repeat rounded-[32px] z-10"
                    style={{
                      backgroundImage: `url(${displayImages[selectedImage] || displayImages[0]})`,
                      backgroundSize: "400%",
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    }}
                  />
                )}
              </div>

              {/* Amazon-style Magnifier Box for lg screens */}
              {canHoverZoom && isZooming && (
                <div
                  className="hidden lg:block absolute z-[100] bg-white border border-gray-100 shadow-2xl rounded-[32px] pointer-events-none overflow-hidden"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: '105%',
                    width: '500px',
                    height: '600px',
                    backgroundImage: `url(${displayImages[selectedImage] || displayImages[0]})`,
                    backgroundSize: "500%",
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundRepeat: "no-repeat"
                  }}
                />
              )}
            </motion.div>

            {/* Right Column (Info) */}
            <motion.div
              ref={infoSectionRef}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: (canHoverZoom && isZooming) ? 0 : 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:col-span-6 flex flex-col space-y-6 relative z-0"
            >
              {/* Badges Row */}
              <div className="flex items-center justify-between">
                {product.isPopular ? (
                  <div className="inline-flex items-center gap-1.5 bg-[#e4f7ed] text-[#1e9a58] px-3 py-1.5 rounded-full text-sm font-bold">
                    <IconStarFilled className="w-4 h-4" />
                    Best Seller
                  </div>
                ) : product.isNew ? (
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-sm font-bold">
                    <IconStarFilled className="w-4 h-4" />
                    New Arrival
                  </div>
                ) : (
                  <span />
                )}
                <button
                  onClick={toggleWishlist}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow-sm transition-all"
                >
                  <IconHeart className={`w-5 h-5 ${productWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                </button>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#0d1c2f] mb-2 leading-tight break-words">
                  {product.name}
                </h1>
                <p className="text-gray-500 text-base">
                  {product.description?.length > 80 ? product.description.substring(0, 80) + "..." : product.description || "Premium quality. Unmatched comfort."}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                {(product.rating?.count || 0) > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <IconStarFilled
                          key={i}
                          className={`w-5 h-5 ${i < Math.round(product.rating.average) ? "text-[#1e9a58]" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                      <span className="text-[#1e9a58] font-bold">{product.rating.average.toFixed(1)}</span>
                      <span className="text-gray-300">|</span>
                      <span>{product.rating.count} review{product.rating.count === 1 ? "" : "s"}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-gray-400 font-medium">No reviews yet</span>
                )}
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-3 sm:gap-4 py-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0d1c2f]">
                  ₹{formatPrice(displayPricing.price)}
                </span>
                {displayPricing.originalPrice != null && (
                  <span className="text-lg sm:text-xl font-bold text-gray-400 line-through">
                    ₹{formatPrice(displayPricing.originalPrice)}
                  </span>
                )}
              </div>


              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="py-2 flex items-center gap-4">
                  <div className="text-sm font-bold text-[#0d1c2f]">
                    Color: <span className="text-gray-500 font-medium ml-1 capitalize">{selectedColor || product.colors[0]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor === color;
                      // Detect if the color value is a hex code or a name
                      const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim());
                      const bgStyle = isHex ? { backgroundColor: color } : {};
                      const bgClass = !isHex ? (colorMap[color.toLowerCase()] || "bg-gray-300") : "";
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${
                            isSelected
                              ? "ring-2 ring-[#1e9a58] ring-offset-2 scale-110 border-white"
                              : "border-gray-200 hover:scale-105"
                          } ${bgClass}`}
                          style={bgStyle}
                          aria-label={color}
                          title={color}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && product.sizes[0] !== "One Size" && (
                <div className="py-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-[#0d1c2f]">Size</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        className={`px-4 py-2 border-2 rounded-lg font-bold text-sm transition-all ${
                          selectedSize === size
                            ? "border-[#1e9a58] bg-[#f4fbf7] text-[#1e9a58]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5K Challenge Badge */}
              <div className="py-3 w-full">
                <div className="w-full bg-[#f4fbf7] border border-[#1e9a58] rounded-xl p-3 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl shrink-0">🔥</span>
                  <div>
                    <h4 className="font-bold text-[#1e9a58] text-sm">5K Challenge Eligible</h4>
                    <p className="text-xs text-gray-500 font-medium">Get 100% Cashback. <a href="/5k-challenge" className="underline font-bold text-[#1e9a58]">Learn more</a></p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 w-full">
                <button
                  onClick={handleAddToCart}
                  disabled={!displayPricing.inStock}
                  className="w-full h-12 sm:h-14 bg-[#1e9a58] hover:bg-green-700 text-white font-bold text-sm sm:text-lg rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 border-none transition-colors disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {displayPricing.inStock && <IconShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />}
                  {displayPricing.inStock ? "Add to Cart" : "Out of Stock"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!displayPricing.inStock}
                  className="w-full h-12 sm:h-14 bg-white border border-[#1e9a58] text-[#1e9a58] hover:bg-[#e4f7ed] font-bold text-sm sm:text-lg rounded-xl transition-colors disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50"
                >
                  {displayPricing.inStock ? "Buy Now" : "Out of Stock"}
                </button>
              </div>
              {product?.isCustomizable && (
                <div className="pt-3 w-full">
                  <button
                    onClick={handleAddCustomDesign}
                    className="w-full h-14 bg-[#1e9a58] hover:bg-green-700 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 border-none shadow-md shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-200 transform hover:scale-[1.01]"
                  >
                    <IconScissors className="w-5 h-5 sm:w-6 sm:h-6" />
                    Customize Design
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom Benefits Bar */}
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <IconTruck className="w-8 h-8 text-[#1e9a58]" />
              <div>
                <p className="text-sm font-bold text-[#0d1c2f]">Free Shipping</p>
                <p className="text-xs text-gray-500 font-medium">On orders above ₹999</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconReceipt className="w-8 h-8 text-[#1e9a58]" />
              <div>
                <p className="text-sm font-bold text-[#0d1c2f]">Cash on Delivery</p>
                <p className="text-xs text-gray-500 font-medium">Pay when your order arrives</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconRefresh className="w-8 h-8 text-[#1e9a58]" />
              <div>
                <p className="text-sm font-bold text-[#0d1c2f]">7-Day Easy Returns</p>
                <p className="text-xs text-gray-500 font-medium">Hassle-free return support</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconLock className="w-8 h-8 text-[#1e9a58]" />
              <div>
                <p className="text-sm font-bold text-[#0d1c2f]">Secure Payments</p>
                <p className="text-xs text-gray-500 font-medium">UPI, cards &amp; net banking</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll to Top Button — portaled to <body> so its fixed positioning
            anchors to the real viewport, not the smooth-scroll wrapper. */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {showScrollTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0, rotate: 180 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollToTop}
                  className="fixed bottom-8 right-8 z-50 p-3 bg-[#1e9a58] text-white rounded-full shadow-lg hover:bg-green-700 transition-colors"
                  aria-label="Scroll to top"
                >
                  <IconArrowUp className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>,
            document.body
          )}

        {/* Product Details Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex flex-wrap gap-x-8 gap-y-4 mb-6 border-b border-gray-200">
            {[
              { id: "description", label: "Description", icon: IconFileDescription },
              { id: "features", label: "Features", icon: IconStars },
              { id: "shipping", label: "Shipping", icon: IconTruck },
              { id: "reviews", label: "Reviews", icon: IconStar },
            ].map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 1.3 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-2 flex items-center gap-2 font-bold text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? "text-[#1e9a58]"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5" stroke={2.5} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1e9a58] rounded-t-full"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              {activeTab === "description" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                  {/* Left Sidebar */}
                  <div className="hidden lg:block lg:col-span-1">
                    <div className="sticky top-32">
                      <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                        On this page
                      </h4>
                      <ul className="space-y-4 text-sm font-bold">
                        {[
                          { id: "overview", label: "Overview" },
                          { id: "product-story", label: "Product Story" },
                          { id: "key-highlights", label: "Key Highlights" },
                          { id: "material-care", label: "Material & Care" },
                          { id: "size-fit", label: "Size & Fit" },
                          { id: "more-info", label: "More Information" },
                        ].map((item) => (
                          <li
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={`cursor-pointer pl-4 py-1 border-l-2 transition-colors ${
                              activeSection === item.id
                                ? "text-[#1e9a58] border-[#1e9a58]"
                                : "text-gray-500 hover:text-gray-800 border-transparent"
                            }`}
                          >
                            {item.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right Content */}
                  <div className="lg:col-span-3 flex flex-col gap-16 lg:block">
                    <div id="overview" className={`flex flex-col lg:flex-row gap-10 ${activeSection === 'overview' ? 'lg:flex' : 'lg:hidden'}`}>
                      <div className="flex-1 space-y-8">
                        <div>
                          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0d1c2f] mb-2 leading-tight">
                            Premium Comfort. <br />
                            <span className="text-[#1e9a58]">Timeless Style.</span>
                          </h2>
                          <p className="text-gray-500 text-base font-medium mt-4">
                            Crafted with precision and premium materials, this product delivers unmatched comfort and durability for everyday wear.
                          </p>
                        </div>
                        
                        {/* Icons Grid */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="flex flex-col items-center text-center">
                            <IconMedal className="w-8 h-8 text-[#1e9a58] mb-2" stroke={1.5} />
                            <span className="text-xs font-bold text-[#0d1c2f]">Premium<br/>Quality</span>
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <IconMoonStars className="w-8 h-8 text-[#1e9a58] mb-2" stroke={1.5} />
                            <span className="text-xs font-bold text-[#0d1c2f]">All Day<br/>Comfort</span>
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <IconScissors className="w-8 h-8 text-[#1e9a58] mb-2" stroke={1.5} />
                            <span className="text-xs font-bold text-[#0d1c2f]">Perfect<br/>Fit</span>
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <IconWashMachine className="w-8 h-8 text-[#1e9a58] mb-2" stroke={1.5} />
                            <span className="text-xs font-bold text-[#0d1c2f]">Easy<br/>Care</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Top Image Placeholder */}
                      <div className="flex-1 relative bg-[#fafcfb] rounded-2xl min-h-[300px] flex items-center justify-center overflow-hidden">
                        <Image src={product.images[0]} alt="Product view" fill className="object-cover" />
                      </div>
                    </div>

                    {/* Product Story */}
                    {product.details?.story && (
                    <div id="product-story" className={`flex flex-col lg:flex-row gap-8 items-center bg-gray-50 rounded-2xl p-6 lg:p-8 ${activeSection === 'product-story' ? 'lg:flex' : 'lg:hidden'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1.5 h-6 bg-[#1e9a58] rounded-full"></div>
                          <h3 className="text-xl font-bold text-[#0d1c2f]">Product Story</h3>
                        </div>
                        <p className="text-gray-600 font-medium whitespace-pre-wrap">
                          {product.details.story}
                        </p>
                      </div>
                      <div className="w-full lg:w-[350px] h-[200px] bg-gray-200 rounded-xl relative overflow-hidden flex items-center justify-center group shadow-sm">
                        <Image src={product.images[selectedImage] || product.images[0]} alt="Story Image" fill className="object-cover" />
                      </div>
                    </div>
                    )}
                    {/* Key Highlights */}
                    {product.keyHighlights && product.keyHighlights.length > 0 && (
                    <div id="key-highlights" className={`space-y-4 ${activeSection === 'key-highlights' ? 'lg:block' : 'lg:hidden'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-6 bg-[#1e9a58] rounded-full"></div>
                        <h3 className="text-xl font-bold text-[#0d1c2f]">Key Highlights</h3>
                      </div>
                      <ul className="list-disc pl-5 text-gray-600 space-y-2 font-medium">
                        {product.keyHighlights.map((highlight, index) => (
                          <li key={index}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                    )}

                    {/* Material & Care */}
                    {((product.details?.material) || (product.details?.washingInstructions)) && (
                    <div id="material-care" className={`space-y-4 ${activeSection === 'material-care' ? 'lg:block' : 'lg:hidden'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-6 bg-[#1e9a58] rounded-full"></div>
                        <h3 className="text-xl font-bold text-[#0d1c2f]">Material & Care</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.details?.material && (
                        <div className="bg-white border border-gray-100 p-4 rounded-xl">
                          <h4 className="font-bold text-[#1e9a58] mb-1">Materials</h4>
                          <p className="text-sm text-gray-500">{product.details.material}</p>
                        </div>
                        )}
                        {product.details?.washingInstructions && (
                        <div className="bg-white border border-gray-100 p-4 rounded-xl">
                          <h4 className="font-bold text-[#1e9a58] mb-1">Washing Instructions</h4>
                          <p className="text-sm text-gray-500">{product.details.washingInstructions}</p>
                        </div>
                        )}
                      </div>
                    </div>
                    )}

                    {/* Size & Fit */}
                    {product.details?.sizeAndFit && (
                    <div id="size-fit" className={`space-y-4 ${activeSection === 'size-fit' ? 'lg:block' : 'lg:hidden'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-6 bg-[#1e9a58] rounded-full"></div>
                        <h3 className="text-xl font-bold text-[#0d1c2f]">Size & Fit</h3>
                      </div>
                      <p className="text-gray-600 font-medium whitespace-pre-wrap">{product.details.sizeAndFit}</p>
                    </div>
                    )}

                    {/* More Information */}
                    <div id="more-info" className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-8 lg:pt-0 border-t lg:border-t-0 border-gray-100 ${activeSection === 'more-info' ? 'lg:grid' : 'lg:hidden'}`}>
                      {/* Specifications */}
                      {product.specifications && product.specifications.length > 0 && (
                      <div className="col-span-full">
                        <h3 className="font-bold text-[#0d1c2f] mb-4">Product Specifications</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {product.specifications.map((spec, i) => (
                            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
                              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">{spec.label}</span>
                              <span className="mt-1 block text-sm font-bold leading-snug text-[#0d1c2f]">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "features" && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0d1c2f] mb-2">
                      Built for <span className="text-[#1e9a58]">Performance.</span> Designed for You.
                    </h2>
                    <p className="text-gray-500 font-medium">
                      Every detail is thoughtfully designed to give you the best experience.
                    </p>
                  </div>

                  {/* Dynamic Feature Cards */}
                  {product.featureCards && product.featureCards.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {product.featureCards.map((feat, i) => {
                      const IconComp = getIconComponent(feat.icon);
                      return (
                      <div key={i} className="border border-gray-100 rounded-2xl p-5 text-center flex flex-col items-center hover:shadow-md transition-shadow bg-white">
                        <div className="w-12 h-12 rounded-xl bg-[#e4f7ed] text-[#1e9a58] flex items-center justify-center mb-4">
                          {IconComp && <IconComp className="w-6 h-6" stroke={1.5} />}
                        </div>
                        <h4 className="font-bold text-[#0d1c2f] text-sm mb-2">{feat.title}</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{feat.description}</p>
                      </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}
              {activeTab === "shipping" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left Column */}
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#0d1c2f] mb-2">Fast & Reliable Delivery</h2>
                      <p className="text-gray-500 font-medium">We ensure your order reaches you safely and on time.</p>
                    </div>

                    {/* Dynamic Shipping Banner */}
                    {product.shipping && (
                    <div className="flex items-center justify-between bg-[#f4faf7] border border-[#e4f7ed] rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <IconTruck className="w-6 h-6 text-[#1e9a58]" />
                        <div>
                          <h4 className="font-bold text-[#1e9a58] text-sm">Shipping Information</h4>
                          <p className="text-xs text-gray-500 whitespace-pre-wrap">{product.shipping}</p>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Free Shipping Banner */}
                    <div className="flex items-center justify-between bg-[#f4faf7] border border-[#e4f7ed] rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <IconTruck className="w-6 h-6 text-[#1e9a58]" />
                        <div>
                          <h4 className="font-bold text-[#1e9a58] text-sm">Free Shipping on all orders</h4>
                          <p className="text-xs text-gray-500">No minimum order value</p>
                        </div>
                      </div>
                      <span className="bg-[#1e9a58] text-white text-[10px] font-bold px-2 py-1 rounded">Limited Time Offer</span>
                    </div>

                    {/* Timeline */}
                    <div className="border border-gray-100 rounded-xl p-6 relative overflow-hidden">
                      <h4 className="font-bold text-[#0d1c2f] text-sm mb-1">Estimated Delivery</h4>
                      <div className="text-xl font-black text-[#0d1c2f] mb-2">
                        {formatShortDate(deliveryEstimate.deliveryStart)} - {formatShortDate(deliveryEstimate.deliveryEnd)}
                      </div>
                      <p className="text-xs text-gray-500 font-medium mb-8">
                        Order within <span className="text-[#1e9a58] font-bold">{formatCountdown(cutoffMsRemaining)}</span> to get it by {formatShortDate(deliveryEstimate.deliveryStart)}
                      </p>

                      {/* Timeline Graphic */}
                      <div className="relative pt-4">
                        <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-100"></div>
                        <div className="absolute top-5 left-0 w-1/3 h-[2px] bg-[#1e9a58]"></div>
                        <div className="flex justify-between relative z-10">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 bg-[#1e9a58] rounded-full ring-4 ring-white"></div>
                            <div className="text-[10px] font-bold text-gray-400 text-center">Order Placed<br/>{formatShortDate(deliveryEstimate.orderPlaced)}</div>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 border-2 border-[#1e9a58] bg-white rounded-full ring-4 ring-white"></div>
                            <div className="text-[10px] font-bold text-[#1e9a58] text-center">Shipped<br/>{formatShortDate(deliveryEstimate.shipped)}</div>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 bg-gray-200 rounded-full ring-4 ring-white"></div>
                            <div className="text-[10px] font-bold text-gray-400 text-center">In Transit<br/>{formatShortDate(deliveryEstimate.inTransit)}</div>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 bg-gray-200 rounded-full ring-4 ring-white"></div>
                            <div className="text-[10px] font-bold text-gray-400 text-center">Delivered<br/>{formatShortDate(deliveryEstimate.deliveryStart)}-{formatShortDate(deliveryEstimate.deliveryEnd)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* We Deliver In & Partners */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-gray-100 rounded-xl p-4">
                        <IconActivity className="w-5 h-5 text-[#1e9a58] mb-2" />
                        <h4 className="font-bold text-[#0d1c2f] text-sm mb-1">We Deliver In</h4>
                        <p className="text-xs text-gray-500 font-medium">500+ Cities Across India<br/>Service available in<br/>major pin codes</p>
                      </div>
                      <div className="border border-gray-100 rounded-xl p-4">
                        <h4 className="font-bold text-[#0d1c2f] text-sm mb-3">Our Delivery Partners</h4>
                        <div className="flex items-center gap-2 opacity-50">
                          {/* Placeholder for logos */}
                          <div className="h-4 bg-gray-300 w-12 rounded"></div>
                          <div className="h-4 bg-gray-300 w-12 rounded"></div>
                          <div className="h-4 bg-gray-300 w-12 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4 lg:pt-14">
                    <div className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl p-6 hover:shadow-sm transition-shadow">
                      <div className="w-12 h-12 rounded-full bg-[#f4faf7] text-[#1e9a58] flex items-center justify-center shrink-0">
                        <IconRefresh className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0d1c2f] mb-1">Easy Returns</h4>
                        <p className="text-sm text-gray-500 font-medium">Not happy with the product? Return it within 7 days.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl p-6 hover:shadow-sm transition-shadow">
                      <div className="w-12 h-12 rounded-full bg-[#f4faf7] text-[#1e9a58] flex items-center justify-center shrink-0">
                        <IconPackage className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0d1c2f] mb-1">Secure Packaging</h4>
                        <p className="text-sm text-gray-500 font-medium">Your product will be packed safely to avoid any damage.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl p-6 hover:shadow-sm transition-shadow">
                      <div className="w-12 h-12 rounded-full bg-[#fafcfb] text-[#1e9a58] flex items-center justify-center shrink-0">
                        <IconShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0d1c2f] mb-1">Order Protection</h4>
                        <p className="text-sm text-gray-500 font-medium">100% Safe & Secure. We protect your order from our door to yours.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "reviews" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                  {/* Left Column (Reviews List) */}
                  <div className="lg:col-span-3 space-y-8">
                    <div>
                      <h2 className="text-xl font-bold text-[#0d1c2f] mb-6">Customer Reviews</h2>
                      {/* Summary Cards — real product.rating (aggregate across all
                          approved reviews) plus a recommended% computed from the
                          currently-loaded review page (no dedicated aggregate
                          endpoint exists for that second number). */}
                      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
                        <div className="border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center">
                          <div className="text-4xl font-black text-[#0d1c2f] mb-1">
                            {(product.rating?.count || 0) > 0 ? product.rating.average.toFixed(1) : "—"}
                          </div>
                          <div className="flex text-yellow-400 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <IconStarFilled
                                key={i}
                                className={`w-4 h-4 ${i < Math.round(product.rating?.average || 0) ? "" : "text-gray-200"}`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500 font-bold">Out of 5</p>
                          <p className="text-xs font-bold text-[#0d1c2f]">
                            {(product.rating?.count || 0).toLocaleString()} Review{product.rating?.count === 1 ? "" : "s"}
                          </p>
                        </div>
                        {reviews.length > 0 ? (
                          <div className="border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl font-black text-[#1e9a58] mb-1">
                              {Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100)}%
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Recommended<br/>by customers</p>
                          </div>
                        ) : (
                          <div className="border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-xs text-gray-400 font-medium">Be the first to review this product</p>
                          </div>
                        )}
                      </div>

                      {/* Filters */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="relative">
                            <button 
                              onClick={() => setShowRatingDropdown(!showRatingDropdown)}
                              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 flex items-center gap-2 min-w-[120px] justify-between outline-none"
                            >
                              {ratingOptions.find(o => o.value === reviewRatingFilter)?.label || "All Ratings"}
                              <IconChevronDown className="w-3 h-3" />
                            </button>
                            
                            {/* Backdrop for click-outside */}
                            {showRatingDropdown && (
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowRatingDropdown(false)}
                              ></div>
                            )}

                            <AnimatePresence>
                              {showRatingDropdown && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 min-w-[120px] overflow-hidden"
                                >
                                  {ratingOptions.map(opt => (
                                    <div 
                                      key={opt.value}
                                      onClick={() => {
                                        setReviewsPagination((p) => ({ ...p, page: 1 }));
                                        setReviewRatingFilter(opt.value);
                                        setShowRatingDropdown(false);
                                      }}
                                      className={`px-3 py-2 text-xs cursor-pointer font-bold transition-colors ${
                                        reviewRatingFilter === opt.value 
                                          ? "bg-[#1e9a58] text-white" 
                                          : "text-gray-600 hover:bg-[#f4fbf7] hover:text-[#1e9a58]"
                                      }`}
                                    >
                                      {opt.label}
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <input 
                            value={reviewSearch}
                            onChange={(e) => {
                              setReviewsPagination((p) => ({ ...p, page: 1 }));
                              setReviewSearch(e.target.value);
                            }}
                            placeholder="Search reviews"
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 outline-none w-48"
                          />
                          <button className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#1e9a58] bg-[#f4fbf7]">
                            <IconCheck className="w-3 h-3" /> With Photos
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 mt-4 md:mt-0">
                          Sort by: 
                          <select className="border border-transparent bg-transparent focus:ring-0 outline-none">
                            <option>Latest</option>
                          </select>
                        </div>
                      </div>

                      {/* Reviews List */}
                      {reviewsLoading ? (
                        <div className="py-8 flex justify-center"><Spin /></div>
                      ) : reviews.length === 0 ? (
                        <div className="text-sm text-gray-500 py-6">No reviews found.</div>
                      ) : (
                        <div className="space-y-6">
                          {reviews.map((review) => (
                            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                    <span className="text-sm font-bold text-gray-500">{review.user?.name?.[0] || "A"}</span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-[#0d1c2f] text-sm">{review.user?.name || "Anonymous"}</h4>
                                      {review.isVerifiedPurchase && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#1e9a58]">
                                          <IconCircleCheck className="w-3 h-3" /> Verified Purchase
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <IconStarFilled key={s} className={`w-3 h-3 ${s <= review.rating ? "text-yellow-400" : "text-gray-300"}`} />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs font-medium text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                              </div>
                              {review.title && (
                                <h5 className="font-bold text-[#0d1c2f] text-sm mb-1">{review.title}</h5>
                              )}
                              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                {review.comment}
                              </p>

                              {Array.isArray(review.images) && review.images.length > 0 && (
                                <div className="flex gap-2 mb-4">
                                  {review.images.slice(0, 3).map((img, idx) => (
                                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={img.url || img} alt="" className="w-full h-full object-cover" />
                                      {idx === 2 && review.images.length > 3 && (
                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/50">
                                          +{review.images.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                <span className="font-medium">Was this helpful?</span>
                                <button 
                                  onClick={() => handleMarkHelpful(review.id)}
                                  disabled={helpfulLoadingId === review.id || helpfulClickedMap[review.id]}
                                  className="flex items-center gap-1 hover:text-[#1e9a58] disabled:text-gray-300 transition-colors"
                                >
                                  <IconThumbUp className="w-4 h-4" /> {review.helpful?.count || 0}
                                </button>
                                <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                                  <IconChevronDown className="w-4 h-4" /> 0
                                </button>
                                <button className="ml-auto hover:text-gray-600">Report</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pagination */}
                      {reviewsPagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <Button
                            size="small"
                            disabled={reviewsPagination.page <= 1}
                            onClick={() => setReviewsPagination((p) => ({ ...p, page: p.page - 1 }))}
                          >
                            Previous
                          </Button>
                          <span className="text-xs font-bold text-gray-600">
                            Page {reviewsPagination.page} / {reviewsPagination.totalPages}
                          </span>
                          <Button
                            size="small"
                            disabled={reviewsPagination.page >= reviewsPagination.totalPages}
                            onClick={() => setReviewsPagination((p) => ({ ...p, page: p.page + 1 }))}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (Write Review) */}
                  <div className="lg:col-span-1">
                    <div className="border border-gray-100 rounded-2xl p-6 sticky top-24">
                      <h3 className="font-bold text-[#0d1c2f] mb-2">Write a Review</h3>
                      <p className="text-xs text-gray-500 font-medium mb-6">Share your experience with this product.</p>
                      
                      {!isReviewAuth ? (
                        <Button type="primary" className="w-full h-10 rounded-lg font-bold !bg-[#1e9a58] hover:!bg-green-700 border-none" onClick={() => router.push("/login")}>
                          Login to Review
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">Your Rating</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <button key={value} onClick={() => setNewReviewRating(value)} type="button">
                                  <IconStarFilled className={`w-5 h-5 ${value <= newReviewRating ? "text-yellow-400" : "text-gray-300"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <textarea
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            rows={4}
                            placeholder="Share your experience with this product"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e9a58] focus:border-[#1e9a58] outline-none"
                          />
                          
                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-600 mb-2">Add Photos <span className="font-normal text-gray-400">(up to 5)</span></p>
                            {/* Hidden file input */}
                            <input
                              ref={reviewImageInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleReviewImageSelect}
                            />
                            <div className="flex flex-wrap gap-2">
                              {/* Preview thumbnails */}
                              {reviewImages.map((img, idx) => (
                                <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group">
                                  <img src={img.dataUrl} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveReviewImage(idx)}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              {/* Add button */}
                              {reviewImages.length < 5 && (
                                <button
                                  type="button"
                                  onClick={() => reviewImageInputRef.current?.click()}
                                  className="w-14 h-14 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-[#1e9a58] hover:text-[#1e9a58] hover:bg-[#f4fbf7] transition-all text-xl font-light"
                                >
                                  +
                                </button>
                              )}
                            </div>
                            {reviewImages.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1.5">{reviewImages.length} photo{reviewImages.length > 1 ? "s" : ""} selected</p>
                            )}
                          </div>
                          
                          <Button
                            type="primary"
                            className="w-full h-10 bg-[#1e9a58] hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                            onClick={handleSubmitReview}
                            loading={submitReviewLoading}
                            disabled={!newReviewComment.trim()}
                          >
                            <IconFileDescription className="w-4 h-4" /> Submit Review
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Related Products
              </h2>
              <p className="text-gray-600">Products you might also like</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6"
            >
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <ProductCard
                    product={relatedProduct}
                    onQuickView={handleQuickView}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* All Other Products Section */}
      {otherProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Explore More Products
              </h2>
              <p className="text-gray-600">Discover our complete collection</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6"
            >
              {otherProducts.map((otherProduct, index) => (
                <motion.div
                  key={otherProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <ProductCard
                    product={otherProduct}
                    onQuickView={handleQuickView}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Get In Touch Section */}
      <GetInTouch />
    </div>
  );
}

export default ProductDetails;
