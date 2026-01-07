# FluxFit API Documentation

## Overview

This document lists all the APIs for the FluxFit e-commerce platform. The APIs are organized by feature areas with implementation status indicators.

**Total API Endpoints: 134**

**Status Legend:**

- ✅ **Implemented** - Fully functional API endpoint
- 🚧 **In Progress** - Partially implemented or being worked on
- ⏳ **Planned** - Route file exists but not yet implemented
- 📝 **Missing** - Not yet created

**Current Implementation Status:**

- **Implemented:** ~11 endpoints (Authentication routes)
- **In Progress:** ~0 endpoints
- **Planned:** ~123 endpoints (Route files exist but need implementation)

---

## 1. Authentication & User Management (12 APIs)

### 1.1 Authentication

- ✅ `POST /api/auth/register` - User registration
- ✅ `POST /api/auth/login` - User login
- ✅ `POST /api/auth/logout` - User logout
- ✅ `POST /api/auth/refresh-token` - Refresh access token
- ✅ `POST /api/auth/forgot-password` - Request password reset
- ✅ `POST /api/auth/reset-password` - Reset password with token
- ✅ `POST /api/auth/verify-email` - Verify email address
- ✅ `POST /api/auth/resend-otp` - Resend verification email (resend-otp endpoint)

### 1.2 User Profile

- ✅ `GET /api/users/profile` - Get current user profile
- ✅ `PUT /api/users/profile` - Update user profile
- ✅ `PUT /api/users/password` - Change password
- ✅ `GET /api/users/addresses` - Get user addresses
- ✅ `POST /api/users/addresses` - Add new address
- ✅ `PUT /api/users/addresses/:id` - Update address
- ✅ `DELETE /api/users/addresses/:id` - Delete address
- ✅ `PUT /api/users/addresses/:id/default` - Set default address

---

## 2. Products (15 APIs)

### 2.1 Product CRUD

- ✅ `GET /api/products` - Get all products (with pagination, filters, search)
- ✅ `GET /api/products/:id` - Get product by ID
- ✅ `POST /api/products` - Create new product (Admin)
- ✅ `PUT /api/products/:id` - Update product (Admin)
- ✅ `DELETE /api/products/:id` - Delete product (Admin)
- ✅ `POST /api/products/bulk-upload` - Bulk upload products via CSV (Admin)

### 2.2 Product Variants

- ✅ `GET /api/products/:id/variants` - Get product variants
- ✅ `POST /api/products/:id/variants` - Add product variant (Admin)
- ✅ `PUT /api/products/:id/variants/:variantId` - Update variant (Admin)
- ✅ `DELETE /api/products/:id/variants/:variantId` - Delete variant (Admin)

### 2.3 Product Inventory

- ✅ `GET /api/products/:id/stock` - Get product stock
- ✅ `PUT /api/products/:id/stock` - Update product stock (Admin)
- ✅ `POST /api/products/:id/stock/adjust` - Adjust stock (Admin)

### 2.4 Product Search & Filter

- ✅ `GET /api/products/search` - Search products
- ✅ `GET /api/products/filters` - Get available filters (categories, colors, price ranges)

---

## 3. Categories & Brands (10 APIs)

### 3.1 Categories

- ✅ `GET /api/categories` - Get all categories (tree structure)
- ✅ `GET /api/categories/:id` - Get category by ID
- ✅ `POST /api/categories` - Create category (Admin)
- ✅ `PUT /api/categories/:id` - Update category (Admin)
- ✅ `DELETE /api/categories/:id` - Delete category (Admin)
- ✅ `PUT /api/categories/:id/sort-order` - Update sort order (Admin)

### 3.2 Brands

- ✅ `GET /api/brands` - Get all brands
- ✅ `GET /api/brands/:id` - Get brand by ID
- ✅ `POST /api/brands` - Create brand (Admin)
- ✅ `PUT /api/brands/:id` - Update brand (Admin)
- ✅ `DELETE /api/brands/:id` - Delete brand (Admin)

---

## 4. Shopping Cart (7 APIs)

