# API-Component Integration Guide

This document describes which APIs are integrated with which components in the FluxFit e-commerce application.

## Table of Contents

- [Product APIs](#product-apis)
- [Cart APIs](#cart-apis)
- [Wishlist APIs](#wishlist-apis)
- [Order APIs](#order-apis)
- [Payment APIs](#payment-apis)
- [Category & Brand APIs](#category--brand-apis)
- [User APIs](#user-apis)
- [Review APIs](#review-apis)
- [Coupon APIs](#coupon-apis)
- [Recently Viewed APIs](#recently-viewed-apis)
- [Admin APIs](#admin-apis)

---

## Product APIs

### `GET /api/products`

**Purpose:** Fetch all products with pagination, filters, and search

**Integrated Components:**

- `ProductOverview` (`src/components/Home/ProductOverview.jsx`)
  - Loads catalog via `usePublicProducts` (`src/hooks/usePublicProducts.js`) → Axios `GET /api/products`
  - Query params built in `buildPublicProductsQuery` (`src/lib/publicProductsApi.js`): `page`, `limit`, `status=active`, `search` (debounced), `category` (slug from nav label), `sort`, `minPrice`/`maxPrice`, `color`, `tags`
  - Aborts in-flight requests on filter change to avoid race conditions
- `ProductList` page (`src/app/product-list/page.jsx`)
  - Same hook + helpers; category/color/tag filter options derived from the current result set (memoized)
  - Debounced search input to reduce API churn while typing
- Admin `ProductList` component (`src/components/Admin/Products/ProductList.jsx`)
  - Admin product management: `GET /api/products` with `search` query param (aligned with API), pagination, and filters

### `GET /api/products/:id`

**Purpose:** Fetch single product details by ID

**Integrated Components:**

- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - Displays detailed product information, images, variants, reviews
- `ProductCard` component (`src/components/ui/ProductCard.jsx`)
  - Quick view functionality (navigates to product details)

### `POST /api/products`

**Purpose:** Create new product (Admin only)

**Integrated Components:**

- Admin `ProductForm` component (`src/components/Admin/Products/ProductForm.jsx`)
  - Form for creating new products

### `PUT /api/products/:id`

**Purpose:** Update existing product (Admin only)

**Integrated Components:**

- Admin `ProductForm` component (`src/components/Admin/Products/ProductForm.jsx`)
  - Form for editing existing products

### `DELETE /api/products/:id`

**Purpose:** Delete product (Admin only)

**Integrated Components:**

- Admin `ProductList` component (`src/components/Admin/Products/ProductList.jsx`)
  - Delete action in product management table

### `GET /api/products/search`

**Purpose:** Search products with text query

**Integrated Components:**

- `ProductOverview` component (`src/components/Home/ProductOverview.jsx`)
  - Search functionality in product overview
- Search bar in navigation/header

### `GET /api/products/filters`

**Purpose:** Get available filter options (colors, sizes, price ranges, etc.)

**Integrated Components:**

- `ProductOverview` component (`src/components/Home/ProductOverview.jsx`)
  - Populates filter dropdowns (ColorFilter, TagsFilter, PriceFilter)
- `ProductList` page (`src/app/product-list/page.jsx`)
  - Filter sidebar options

### `GET /api/products/:id/variants`

**Purpose:** Get product variants

**Integrated Components:**

- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - Displays size and color variants

### `GET /api/products/:id/reviews`

**Purpose:** Get product reviews

**Integrated Components:**

- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - Reviews section

### `POST /api/products/:id/reviews`

**Purpose:** Add review to product

**Integrated Components:**

- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - Review form submission

### `GET /api/products/:id/stock`

**Purpose:** Get product stock information

**Integrated Components:**

- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - Stock availability display

---

## Cart APIs

**Server note:** The `Cart` model (`src/models/cart.model.js`) uses Mongoose **9.x**–compatible `pre("save")` hooks (no legacy `next()` callback). It is registered with `mongoose.models.Cart || mongoose.model(...)` so Next.js dev hot reload does not throw `OverwriteModelError`. The `user` field uses `unique: true` only (no duplicate `user` index).

**`DELETE /api/cart`:** Clears the authenticated user’s cart with `Cart.findOneAndDelete({ user })` (Next.js route handlers use `authenticateUser`, not Express `req.user`). Returns **200** whether or not a document existed (idempotent). Never **404** for “no cart”.

**`POST /api/cart/items`:** Requires `Authorization: Bearer <token>`. `productId` must be a **24-character hex** MongoDB ObjectId (`src/lib/mongoose-id.js`). Validates JSON body, product existence, stock, and variant; uses `Cart.getOrCreate` so a cart is created if missing. Debug logs: `[api/cart/items] POST` with `productId` and `userId`.

**Client:** `CartContext` (`addToCart`) syncs to the server when a token exists and `id` / `_id` is a valid ObjectId (`src/lib/cart-api-client.js`). Checkout still runs `DELETE /api/cart` then reposts lines via `src/lib/checkout-order.js` with the same Bearer header.

### `GET /api/cart`

**Purpose:** Get user's cart items

**Integrated Components:**

- `CartContext` (`src/context/CartContext.jsx`)
  - Loads cart on component mount
- `CartPage` (`src/app/cart/page.jsx`)
  - Displays cart items

### `POST /api/cart/items`

**Purpose:** Add item to cart

**Integrated Components:**

- `CartContext` (`src/context/CartContext.jsx`)
  - `addToCart` function
- `ProductCard` component (`src/components/ui/ProductCard.jsx`)
  - Add to cart button
- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - Add to cart button

### `PUT /api/cart/items/:itemId`

**Purpose:** Update cart item quantity

**Integrated Components:**

- `CartContext` (`src/context/CartContext.jsx`)
  - `updateQuantity` function
- `CartPage` (`src/app/cart/page.jsx`)
  - Quantity increment/decrement buttons

### `DELETE /api/cart/items/:itemId`

**Purpose:** Remove item from cart

**Integrated Components:**

- `CartContext` (`src/context/CartContext.jsx`)
  - `removeFromCart` function
- `CartPage` (`src/app/cart/page.jsx`)
  - Delete item button

### `DELETE /api/cart`

**Purpose:** Remove the current user’s cart document from MongoDB (full clear). Idempotent: **200** if no cart existed.

**Integrated Components:**

- `CartContext` (`src/context/CartContext.jsx`)
  - `clearCart` (local only unless you call this API separately)
- `checkout-order.js` — `syncLocalCartToServer` calls `DELETE` then `POST /api/cart/items` for each line before `POST /api/orders`

### `POST /api/cart/apply-coupon`

**Purpose:** Apply coupon code to cart

**Integrated Components:**

- `CartContext` (`src/context/CartContext.jsx`)
  - `applyCoupon` function
- `CartPage` (`src/app/cart/page.jsx`)
  - Coupon code input and apply button

### `DELETE /api/cart/coupon`

**Purpose:** Remove applied coupon

**Integrated Components:**

- `CartContext` (`src/context/CartContext.jsx`)
  - `removeCoupon` function
- `CartPage` (`src/app/cart/page.jsx`)
  - Remove coupon button

---

## Wishlist APIs

### `GET /api/wishlist`

**Purpose:** Get user's wishlist items

**Integrated Components:**

- `WishlistContext` (`src/context/WishlistContext.jsx`)
  - Loads wishlist on component mount
- `WishlistPage` (`src/app/wishlist/page.jsx`)
  - Displays all wishlist items
- `WishlistPreview` component (`src/components/Home/WishlistPreview.jsx`)
  - Shows preview of wishlist items on homepage

### `POST /api/wishlist/items`

**Purpose:** Add item to wishlist

**Integrated Components:**

- `WishlistContext` (`src/context/WishlistContext.jsx`)
  - `addToWishlist` function
- `ProductCard` component (`src/components/ui/ProductCard.jsx`)
  - Wishlist heart icon button
- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - Wishlist button

### `DELETE /api/wishlist/items/:itemId`

**Purpose:** Remove item from wishlist

**Integrated Components:**

- `WishlistContext` (`src/context/WishlistContext.jsx`)
  - `removeFromWishlist` function
- `WishlistPage` (`src/app/wishlist/page.jsx`)
  - Remove from wishlist button
- `WishlistPreview` component (`src/components/Home/WishlistPreview.jsx`)
  - Remove button on wishlist preview cards

### `GET /api/wishlist/check/:productId`

**Purpose:** Check if product is in wishlist

**Integrated Components:**

- `ProductCard` component (`src/components/ui/ProductCard.jsx`)
  - Determines if heart icon should be filled
- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - Wishlist button state

---

## Order APIs

### `GET /api/orders`

**Purpose:** Get user's order history

**Integrated Components:**

- `OrdersPage` (`src/app/orders/page.jsx`)
  - Displays list of user orders

### `POST /api/orders`

**Purpose:** Create new order (authenticated). The server builds the order from the **user’s MongoDB cart** (`Cart` model), not from the client-only `localStorage` cart.

**Request body (JSON):** `shippingAddressId` (saved address `_id`) **or** embedded `shippingAddress` / `billingAddress`; `paymentMethod` (`card` | `upi` | `netbanking` | `cod` | `razorpay` | `stripe` | `paypal`); optional `shippingCost`, `shippingMethod`, `paymentId`, `transactionId`, `notes`, `clearCart` (default `true`).

**Integrated Components:**

- `CheckoutPage` (`src/app/checkout/page.jsx`)
  - Sends guests to `/auth/login?returnUrl=/checkout` when the cart has items so checkout can hit authenticated APIs.
- `ReviewStep` (`src/components/Checkout/ReviewStep.jsx`)
  - Before `POST /api/orders`: syncs local cart to the server via `DELETE /api/cart` then `POST /api/cart/items` per line (see `src/lib/checkout-order.js`); applies coupon with `POST /api/cart/apply-coupon` when `appliedCoupon` exists in `CartContext`.
  - Calls `POST /api/orders` with `shippingAddressId`, `paymentMethod`, `shippingCost` (from checkout summary), then clears local cart and passes the API order through `mapApiOrderToLegacyUi` for the confirmation UI.
- `checkout/confirmation` (`src/app/checkout/confirmation/page.jsx`)
  - Loads the placed order with `GET /api/orders/:orderNumber` (Bearer token), with fallback to legacy `localStorage` orders for old links.

### `GET /api/orders/:id`

**Purpose:** Get order details

**Integrated Components:**

- `OrderDetailsPage` (`src/app/orders/[id]/page.jsx`)
  - Loads order with `GET /api/orders/:id` (Mongo `_id` or `orderNumber`) and Bearer token; maps the response with `mapApiOrderToLegacyUi` (`src/lib/order-display.js`); falls back to legacy `localStorage` orders if needed.

### `POST /api/orders/:id/cancel`

**Purpose:** Cancel order

**Integrated Components:**

- `OrderDetailsPage` (`src/app/orders/[id]/page.jsx`)
  - Cancel order button

### `POST /api/orders/:id/return`

**Purpose:** Request order return

**Integrated Components:**

- `OrderDetailsPage` (`src/app/orders/[id]/page.jsx`)
  - Return request button

### `GET /api/orders/:id/invoice`

**Purpose:** Download order invoice

**Integrated Components:**

- `OrderDetailsPage` (`src/app/orders/[id]/page.jsx`)
  - Download invoice button

### `POST /api/orders/:id/reorder`

**Purpose:** Reorder items from previous order

**Integrated Components:**

- `OrderDetailsPage` (`src/app/orders/[id]/page.jsx`)
  - Reorder button

---

## Payment APIs

### `POST /api/payments/create-intent`

**Purpose:** Create payment intent (Razorpay/Stripe)

**Integrated Components:**

- `PaymentStep` component (`src/components/Checkout/PaymentStep.jsx`)
  - Initiates payment process

### `POST /api/payments/verify`

**Purpose:** Verify payment after completion

**Integrated Components:**

- `PaymentStep` component (`src/components/Checkout/PaymentStep.jsx`)
  - Verifies payment success
- `CheckoutConfirmationPage` (`src/app/checkout/confirmation/page.jsx`)
  - Payment verification on confirmation page

### `GET /api/payments/:id`

**Purpose:** Get payment details

**Integrated Components:**

- `OrderDetailsPage` (`src/app/orders/[id]/page.jsx`)
  - Payment information section

### `GET /api/payments/methods`

**Purpose:** Get available payment methods

**Integrated Components:**

- `PaymentStep` component (`src/components/Checkout/PaymentStep.jsx`)
  - Displays payment method options

### `POST /api/payments/webhook`

**Purpose:** Payment webhook handler (server-side)

**Integrated Components:**

- Server-side webhook processing (no direct component integration)

---

## Category & Brand APIs

### `GET /api/categories`

**Purpose:** Get all categories

**Integrated Components:**

- `CategoryNav` component (`src/components/ui/CategoryNav.jsx`)
  - Displays category navigation
- `ProductOverview` component (`src/components/Home/ProductOverview.jsx`) <><>
  - Category filter dropdown
- Admin `CategoryTree` component (`src/components/Admin/Categories/CategoryTree.jsx`)
  - Admin category management

### `GET /api/categories/:id`

**Purpose:** Get category details

**Integrated Components:**

- Category detail pages
- Admin category edit form

### `POST /api/categories`

**Purpose:** Create category (Admin only)

**Auth:** `Authorization: Bearer <token>` with a user whose `role` is `admin` (same token storage as login: `localStorage.token`).

**Request body (JSON):** `name` (required); `slug` (optional, lowercased); `description`; `parent` or `parentId` (Mongo ObjectId string or omit/null for root); `image`, `banner`, `icon` (URL strings or null); `sortOrder`; `isActive`, `isFeatured`; `metaTitle`, `metaDescription`; `metaKeywords` (array of strings or comma-separated string).

**Response:** `{ success, message, data: { category } }` with HTTP `201` on success.

**Integrated Components:**

- Admin `CategoryForm` (`src/components/Admin/Categories/CategoryForm.jsx`) posts to `/api/categories` (create) or `PUT /api/categories/:id` (edit), maps API field `parent` validation errors onto form field `parentId`, and dispatches `categories:refresh` after save.
- Admin `CategoryTree` (`src/components/Admin/Categories/CategoryTree.jsx`) listens for `categories:refresh` and refetches the tree (`GET /api/categories?format=tree&includeInactive=true&includeProductCount=true`).

### `GET /api/brands`

**Purpose:** Get all brands

**Integrated Components:**

- Product filters
- Admin `BrandList` component (`src/components/Admin/Categories/BrandList.jsx`)

### `GET /api/brands/:id`

**Purpose:** Get brand details

**Integrated Components:**

- Brand detail pages
- Admin brand edit form

---

## User APIs

### `GET /api/users/profile`

**Purpose:** Get user profile

**Integrated Components:**

- User profile page
- Profile settings components

### `PUT /api/users/profile`

**Purpose:** Update user profile

**Integrated Components:**

- Profile edit form
- Account settings page

### `GET /api/users/addresses`

**Purpose:** Get user addresses

**Integrated Components:**

- `AddressStep` component (`src/components/Checkout/AddressStep.jsx`)
  - Fetches saved addresses on mount via Axios (`GET /api/users/addresses`)
  - Hydrates checkout address selector from backend (no localStorage dummy data)
- User address management page

### `POST /api/users/addresses`

**Purpose:** Add new address

**Integrated Components:**

- `AddressStep` component (`src/components/Checkout/AddressStep.jsx`)
  - Submits new address from modal form via Axios (`POST /api/users/addresses`)
  - Auto-refreshes address list from backend after create
- Address management page

### `PUT /api/users/addresses/:id`

**Purpose:** Update address

**Integrated Components:**

- Address edit form
- `AddressStep` component (`src/components/Checkout/AddressStep.jsx`)
  - Saves edits via Axios (`PUT /api/users/addresses/:id`)
  - Refreshes list from backend after update

### `DELETE /api/users/addresses/:id`

**Purpose:** Delete address

**Integrated Components:**

- Address management page
- `AddressStep` component (`src/components/Checkout/AddressStep.jsx`)
  - Confirms then calls `DELETE /api/users/addresses/:id`
  - Refreshes list after delete

### `PUT /api/users/addresses/:id/default`

**Purpose:** Set default address

**Integrated Components:**

- Address management page
- `AddressStep` component (`src/components/Checkout/AddressStep.jsx`)
  - “Set Default” uses Axios (`PUT /api/users/addresses/:id/default`)
  - Refreshes list so `isDefault` flags stay in sync

---

## Review APIs

### `GET /api/reviews`

**Purpose:** Get all reviews (with filters)

**Integrated Components:**

- Reviews listing page
- Admin reviews management

### `GET /api/reviews/:id`

**Purpose:** Get review details

**Integrated Components:**

- Review detail view
- Review moderation interface

### `PUT /api/reviews/:id`

**Purpose:** Update review

**Integrated Components:**

- Review edit form

### `DELETE /api/reviews/:id`

**Purpose:** Delete review

**Integrated Components:**

- Review management interface
- User review deletion

### `POST /api/reviews/:id/helpful`

**Purpose:** Mark review as helpful

**Integrated Components:**

- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - "Helpful" button on reviews

---

## Coupon APIs

### `GET /api/coupons`

**Purpose:** Get available coupons

**Integrated Components:**

- Coupon listing page
- Admin coupon management

### `GET /api/coupons/:code/validate`

**Purpose:** Validate coupon code

**Integrated Components:**

- `CartPage` (`src/app/cart/page.jsx`)
  - Coupon validation before applying
- `CartContext` (`src/context/CartContext.jsx`)
  - Validates coupon in `applyCoupon` function

---

## Recently Viewed APIs

### `GET /api/recently-viewed`

**Purpose:** Get recently viewed products

**Integrated Components:**

- `RecentlyViewedProducts` component (`src/components/Home/RecentlyViewedProducts.jsx`)
  - Displays recently viewed products carousel

### `POST /api/recently-viewed`

**Purpose:** Add product to recently viewed

**Integrated Components:**

- `ProductDetails` page (`src/app/product-details/[id]/page.jsx`)
  - Tracks product view on page load

---

## Admin APIs

### Dashboard APIs

#### `GET /api/admin/dashboard/stats`

**Purpose:** Get dashboard statistics

**Integrated Components:**

- Admin `DashboardStats` component (`src/components/Admin/DashboardStats.jsx`)
  - Main dashboard overview

#### `GET /api/admin/dashboard/revenue`

**Purpose:** Get revenue data

**Integrated Components:**

- Admin `RevenueChart` component (`src/components/Admin/RevenueChart.jsx`)
  - Revenue charts and graphs

#### `GET /api/admin/dashboard/orders`

**Purpose:** Get order statistics

**Integrated Components:**

- Admin `OrdersChart` component (`src/components/Admin/OrdersChart.jsx`)
  - Order statistics visualization

#### `GET /api/admin/dashboard/top-products`

**Purpose:** Get top-selling products

**Integrated Components:**

- Admin `TopProducts` component (`src/components/Admin/TopProducts.jsx`)
  - Top products list

#### `GET /api/admin/dashboard/user-registrations`

**Purpose:** Get user registration statistics

**Integrated Components:**

- Admin `UserRegistrations` component (`src/components/Admin/UserRegistrations.jsx`)
  - User registration charts

#### `GET /api/admin/dashboard/abandoned-carts`

**Purpose:** Get abandoned cart statistics

**Integrated Components:**

- Admin `AbandonedCartStats` component (`src/components/Admin/AbandonedCartStats.jsx`)
  - Abandoned cart analytics

### Order Management APIs

#### `GET /api/admin/orders`

**Purpose:** Get all orders (with filters)

**Integrated Components:**

- Admin `OrderList` component (`src/components/Admin/Orders/OrderList.jsx`)
  - Order management table

#### `GET /api/admin/orders/:id`

**Purpose:** Get order details

**Integrated Components:**

- Admin `OrderDetails` component (`src/components/Admin/Orders/OrderDetails.jsx`)
  - Detailed order view

#### `PUT /api/admin/orders/:id/status`

**Purpose:** Update order status

**Integrated Components:**

- Admin `OrderDetails` component (`src/components/Admin/Orders/OrderDetails.jsx`)
  - Status update dropdown

#### `POST /api/admin/orders/:id/cancel`

**Purpose:** Cancel order (Admin)

**Integrated Components:**

- Admin `OrderDetails` component (`src/components/Admin/Orders/OrderDetails.jsx`)
  - Cancel order action

#### `POST /api/admin/orders/:id/approve-return`

**Purpose:** Approve return request

**Integrated Components:**

- Admin `OrderDetails` component (`src/components/Admin/Orders/OrderDetails.jsx`)
  - Approve return button

#### `POST /api/admin/orders/:id/reject-return`

**Purpose:** Reject return request

**Integrated Components:**

- Admin `OrderDetails` component (`src/components/Admin/Orders/OrderDetails.jsx`)
  - Reject return button

#### `POST /api/admin/orders/:id/process-refund`

**Purpose:** Process refund

**Integrated Components:**

- Admin `OrderDetails` component (`src/components/Admin/Orders/OrderDetails.jsx`)
  - Process refund button

### User Management APIs

#### `GET /api/admin/users`

**Purpose:** Get all users (with filters)

**Integrated Components:**

- Admin `UserList` component (`src/components/Admin/Users/UserList.jsx`)
  - User management table

#### `GET /api/admin/users/:id`

**Purpose:** Get user details

**Integrated Components:**

- Admin `UserDetails` component (`src/components/Admin/Users/UserDetails.jsx`)
  - Detailed user view

#### `PUT /api/admin/users/:id/block`

**Purpose:** Block user

**Integrated Components:**

- Admin `UserDetails` component (`src/components/Admin/Users/UserDetails.jsx`)
  - Block user button

#### `PUT /api/admin/users/:id/unblock`

**Purpose:** Unblock user

**Integrated Components:**

- Admin `UserDetails` component (`src/components/Admin/Users/UserDetails.jsx`)
  - Unblock user button

#### `PUT /api/admin/users/:id/role`

**Purpose:** Update user role

**Integrated Components:**

- Admin `UserDetails` component (`src/components/Admin/Users/UserDetails.jsx`)
  - Role change dropdown

### Coupon Management APIs

#### `GET /api/admin/coupons`

**Purpose:** Get all coupons

**Integrated Components:**

- Admin `CouponList` component (`src/components/Admin/Coupons/CouponList.jsx`)
  - Coupon management table

#### `POST /api/admin/coupons`

**Purpose:** Create coupon

**Integrated Components:**

- Admin `CouponForm` component (`src/components/Admin/Coupons/CouponForm.jsx`)
  - Create coupon form

#### `PUT /api/admin/coupons/:id`

**Purpose:** Update coupon

**Integrated Components:**

- Admin `CouponForm` component (`src/components/Admin/Coupons/CouponForm.jsx`)
  - Edit coupon form

#### `DELETE /api/admin/coupons/:id`

**Purpose:** Delete coupon

**Integrated Components:**

- Admin `CouponList` component (`src/components/Admin/Coupons/CouponList.jsx`)
  - Delete action

### Flash Sale APIs

#### `GET /api/admin/flash-sales`

**Purpose:** Get all flash sales

**Integrated Components:**

- Admin `FlashSaleManager` component (`src/components/Admin/Coupons/FlashSaleManager.jsx`)
  - Flash sale management

#### `POST /api/admin/flash-sales`

**Purpose:** Create flash sale

**Integrated Components:**

- Admin `FlashSaleManager` component (`src/components/Admin/Coupons/FlashSaleManager.jsx`)
  - Create flash sale form

### Payment Management APIs

#### `GET /api/admin/payments`

**Purpose:** Get all payments

**Integrated Components:**

- Admin `PaymentHistory` component (`src/components/Admin/Payments/PaymentHistory.jsx`)
  - Payment history table

#### `GET /api/admin/payments/:id`

**Purpose:** Get payment details

**Integrated Components:**

- Admin payment detail view

### Refund Management APIs

#### `GET /api/admin/refunds`

**Purpose:** Get all refunds

**Integrated Components:**

- Admin `RefundManagement` component (`src/components/Admin/Payments/RefundManagement.jsx`)
  - Refund management table

#### `POST /api/admin/refunds/:id/approve`

**Purpose:** Approve refund

**Integrated Components:**

- Admin `RefundManagement` component (`src/components/Admin/Payments/RefundManagement.jsx`)
  - Approve refund action

#### `POST /api/admin/refunds/:id/reject`

**Purpose:** Reject refund

**Integrated Components:**

- Admin `RefundManagement` component (`src/components/Admin/Payments/RefundManagement.jsx`)
  - Reject refund action

### Settings APIs

#### `GET /api/admin/settings/website`

**Purpose:** Get website settings

**Integrated Components:**

- Admin `WebsiteSettings` component (`src/components/Admin/Settings/WebsiteSettings.jsx`)
  - Website configuration

#### `PUT /api/admin/settings/website`

**Purpose:** Update website settings

**Integrated Components:**

- Admin `WebsiteSettings` component (`src/components/Admin/Settings/WebsiteSettings.jsx`)
  - Settings update form

#### `GET /api/admin/settings/shipping`

**Purpose:** Get shipping settings

**Integrated Components:**

- Admin shipping settings page

#### `GET /api/admin/settings/tax-rates`

**Purpose:** Get tax rates

**Integrated Components:**

- Admin `TaxManagement` component (`src/components/Admin/Payments/TaxManagement.jsx`)
  - Tax rate management

#### `GET /api/admin/settings/maintenance`

**Purpose:** Get maintenance mode status

**Integrated Components:**

- Admin `MaintenanceMode` component (`src/components/Admin/Settings/MaintenanceMode.jsx`)
  - Maintenance mode toggle

### Reports APIs

#### `GET /api/admin/reports/sales`

**Purpose:** Get sales reports

**Integrated Components:**

- Admin reports page
- Sales analytics dashboard

#### `GET /api/admin/reports/orders`

**Purpose:** Get order reports

**Integrated Components:**

- Admin reports page
- Order analytics

#### `GET /api/admin/reports/products`

**Purpose:** Get product reports

**Integrated Components:**

- Admin reports page
- Product performance analytics

---

## Notes

1. **Context Providers**: Many APIs are accessed through React Context providers (`CartContext`, `WishlistContext`) which handle API calls internally.

2. **Current Implementation**: Some components currently use local storage or mock data. These should be migrated to use the corresponding APIs listed above.

3. **Authentication**: Most APIs require authentication. Ensure proper token handling in API calls.

4. **Error Handling**: All components should implement proper error handling for API failures.

5. **Loading States**: Components should show loading states while API calls are in progress.

6. **Pagination**: List APIs support pagination - ensure components handle pagination correctly.

---

## Integration Status

- ✅ **Fully Integrated**: APIs that are currently integrated with components
- 🔄 **Partially Integrated**: APIs that are partially integrated (may use local storage as fallback)
- ⏳ **Pending Integration**: APIs that exist but are not yet integrated with components

**Note**: This document reflects the intended API-component integration. Some components may currently use mock data or local storage and need to be migrated to use the actual APIs.
