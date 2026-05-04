"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
} from "@tabler/icons-react";
import { Button, message, Spin } from "antd";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCustomDesign } from "@/context/CustomDesignContext";
import axios from "axios";
import { addToRecentlyViewed } from "@/lib/recentlyViewed";
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

function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const infoSectionRef = useRef(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { setCustomDesignSelection } = useCustomDesign();

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

  const fetchRelatedProducts = useCallback(async (categoryId, signal, excludeProduct) => {
    try {
      const { data } = await axios.get(
        `/api/products?category=${encodeURIComponent(categoryId)}&limit=4&status=active`,
        { signal }
      );
      if (data.success && Array.isArray(data.data?.products)) {
        setRelatedProducts(
          data.data.products
            .filter((p) => isOtherThanCurrentProduct(p, params.id, excludeProduct))
            .map((p) => normalizeProductForCard(p))
            .filter(Boolean)
        );
      }
    } catch (error) {
      if (axios.isCancel?.(error) || error.name === "CanceledError") return;
      console.error("Failed to fetch related products", error);
    }
  }, [params.id]);

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
          setSelectedSize(normalized.sizes?.[0] || "One Size");
          setSelectedColor(normalized.colors?.[0] || "");

          const cat = productData.category;
          const categoryId =
            typeof cat === "object" && cat !== null
              ? cat.id || cat._id
              : cat;
          if (categoryId)
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
    if (product && product.id) addToRecentlyViewed(product.id);
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
  }, [fetchReviews, newReviewComment, newReviewRating, product?.id]);

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

  const handleQuickView = (p) => {
    router.push(getProductDetailPath(p));
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
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
    message.success("Added to cart");
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

  const handleAddCustomDesign = () => {
    if (!product) return;

    const colorImageMap = (product.variants || []).reduce((acc, variant) => {
      const color = String(variant?.color || "").trim().toLowerCase();
      const image = getVariantImage(variant);
      if (color && image && !acc[color]) {
        acc[color] = image;
      }
      return acc;
    }, {});

    const customProductId = product.id || product._id || params?.id;

    setCustomDesignSelection({
      productId: customProductId,
      name: product.name,
      images: product.images || [],
      colors: product.colors || [],
      colorImageMap,
      selectedColor: selectedColor || product.colors?.[0] || "",
      selectedImage: product.images?.[selectedImage] || product.images?.[0] || "",
      sourceRoute: `/product-details/${params.id}`,
    });

    if (!customProductId) {
      message.error("Unable to open custom design editor for this product");
      return;
    }
    router.push(`/custom-clothes/editor?productId=${encodeURIComponent(String(customProductId))}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const productWishlisted = product ? isInWishlist(product.id) : false;

  const toggleWishlist = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      message.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: displayPricing.price,
        image: product.images?.[0],
        images: product.images,
        originalPrice: displayPricing.originalPrice ?? product.originalPrice,
        discount: displayPricing.discountPercent ?? product.discount,
      });
      message.success("Added to wishlist");
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
    <div className="bg-gray-50 min-h-screen pt-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 py-6"
      >
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-2 text-sm text-gray-600 mb-4"
        >
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ x: -2 }}
            className="hover:text-gray-900 transition-colors"
          >
            Home
          </motion.button>
          <span>/</span>
          <span className="text-gray-900">{product.category || "—"}</span>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </motion.div>

        {/* Main Product Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Product Images - Left Side with Vertical Thumbnails (Sticky) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="lg:col-span-5"
            >
              <div className="sticky top-24">
                <div className="flex gap-4">
                  {/* Vertical Thumbnail Strip */}
                  {product.images.length > 1 && (
                    <div className="flex flex-col gap-3">
                      {product.images.map((image, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.2,
                            delay: 0.4 + index * 0.05,
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedImage(index)}
                          className={`relative w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                            selectedImage === index
                              ? "border-blue-500 shadow-md"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <Image
                            src={image}
                            alt={`${product.name} view ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Main Image */}
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 relative w-full h-[500px] lg:h-[600px] bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                  >
                    <Image
                      src={product.images[selectedImage]}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                      priority
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Product Info - Right Side (Scrollable) */}
            <motion.div
              ref={infoSectionRef}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="lg:col-span-7 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2"
              style={{ scrollbarWidth: "thin" }}
            >
              {/* Product Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-3">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded"
                  >
                    <span className="text-green-700 font-semibold">
                      {product.rating}
                    </span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.6 + i * 0.05 }}
                        >
                          <IconStarFilled
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </motion.div>
                      ))}
                    </div>
                    <span className="text-green-700 text-sm ml-2">
                      ({product.reviews} Reviews)
                    </span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Price Section (updates when size / color variant changes) */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl lg:text-4xl font-bold text-gray-900">
                    ₹{formatPrice(displayPricing.price)}
                  </span>
                  {displayPricing.originalPrice != null && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{formatPrice(displayPricing.originalPrice)}
                      </span>
                      {displayPricing.discountPercent > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm font-semibold">
                          {displayPricing.discountPercent}% off
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">Inclusive of all taxes</p>
              </div>

              {/* Key Highlights */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Key Highlights
                </h3>
                <ul className="space-y-2">
                  {product.features.slice(0, 4).map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <IconCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Size Selection */}
              {product.sizes.length > 0 && product.sizes[0] !== "One Size" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-900">
                      Select Size
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Size Guide
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, index) => (
                      <motion.button
                        key={size}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border-2 rounded font-medium text-sm transition-all ${
                          selectedSize === size
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Color Selection */}
              {product.colors.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Select Color
                  </label>
                  <div className="flex gap-3 ml-2">
                    {product.colors.map((color, index) => (
                      <motion.button
                        key={color}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full ${
                          colorMap[color] || "bg-gray-200"
                        } border-2 transition-all ${
                          selectedColor === color
                            ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
                            : "border-gray-300"
                        }`}
                        aria-label={color}
                        title={color}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Delivery & Offers Section */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <IconTruck className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Free Delivery</p>
                    <p className="text-sm text-gray-600">{product.shipping}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Warranty</p>
                    <p className="text-sm text-gray-600">
                      {product.returnPolicy}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconRefresh className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      7 Day Replacement
                    </p>
                    <p className="text-sm text-gray-600">
                      Easy return and replacement policy
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity and Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center border-2 border-gray-300 rounded"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-100 transition-colors"
                      >
                        <IconMinus className="w-5 h-5" />
                      </motion.button>
                      <motion.span
                        key={quantity}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="px-6 py-2 font-semibold text-gray-900 min-w-[60px] text-center border-x border-gray-300"
                      >
                        {quantity}
                      </motion.span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                      >
                        <IconPlus className="w-5 h-5" />
                      </motion.button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      {product.inStock ? (
                        <>
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              repeatDelay: 2,
                            }}
                            className="w-2 h-2 bg-green-500 rounded-full"
                          ></motion.span>
                          <span>In Stock ({product.stock} available)</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-red-600">Out of Stock</span>
                        </>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-4"
                >
                  <Button
                    size="large"
                    onClick={handleAddToCart}
                    className="flex items-center justify-center gap-2 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-8"
                    disabled={!displayPricing.inStock}
                    icon={<IconShoppingCart className="w-5 h-5" />}
                  >
                    ADD TO CART
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleAddToCart}
                    className="px-8"
                    disabled={!displayPricing.inStock}
                  >
                    BUY NOW
                  </Button>
                  <AddCustomDesignButton
                    onClick={handleAddCustomDesign}
                    disabled={!displayPricing.inStock}
                  />
                </motion.div>

                {/* Wishlist and Share */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 pt-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleWishlist}
                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded transition-colors ${
                      productWishlisted
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <motion.div
                      animate={productWishlisted ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <IconHeart
                        className={`w-5 h-5 ${
                          productWishlisted ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                    </motion.div>
                    <span className="text-sm font-medium">
                      {productWishlisted ? "Wishlisted" : "Wishlist"}
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded text-gray-700 hover:border-gray-400 transition-colors"
                  >
                    <IconShare className="w-5 h-5" />
                    <span className="text-sm font-medium">Share</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0, rotate: 180 }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              aria-label="Scroll to top"
            >
              <IconArrowUp className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Product Details Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex gap-8 mb-6 border-b border-gray-200">
            {["description", "features", "shipping", "reviews"].map((tab, index) => (
              <motion.button
                key={tab}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 1.3 + index * 0.1 }}
                whileHover={{ y: -2 }}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-2 capitalize font-semibold text-sm transition-colors relative ${
                  activeTab === tab
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.span
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </motion.button>
            ))}
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
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Product Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
              {activeTab === "features" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Product Features
                  </h3>
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex items-start gap-3 text-gray-600"
                      >
                        <IconCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
              {activeTab === "shipping" && (
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Shipping Information
                    </h3>
                    <p className="text-gray-600">{product.shipping}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Return Policy
                    </h3>
                    <p className="text-gray-600">{product.returnPolicy}</p>
                  </motion.div>
                </div>
              )}
              {activeTab === "reviews" && (
                <div className="space-y-5">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Write a review</h3>
                    {!isReviewAuth ? (
                      <p className="text-sm text-gray-600">
                        Please login to write a review. Reviews are published only after admin approval.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-700">Your rating:</span>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              onClick={() => setNewReviewRating(value)}
                              className="inline-flex"
                              type="button"
                            >
                              <IconStarFilled
                                className={`w-5 h-5 ${
                                  value <= newReviewRating ? "text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          rows={4}
                          placeholder="Share your experience with this product"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        <Button
                          type="primary"
                          onClick={handleSubmitReview}
                          loading={submitReviewLoading}
                          disabled={!newReviewComment.trim()}
                        >
                          Submit Review
                        </Button>
                        <p className="text-xs text-gray-500">
                          Your review will appear publicly once approved by admin.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={reviewRatingFilter}
                      onChange={(e) => {
                        setReviewsPagination((p) => ({ ...p, page: 1 }));
                        setReviewRatingFilter(e.target.value);
                      }}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="">All ratings</option>
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </select>
                    <input
                      value={reviewSearch}
                      onChange={(e) => {
                        setReviewsPagination((p) => ({ ...p, page: 1 }));
                        setReviewSearch(e.target.value);
                      }}
                      placeholder="Search reviews"
                      className="border border-gray-300 rounded px-3 py-2 text-sm min-w-[240px]"
                    />
                  </div>

                  {reviewsLoading ? (
                    <div className="py-8 flex justify-center">
                      <Spin />
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-sm text-gray-500 py-6">No reviews found.</div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className={`border rounded-lg p-4 ${
                            (review.helpful?.count || 0) >= 3
                              ? "border-blue-300 bg-blue-50/40"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-900">
                                {review.user?.name || "Anonymous"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <IconStarFilled
                                  key={s}
                                  className={`w-4 h-4 ${
                                    s <= review.rating ? "text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                          <button
                            onClick={() => handleMarkHelpful(review.id)}
                            disabled={
                              helpfulLoadingId === review.id || helpfulClickedMap[review.id]
                            }
                            className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 disabled:text-gray-400"
                          >
                            <IconThumbUp className="w-4 h-4" />
                            Helpful ({review.helpful?.count || 0})
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {reviewsPagination.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        disabled={reviewsPagination.page <= 1}
                        onClick={() =>
                          setReviewsPagination((p) => ({ ...p, page: p.page - 1 }))
                        }
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {reviewsPagination.page} / {reviewsPagination.totalPages}
                      </span>
                      <Button
                        size="small"
                        disabled={reviewsPagination.page >= reviewsPagination.totalPages}
                        onClick={() =>
                          setReviewsPagination((p) => ({ ...p, page: p.page + 1 }))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  )}
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
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