- ✅ `GET /api/cart` - Get user's cart
- ✅ `POST /api/cart/items` - Add item to cart
- ✅ `PUT /api/cart/items/:itemId` - Update cart item quantity
- ✅ `DELETE /api/cart/items/:itemId` - Remove item from cart
- ✅ `DELETE /api/cart` - Clear entire cart
- ✅ `POST /api/cart/apply-coupon` - Apply coupon code
- ✅ `DELETE /api/cart/coupon` - Remove applied coupon

---

## 5. Wishlist (5 APIs)

- ⏳ `GET /api/wishlist` - Get user's wishlist
- ⏳ `POST /api/wishlist/items` - Add item to wishlist
- ⏳ `DELETE /api/wishlist/items/:itemId` - Remove item from wishlist
- ⏳ `DELETE /api/wishlist` - Clear wishlist
- ⏳ `GET /api/wishlist/check/:productId` - Check if product is in wishlist

---

## 6. Orders (18 APIs)

### 6.1 Order Management (User)

- ⏳ `GET /api/orders` - Get user's orders (with filters)
- ⏳ `GET /api/orders/:id` - Get order details
- ⏳ `POST /api/orders` - Create new order
- ⏳ `POST /api/orders/:id/cancel` - Cancel order
- ⏳ `POST /api/orders/:id/return` - Request return
- ⏳ `POST /api/orders/:id/refund` - Request refund
- ⏳ `GET /api/orders/:id/invoice` - Download invoice (PDF/HTML)
- ⏳ `POST /api/orders/:id/reorder` - Reorder items

### 6.2 Order Management (Admin)

- ⏳ `GET /api/admin/orders` - Get all orders (with filters, pagination)
- ⏳ `GET /api/admin/orders/:id` - Get order details (Admin)
- ⏳ `PUT /api/admin/orders/:id/status` - Update order status
- ⏳ `PUT /api/admin/orders/:id/assign-delivery` - Assign delivery partner
- ⏳ `POST /api/admin/orders/:id/cancel` - Cancel order (Admin)
- ⏳ `POST /api/admin/orders/:id/partial-cancel` - Partial cancel (Admin)
- ⏳ `POST /api/admin/orders/:id/approve-return` - Approve return request
- ⏳ `POST /api/admin/orders/:id/reject-return` - Reject return request
- ⏳ `POST /api/admin/orders/:id/process-refund` - Process refund
- ⏳ `GET /api/admin/orders/:id/invoice` - Generate invoice (Admin)

---

## 7. Payments (12 APIs)

### 7.1 Payment Processing

- ⏳ `POST /api/payments/create-intent` - Create payment intent (Stripe/Razorpay)
- ⏳ `POST /api/payments/verify` - Verify payment
- ⏳ `POST /api/payments/webhook` - Payment webhook handler
- ⏳ `GET /api/payments/methods` - Get available payment methods

### 7.2 Payment History

- ⏳ `GET /api/payments` - Get user's payment history
- ⏳ `GET /api/payments/:id` - Get payment details
- ⏳ `GET /api/admin/payments` - Get all payments (Admin)
- ⏳ `GET /api/admin/payments/:id` - Get payment details (Admin)

### 7.3 Refunds

- ⏳ `GET /api/admin/refunds` - Get all refund requests (Admin)
- ⏳ `POST /api/admin/refunds/:id/approve` - Approve refund
- ⏳ `POST /api/admin/refunds/:id/reject` - Reject refund
- ⏳ `GET /api/admin/refunds/reports` - Get refund reports

---

## 8. Coupons & Offers (10 APIs)

### 8.1 Coupons

- ⏳ `GET /api/coupons` - Get active coupons (Public)
- ⏳ `GET /api/coupons/:code/validate` - Validate coupon code
- ⏳ `GET /api/admin/coupons` - Get all coupons (Admin)
- ⏳ `GET /api/admin/coupons/:id` - Get coupon details (Admin)
- ⏳ `POST /api/admin/coupons` - Create coupon (Admin)
- ⏳ `PUT /api/admin/coupons/:id` - Update coupon (Admin)
- ⏳ `DELETE /api/admin/coupons/:id` - Delete coupon (Admin)
- ⏳ `GET /api/admin/coupons/:id/usage` - Get coupon usage statistics

### 8.2 Flash Sales

