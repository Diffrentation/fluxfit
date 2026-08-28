/**
 * Helpers for storefront GET /api/products integration.
 * Maps UI filter state → query params and API product shape → ProductCard props.
 */

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500'%3E%3Crect fill='%23e5e7eb' width='400' height='500'/%3E%3C/svg%3E";

/** API often returns `http://res.cloudinary.com/...` but `next/image` only allows configured https host */
export function ensureHttpsCloudinary(url) {
  if (typeof url !== "string" || !url) return url;
  if (url.startsWith("http://res.cloudinary.com")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

/**
 * Resolve primary image URL from aggregation/API variants.
 */
export function getProductImageUrl(product) {
  const p = product?.primaryImage;
  let raw = "";
  if (typeof p === "string" && p) raw = p;
  else if (p?.url) raw = p.url;
  else if (Array.isArray(p) && p[0]?.url) raw = p[0].url;
  else if (Array.isArray(p) && typeof p[0] === "string") raw = p[0];
  else {
    const first = product?.images?.[0];
    if (typeof first === "string") raw = first;
    else if (first?.url) raw = first.url;
  }
  if (!raw) return PLACEHOLDER_IMAGE;
  return ensureHttpsCloudinary(raw);
}

/**
 * Normalize API product for ProductCard (expects `price` string + `image` URL).
 */
export function normalizeProductForCard(product) {
  if (!product) return null;
  const id = product.id || product._id;
  const basePrice = product.basePrice ?? product.price ?? 0;
  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? product.category.name
      : product.category || "";
  const colors = product.colors || [];
  const firstColor = colors[0] || product.color || "";

  return {
    ...product,
    id,
    slug: product.slug || "",
    image: getProductImageUrl(product),
    price: String(basePrice),
    category: categoryName,
    color: firstColor,
    colors,
    tags: product.tags || [],
    sizes: product.sizes || [],
  };
}

/** Storefront URL: prefer SEO slug, then id. */
export function getProductDetailPath(product) {
  if (!product) return "/product-list";
  const slug = typeof product.slug === "string" ? product.slug.trim() : "";
  if (slug) return `/product-details/${slug}`;
  const id = product.id ?? product._id;
  if (id != null && id !== "") return `/product-details/${String(id)}`;
  return "/product-list";
}

/**
 * @param {{ prefer?: "size" | "color" }} [options] - When the exact
 *   size+color combo isn't sold, which axis to honor first. Pass "color"
 *   right after the shopper clicks a color swatch (so the variant actually
 *   switches to that color, adapting size, instead of silently keeping the
 *   old size's variant) and "size" right after they click a size.
 */
export function findMatchingProductVariant(variants, size, color, options = {}) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const s = String(size ?? "").trim();
  const c = String(color ?? "").trim().toLowerCase();
  const active = variants.filter((v) => v.isActive !== false);
  const list = active.length ? active : variants;

  const exact = list.find(
    (v) =>
      String(v.size ?? "").trim() === s &&
      String(v.color ?? "").trim().toLowerCase() === c
  );
  if (exact) return exact;

  const bySize = () =>
    s && s !== "One Size"
      ? list.find((v) => String(v.size ?? "").trim() === s)
      : null;
  const byColor = () =>
    c && c !== "default" && c !== ""
      ? list.find((v) => String(v.color ?? "").trim().toLowerCase() === c)
      : null;

  const [first, second] = options.prefer === "color"
    ? [byColor, bySize]
    : [bySize, byColor];

  return first() || second() || list[0] || null;
}

export function getVariantAwarePricing(product, selectedVariant) {
  const basePrice = Number(product?.basePrice ?? product?.price ?? 0) || 0;
  const baseOrig =
    product?.originalPrice != null ? Number(product.originalPrice) : null;

  if (!selectedVariant) {
    const showOrig =
      baseOrig != null && baseOrig > basePrice ? baseOrig : null;
    const discountPct =
      showOrig != null
        ? Math.round(((showOrig - basePrice) / showOrig) * 100)
        : Number(product?.discount) || 0;
    return {
      price: basePrice,
      originalPrice: showOrig,
      discountPercent: discountPct,
      stock: product?.stock ?? 0,
      inStock: product?.inStock !== false && (product?.stock ?? 0) > 0,
    };
  }

  const vPrice =
    selectedVariant.price != null
      ? Number(selectedVariant.price)
      : basePrice;
  let vOrig =
    selectedVariant.originalPrice != null
      ? Number(selectedVariant.originalPrice)
      : null;
  if (vOrig == null && baseOrig != null) vOrig = baseOrig;

  const showOrig = vOrig != null && vOrig > vPrice ? vOrig : null;
  const discountPercent =
    showOrig != null
      ? Math.round(((showOrig - vPrice) / showOrig) * 100)
      : Number(product?.discount) || 0;

  const vStock = Number(selectedVariant.stock ?? 0);
  const vInStock = selectedVariant.isActive !== false && vStock > 0;

  return {
    price: vPrice,
    originalPrice: showOrig,
    discountPercent,
    stock: vStock,
    inStock: vInStock,
  };
}

export function normalizeProductDetailForPage(raw) {
  if (!raw) return null;
  const id = raw.id || raw._id;

  const imageUrls = (Array.isArray(raw.images) ? raw.images : [])
    .map((img) => {
      const u = typeof img === "string" ? img : img?.url;
      return u ? ensureHttpsCloudinary(u) : "";
    })
    .filter(Boolean);

  if (imageUrls.length === 0) {
    const fallback = getProductImageUrl(raw);
    if (fallback && fallback !== PLACEHOLDER_IMAGE) imageUrls.push(fallback);
    else imageUrls.push(PLACEHOLDER_IMAGE);
  }

  const ratingObj =
    raw.rating && typeof raw.rating === "object" ? raw.rating : null;
  const ratingNum = ratingObj
    ? Number(ratingObj.average) || 0
    : Number(raw.rating) || 0;
  const reviewCount =
    typeof raw.reviews === "number"
      ? raw.reviews
      : ratingObj?.count ?? 0;

  let sizes = [];
  if (Array.isArray(raw.sizes) && raw.sizes.length) {
    sizes = [...new Set(raw.sizes.map((x) => String(x)))];
  } else if (Array.isArray(raw.variants)) {
    sizes = [
      ...new Set(
        raw.variants.map((v) => v.size).filter(Boolean).map(String)
      ),
    ];
  }

  let colors = [];
  if (Array.isArray(raw.colors) && raw.colors.length) {
    colors = [...new Set(raw.colors.map((c) => String(c).toLowerCase()))];
  } else if (Array.isArray(raw.variants)) {
    colors = [
      ...new Set(
        raw.variants
          .map((v) => v.color)
          .filter(Boolean)
          .map((c) => String(c).toLowerCase())
      ),
    ];
  }

  const cat = raw.category;
  const categoryName =
    typeof cat === "object" && cat !== null ? cat.name || "" : String(cat || "");

  let features = [];
  if (Array.isArray(raw.features)) features = raw.features;
  else if (raw.features) features = [raw.features];

  const basePrice = raw.basePrice ?? raw.price ?? 0;

  return {
    ...raw,
    id,
    images: imageUrls,
    sizes,
    colors,
    price: basePrice,
    originalPrice: raw.originalPrice,
    discount: raw.discount ?? 0,
    rating: ratingNum,
    reviews: reviewCount,
    features,
    name: raw.name,
    slug: raw.slug || "",
    description: raw.description || "",
    shortDescription: raw.shortDescription,
    category: categoryName,
    returnPolicy: raw.returnPolicy || "30-day return policy",
    shipping:
      typeof raw.shipping === "string"
        ? raw.shipping
        : raw.shippingInfo || "Free shipping available",
    inStock: raw.inStock !== false,
    stock: raw.stock ?? 0,
  };
}

/**
 * Category label -> API `category` query value (slug or ID).
 * Prefer passing the backend slug/ID directly; this function is kept for legacy
 * components that still pass display names.
 */
export function categoryLabelToQueryValue(label) {
  if (!label || label === "All Products") return null;
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/** UI sort dropdown → GET /api/products `sort` param */
export function mapSortByToApiSort(sortBy) {
  switch (sortBy) {
    case "newness":
      return "createdAt-desc";
    case "popularity":
      return "popularity-desc";
    case "rating":
      return "rating-desc";
    case "price-low":
      return "price-asc";
    case "price-high":
      return "price-desc";
    default:
      return "createdAt-desc";
  }
}

/**
 * Parse price filter value "min-max", "min+", or "all" → minPrice / maxPrice.
 */
export function priceFilterToMinMax(priceFilter) {
  if (!priceFilter || priceFilter === "all") return {};
  if (priceFilter.includes("+")) {
    const min = parseFloat(priceFilter.replace("+", "").trim());
    if (Number.isFinite(min)) return { minPrice: min };
    return {};
  }
  const parts = priceFilter.split("-").map((p) => parseFloat(p.trim()));
  if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
    return { minPrice: parts[0], maxPrice: parts[1] };
  }
  return {};
}

/**
 * Build plain object of query params for axios GET /api/products (public catalog).
 */
export function buildPublicProductsQuery({
  page = 1,
  limit = 24,
  category,
  categoryLabel,
  search = "",
  sortBy = "newness",
  priceFilter = "all",
  minPrice,
  maxPrice,
  color = null,
  tags = [],
  size = null,
  brand = null,
  minRating = null,
  inStockOnly = false,
}) {
  const params = {
    page,
    limit,
    sort: mapSortByToApiSort(sortBy),
    status: "active",
  };

  const cat = category || categoryLabelToQueryValue(categoryLabel);
  if (cat) params.category = cat;

  const q = typeof search === "string" ? search.trim() : "";
  if (q) params.search = q;

  const derived = priceFilterToMinMax(priceFilter);

  const finalMin =
    minPrice != null && minPrice !== ""
      ? parseFloat(minPrice)
      : derived.minPrice;
  const finalMax =
    maxPrice != null && maxPrice !== ""
      ? parseFloat(maxPrice)
      : derived.maxPrice;

  if (Number.isFinite(finalMin)) params.minPrice = finalMin;
  if (Number.isFinite(finalMax)) params.maxPrice = finalMax;

  if (color && String(color).trim()) {
    // Color matching is case-sensitive in the backend query,
    // so preserve the exact casing provided by the UI/backend payload.
    params.color = String(color).trim();
  }

  if (Array.isArray(tags) && tags.length > 0) {
    params.tags = tags.map((t) => String(t).trim().toLowerCase()).join(",");
  }

  if (size && String(size).trim()) params.size = String(size).trim();
  if (brand && String(brand).trim()) params.brand = String(brand).trim();
  if (minRating != null && Number.isFinite(Number(minRating))) {
    params.minRating = Number(minRating);
  }
  if (inStockOnly) params.inStock = "true";

  return params;
}