- ⏳ `GET /api/flash-sales` - Get active flash sales (Public)
- ⏳ `GET /api/admin/flash-sales` - Get all flash sales (Admin)
- ⏳ `POST /api/admin/flash-sales` - Create flash sale (Admin)
- ⏳ `PUT /api/admin/flash-sales/:id` - Update flash sale (Admin)
- ⏳ `DELETE /api/admin/flash-sales/:id` - Delete flash sale (Admin)

---

## 9. Admin Dashboard & Analytics (12 APIs)

### 9.1 Dashboard Statistics

- ⏳ `GET /api/admin/dashboard/stats` - Get dashboard statistics (sales, revenue, orders, users)
- ⏳ `GET /api/admin/dashboard/revenue` - Get revenue data (daily/monthly)
- ⏳ `GET /api/admin/dashboard/orders` - Get order statistics by status
- ⏳ `GET /api/admin/dashboard/top-products` - Get top-selling products
- ⏳ `GET /api/admin/dashboard/abandoned-carts` - Get abandoned cart statistics
- ⏳ `GET /api/admin/dashboard/user-registrations` - Get user registration trends

### 9.2 Reports & Exports

- ⏳ `GET /api/admin/reports/sales` - Generate sales report
- ⏳ `GET /api/admin/reports/orders` - Generate orders report
- ⏳ `GET /api/admin/reports/products` - Generate products report
- ⏳ `GET /api/admin/reports/export` - Export data (CSV/Excel)
- ⏳ `GET /api/admin/reports/custom` - Generate custom report

---

## 10. User Management (Admin) (8 APIs)

- ⏳ `GET /api/admin/users` - Get all users (with filters, pagination)
- ⏳ `GET /api/admin/users/:id` - Get user details
- ⏳ `PUT /api/admin/users/:id/block` - Block user
- ⏳ `PUT /api/admin/users/:id/unblock` - Unblock user
- ⏳ `PUT /api/admin/users/:id/role` - Update user role
- ⏳ `POST /api/admin/users/:id/reset-password` - Reset user password (Admin)
- ⏳ `GET /api/admin/users/:id/orders` - Get user's order history
- ⏳ `GET /api/admin/users/:id/activity` - Get user activity log

---

## 11. Settings & Configuration (10 APIs)

### 11.1 Website Settings

- ⏳ `GET /api/admin/settings/website` - Get website settings
- ⏳ `PUT /api/admin/settings/website` - Update website settings

### 11.2 Currency & Tax

- ⏳ `GET /api/admin/settings/currency-tax` - Get currency and tax settings
- ⏳ `PUT /api/admin/settings/currency-tax` - Update currency and tax settings
- ⏳ `GET /api/admin/settings/tax-rates` - Get tax rates
- ⏳ `POST /api/admin/settings/tax-rates` - Add tax rate
- ⏳ `PUT /api/admin/settings/tax-rates/:id` - Update tax rate
- ⏳ `DELETE /api/admin/settings/tax-rates/:id` - Delete tax rate

### 11.3 Shipping

- ⏳ `GET /api/admin/settings/shipping` - Get shipping rules
- ⏳ `PUT /api/admin/settings/shipping` - Update shipping rules
- ⏳ `GET /api/admin/settings/shipping-rules` - Get shipping rules list
- ⏳ `POST /api/admin/settings/shipping-rules` - Add shipping rule
- ⏳ `PUT /api/admin/settings/shipping-rules/:id` - Update shipping rule
- ⏳ `DELETE /api/admin/settings/shipping-rules/:id` - Delete shipping rule

### 11.4 Email/SMS Templates

- ⏳ `GET /api/admin/settings/email-templates` - Get email templates
- ⏳ `PUT /api/admin/settings/email-templates/:id` - Update email template
- ⏳ `GET /api/admin/settings/sms-templates` - Get SMS templates
- ⏳ `PUT /api/admin/settings/sms-templates/:id` - Update SMS template

### 11.5 API Keys

- ⏳ `GET /api/admin/settings/api-keys` - Get API keys (masked)
- ⏳ `POST /api/admin/settings/api-keys` - Create API key
- ⏳ `PUT /api/admin/settings/api-keys/:id` - Update API key
- ⏳ `DELETE /api/admin/settings/api-keys/:id` - Delete API key
- ⏳ `POST /api/admin/settings/api-keys/:id/regenerate` - Regenerate API key

### 11.6 Maintenance Mode

- ⏳ `GET /api/admin/settings/maintenance` - Get maintenance mode status
- ⏳ `PUT /api/admin/settings/maintenance` - Update maintenance mode

---

## 12. File Uploads (3 APIs)

- ✅ `POST /api/upload/image` - Upload single image (Cloudinary)
- ✅ `POST /api/upload/images` - Upload multiple images
- ✅ `DELETE /api/upload/:imageId` - Delete uploaded image

---

## 13. Finance & Settlements (5 APIs)

- ⏳ `GET /api/admin/finance/settlements` - Get settlement reports
- ⏳ `GET /api/admin/finance/settlements/:id` - Get settlement details
- ⏳ `POST /api/admin/finance/settlements` - Create settlement
- ⏳ `GET /api/admin/finance/commissions` - Get commission tracking
- ⏳ `GET /api/admin/finance/fraud-detection` - Get fraud detection alerts

---

## 14. Recently Viewed (2 APIs)

- ⏳ `GET /api/recently-viewed` - Get recently viewed products
- ⏳ `POST /api/recently-viewed` - Add product to recently viewed

---

## 15. Reviews & Ratings (6 APIs)

- ⏳ `GET /api/products/:id/reviews` - Get product reviews
- ⏳ `POST /api/products/:id/reviews` - Add product review
- ⏳ `PUT /api/reviews/:id` - Update review
- ⏳ `DELETE /api/reviews/:id` - Delete review
- ⏳ `POST /api/reviews/:id/helpful` - Mark review as helpful
- ⏳ `GET /api/admin/reviews` - Get all reviews (Admin, with moderation)

---

## API Summary by Category

| Category                         | Count   |
| -------------------------------- | ------- |
| Authentication & User Management | 12      |
| Products                         | 15      |
| Categories & Brands              | 10      |
| Shopping Cart                    | 7       |
| Wishlist                         | 5       |
| Orders                           | 18      |
| Payments                         | 12      |
| Coupons & Offers                 | 10      |
| Admin Dashboard & Analytics      | 12      |
| User Management (Admin)          | 8       |
| Settings & Configuration         | 10      |
| File Uploads                     | 3       |
| Finance & Settlements            | 5       |
| Recently Viewed                  | 2       |
| Reviews & Ratings                | 6       |
| **TOTAL**                        | **134** |

**Note:** Additional root endpoints exist in the codebase but are not counted in the total as they serve as organizational routes.

---

## Priority Levels

### High Priority (Core Functionality) - ~60 APIs

- Authentication & User Management
- Products (CRUD, Search, Filter)
- Shopping Cart
- Orders (Create, View, Cancel, Return)
- Payments (Create, Verify)
- Coupons (Validate, Apply)
- File Uploads

### Medium Priority (Enhanced Features) - ~45 APIs

- Wishlist
- Admin Dashboard & Analytics
- User Management (Admin)
- Order Management (Admin)
- Payment History & Refunds
- Categories & Brands
- Settings & Configuration

### Low Priority (Nice to Have) - ~29 APIs

- Reviews & Ratings
- Recently Viewed
- Finance & Settlements
- Advanced Analytics
- Flash Sales
- Fraud Detection

---

## Technology Recommendations

### Backend Framework

- **Node.js with Express** or **Next.js API Routes**
- **TypeScript** for type safety
- **MongoDB with Mongoose** for database
- **JWT** for authentication
- **Bcrypt** for password hashing

### Payment Integration

- **Stripe** - Payment processing
- **Razorpay** - Indian payment gateway
- **Webhook handlers** for payment verification

### File Storage

- **Cloudinary** - Image upload and management
- **AWS S3** (Alternative)

### Additional Services

- **Nodemailer** - Email notifications
- **Twilio** - SMS notifications
- **Redis** - Caching and session management
- **Bull Queue** - Background job processing

---

## API Response Format

All APIs should follow a consistent response format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "errors": []
}
```

### Error Response Format

```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## Authentication

Most APIs require authentication via JWT token:

```
Authorization: Bearer <token>
```

Admin APIs require admin role:

```
Authorization: Bearer <admin_token>
X-Role: admin
```

---

## Pagination

List endpoints should support pagination:

```
GET /api/products?page=1&limit=20&sort=createdAt&order=desc
```

Response:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## Filtering & Search

Support query parameters for filtering:

```
GET /api/products?category=Women&minPrice=1000&maxPrice=5000&color=red&search=t-shirt
```

---

## Rate Limiting

Implement rate limiting for:

- Authentication endpoints (5 requests/minute)
- Payment endpoints (10 requests/minute)
- General APIs (100 requests/minute)
- Admin APIs (200 requests/minute)

---

## Notes

1. **Total APIs Planned: 134 endpoints**
2. **Currently Implemented: ~14 endpoints** (Authentication + File Uploads)
3. **Route Files Created: ~133 route files** (most are placeholders)
4. **Start with High Priority APIs** (~60 APIs) for MVP
5. **Use RESTful conventions** for URL structure
6. **Implement proper error handling** and validation
7. **Add API documentation** using Swagger/OpenAPI
8. **Implement caching** for frequently accessed data
9. **Add logging and monitoring** for all API calls
10. **Implement API versioning** (e.g., `/api/v1/...`)

## Additional Endpoints Found

The following additional endpoints exist in the codebase but are not listed above:

- `POST /api/auth/verify-otp` - Generic OTP verification
- `POST /api/auth/verify-forgot-pass-otp` - Verify forgot password OTP
- `GET /api/test-db` - Database connection test endpoint
- `GET /api/admin/route.js` - Admin root endpoint
- `GET /api/admin/settings/route.js` - Settings root endpoint
- `GET /api/admin/finance/route.js` - Finance root endpoint
- `GET /api/admin/reports/route.js` - Reports root endpoint
- `GET /api/admin/refunds/route.js` - Refunds root endpoint
- `GET /api/admin/payments/route.js` - Payments root endpoint
- `GET /api/admin/orders/route.js` - Orders root endpoint
- `GET /api/admin/flash-sales/route.js` - Flash sales root endpoint
- `GET /api/admin/coupons/route.js` - Coupons root endpoint
- `GET /api/admin/users/route.js` - Users root endpoint
- `GET /api/admin/reviews/route.js` - Reviews root endpoint
- `GET /api/admin/dashboard/route.js` - Dashboard root endpoint
- `GET /api/users/route.js` - Users root endpoint
- `GET /api/upload/route.js` - Upload root endpoint
- `GET /api/reviews/route.js` - Reviews root endpoint
- `GET /api/coupons/route.js` - Coupons root endpoint
- `GET /api/flash-sales/route.js` - Flash sales root endpoint
- `GET /api/categories/route.js` - Categories root endpoint
- `GET /api/brands/route.js` - Brands root endpoint
- `GET /api/cart/route.js` - Cart root endpoint
- `GET /api/wishlist/route.js` - Wishlist root endpoint
- `GET /api/orders/route.js` - Orders root endpoint
- `GET /api/payments/route.js` - Payments root endpoint
- `GET /api/products/route.js` - Products root endpoint
- `GET /api/recently-viewed/route.js` - Recently viewed root endpoint
- `GET /api/auth/route.js` - Auth root endpoint

---

## Development Phases

### Phase 1: Core E-commerce (Weeks 1-4)

- Authentication & User Management
- Products (CRUD, Search)
- Shopping Cart
- Orders (Create, View)
- Basic Payments

### Phase 2: Enhanced Features (Weeks 5-8)

- Wishlist
- Order Management (Cancel, Return)
- Coupons
- Admin Dashboard (Basic)
- File Uploads

### Phase 3: Admin Features (Weeks 9-12)

- Admin Product Management
- Admin Order Management
- User Management (Admin)
- Settings & Configuration
- Analytics & Reports

### Phase 4: Advanced Features (Weeks 13-16)

- Reviews & Ratings
- Advanced Analytics
- Finance & Settlements
- Flash Sales
- Fraud Detection

---

**Last Updated:** 2024
**Version:** 1.0
