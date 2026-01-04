# FluxFit

**FluxFit** is a modern e-commerce platform specializing in custom clothing and printing services. From t-shirts and jackets to hoodies and shirts, FluxFit offers premium quality apparel with personalized designs, allowing customers to express their unique style and creativity.

## 🌟 About

FluxFit is your premier destination for custom clothing and printing services. We specialize in printing any kind of design on clothes - from simple text and logos to intricate artwork and full-color graphics. Whether you're looking for personalized t-shirts, stylish jackets, comfortable hoodies, or any other apparel, we have the expertise and technology to bring your vision to life.

## ✨ Features

### E-Commerce Features

- **Product Catalog**: Browse through a wide range of clothing items including:
  - T-Shirts
  - Jackets & Hoodies
  - Shirts
  - Bags
  - Shoes
  - Watches
- **Product Details**: Comprehensive product pages with:
  - Multiple product images
  - Size and color selection
  - Product descriptions and features
  - Ratings and reviews
  - Related products recommendations
- **Shopping Cart**: Add items to cart with quantity management
- **Product Filtering**: Advanced filtering by:
  - Category
  - Price range
  - Color
  - Tags
  - Search functionality
- **Product Sorting**: Sort by newness, popularity, rating, and price
- **Wishlist**: Save favorite products for later
- **Recently Viewed**: Track and display recently viewed products

### Checkout & Payment

- **Multi-Step Checkout Process**:
  - Delivery address selection and management
  - Multiple payment methods (Card, UPI, Net Banking, COD, Razorpay, Stripe, PayPal)
  - Order review and confirmation
- **Address Management**:
  - Add, edit, and delete delivery addresses
  - Set default address
  - Multiple address types (Home, Work, Other)
- **Payment Options**:
  - Credit/Debit Card with secure form
  - UPI payment
  - Net Banking
  - Cash on Delivery (COD)
  - Payment gateways (Razorpay, Stripe, PayPal)
- **Coupon System**: Apply discount coupons during checkout
- **Pricing**: All prices in Indian Rupees (INR) with proper formatting
- **Order Confirmation**: Detailed confirmation page with invoice download

### Order Management

- **Order Tracking**:
  - View all orders in one place
  - Search orders by ID or product name
  - Filter orders by status
  - Order status timeline with visual progress
- **Order Details**:
  - Complete order information
  - Status timeline with timestamps
  - Delivery address and payment details
  - Order items with images and specifications
- **Order Actions**:
  - **Cancel Order**: Cancel orders with reason selection (for confirmed/processing orders)
  - **Return Request**: Request returns with item selection and reason
  - **Refund Request**: Request refunds for cancelled/returned orders
  - **Download Invoice**: Generate and download HTML invoices
  - **Reorder**: Add all items from previous order to cart with one click
- **Order Statuses**:
  - Confirmed
  - Processing
  - Shipped
  - Delivered
  - Cancelled
  - Returned
  - Refunded

### Custom Printing Services

- Custom design printing on all apparel
- Full-color printing with vibrant, long-lasting colors
- Bulk order support for businesses and events
- Quality assurance on all products

### Admin Dashboard

- **Modern Sidebar Navigation**:

  - Glassmorphism/blur effect with smooth animations
  - Collapsible sidebar with icon-only mode
  - Hover to expand, hover-out to collapse
  - Click outside to collapse functionality
  - Smooth spring-based animations using Framer Motion
  - Responsive content area that adjusts dynamically
  - Persistent sidebar state using localStorage
  - Centered icons when collapsed for better UX

- **Dashboard & Analytics**:

  - Total sales, revenue, orders, and users statistics
  - Revenue trend charts (daily/monthly)
  - Order count by status visualization
  - Top-selling products with revenue tracking
  - Abandoned cart statistics
  - User registration trends
  - Daily/monthly reports
  - Export data to CSV/Excel format

- **Product Management**:

  - Complete CRUD operations for products
  - Bulk product upload via CSV
  - Image upload with Cloudinary integration
  - Product variants (size, color, price, stock, SKU)
  - Inventory and stock control
  - Product approval workflow
  - SEO fields (meta title, slug, description, keywords)
  - Advanced search and filtering

- **Category & Brand Management**:

  - Category tree structure with subcategories
  - Brand CRUD operations
  - Category banners and images
  - Sort order control
  - Hierarchical category organization

- **Order Management (Admin)**:

  - View all customer orders
  - Change order status with timeline tracking
  - Assign delivery partners
  - Generate invoices
  - Handle returns and refunds
  - Cancel or partially cancel orders
  - Advanced filtering and search

- **User Management**:

  - View all registered users
  - Block/unblock user accounts
  - View user order history
  - Reset user passwords
  - User role control and permissions

- **Coupon & Offer Management**:

  - Create and manage discount coupons
  - Discount rules (flat amount or percentage)
  - Usage limits and expiry dates
  - Flash sale scheduling
  - Coupon performance tracking

- **Payment & Finance**:

  - Complete payment history
  - Refund management and processing
  - Settlement reports (multi-vendor support)
  - Tax (GST) calculation and management
  - Commission tracking
  - Fraud detection and monitoring

- **Settings & Configuration**:
  - Website settings (name, logo, contact info)
  - Currency and tax configuration
  - Shipping rules and methods
  - Email/SMS template management
  - API keys management
  - Maintenance mode control

### User Experience

- **Responsive Design**: Fully responsive across all devices (mobile, tablet, desktop)
- **Smooth Animations**: Powered by Framer Motion with spring physics for natural, fluid interactions
- **Modern UI**: Built with Tailwind CSS and Ant Design for a clean, modern interface
- **Glassmorphism Effects**: Beautiful blur effects and transparent backgrounds for modern aesthetics
- **Interactive Sidebar**: Collapsible admin sidebar with hover interactions and smooth transitions
- **Fast Performance**: Optimized Next.js application with React Compiler
- **State Persistence**: Sidebar and user preferences saved to localStorage for seamless experience

## 🛠️ Tech Stack

### Frontend

- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Ant Design (antd)** - UI component library
- **Tabler Icons** - Icon library
- **Recharts** - Data visualization and charts
- **dayjs** - Date manipulation and formatting
- **date-fns** - Date utility functions

### Backend & Services

- **MongoDB (Mongoose)** - Database with comprehensive schema models
- **Stripe** - Payment processing
- **Cloudinary** - Image management and uploads
- **JWT** - Authentication with secure token management
- **Bcrypt** - Password hashing and security
- **LocalStorage** - Client-side data persistence (cart, orders, addresses, wishlist)

### Development Tools

- **ESLint** - Code linting
- **TypeScript** (ready for migration)
- **React Compiler** - Performance optimization
- **CSV Parser** - Bulk data import/export

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd fluxfit
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file (see Environment Variables section above)

4. Connect to MongoDB:

Make sure MongoDB is running locally or update `MONGODB_URI` in `.env.local` for MongoDB Atlas

5. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
fluxfit/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.js            # Home page
│   │   ├── about/             # About page
│   │   ├── product-list/      # Product listing page
│   │   ├── product-details/   # Product detail pages
│   │   ├── cart/              # Shopping cart page
│   │   ├── wishlist/          # Wishlist page
│   │   ├── checkout/          # Checkout pages
│   │   │   ├── page.jsx       # Main checkout page
│   │   │   └── confirmation/  # Order confirmation page
│   │   ├── orders/            # Order management pages
│   │   │   ├── page.jsx       # Orders list page
│   │   │   └── [id]/          # Order details page
│   │   ├── admin/             # Admin dashboard pages
│   │   │   ├── page.jsx       # Admin dashboard (analytics)
│   │   │   ├── products/      # Product management
│   │   │   ├── categories/    # Category & brand management
│   │   │   ├── orders/        # Admin order management
│   │   │   ├── users/         # User management
│   │   │   ├── coupons/       # Coupon & offer management
│   │   │   ├── payments/      # Payment & finance
│   │   │   └── settings/      # Settings & configuration
│   │   └── contact/           # Contact page
│   ├── components/            # React components
│   │   ├── About/             # About section components
│   │   ├── Checkout/          # Checkout components
│   │   │   ├── AddressStep.jsx    # Address selection step
│   │   │   ├── PaymentStep.jsx     # Payment method step
│   │   │   └── ReviewStep.jsx      # Order review step
│   │   ├── Admin/             # Admin dashboard components
│   │   │   ├── DashboardStats.jsx      # Dashboard statistics
│   │   │   ├── RevenueChart.jsx        # Revenue visualization
│   │   │   ├── OrdersChart.jsx         # Orders visualization
│   │   │   ├── TopProducts.jsx         # Top products table
│   │   │   ├── AbandonedCartStats.jsx  # Abandoned cart stats
│   │   │   ├── UserRegistrations.jsx   # User registration chart
│   │   │   ├── AdminSidebar.jsx        # Admin navigation with collapsible sidebar
│   │   │   ├── AdminContent.js         # Dynamic content wrapper with responsive margins
│   │   │   ├── Products/              # Product management components
│   │   │   ├── Categories/            # Category & brand components
│   │   │   ├── Orders/                # Admin order components
│   │   │   ├── Users/                 # User management components
│   │   │   ├── Coupons/               # Coupon management components
│   │   │   ├── Payments/              # Payment management components
│   │   │   └── Settings/             # Settings components
│   │   ├── ContactUs/         # Contact form component
│   │   ├── Footer/            # Footer component
│   │   ├── GetInTouch/        # Get in touch section
│   │   ├── Header/            # Navigation component
│   │   ├── Home/              # Home page components
│   │   └── ui/                # Reusable UI components
│   ├── contexts/              # React Context providers
│   │   ├── CartContext.jsx    # Shopping cart state management
│   │   ├── WishlistContext.jsx # Wishlist state management
│   │   └── SidebarContext.js   # Admin sidebar state management
│   ├── models/                # MongoDB Mongoose models
│   │   ├── index.js           # Model exports
│   │   ├── user.model.js      # User authentication & profiles
│   │   ├── otp.model.js       # OTP verification (auto-expiring)
│   │   ├── product.model.js   # Products with variants & SEO
│   │   ├── category.model.js  # Hierarchical categories
│   │   ├── brand.model.js     # Brand management
│   │   ├── order.model.js      # Orders with status tracking
│   │   ├── cart.model.js      # Shopping cart
│   │   ├── wishlist.model.js   # User wishlists
│   │   ├── address.model.js    # User addresses
│   │   ├── payment.model.js    # Payment transactions
│   │   ├── refund.model.js    # Refund management
│   │   ├── coupon.model.js    # Discount coupons
│   │   ├── flashsale.model.js  # Flash sale events
│   │   ├── review.model.js    # Product reviews & ratings
│   │   ├── recentlyviewed.model.js # Recently viewed products
│   │   ├── settings.model.js   # Website settings
│   │   ├── shippingrule.model.js # Shipping rules
│   │   ├── taxrate.model.js   # Tax rates (GST/VAT)
│   │   ├── emailtemplate.model.js # Email templates
│   │   ├── smstemplate.model.js  # SMS templates
│   │   ├── apikey.model.js    # API key management
│   │   ├── settlement.model.js # Financial settlements
│   │   └── activitylog.model.js # Activity logging
│   └── lib/                   # Utility functions and data
│       ├── productDatabase.js # Product data
│       ├── recentlyViewed.js  # Recently viewed products
│       ├── formatPrice.js     # Price formatting utilities
│       ├── cloudinary.js      # Cloudinary image upload
│       ├── csvParser.js       # CSV parsing utilities
│       ├── exportData.js      # Data export utilities
│       └── utils.js           # Helper functions
├── public/                    # Static assets
├── package.json
└── README.md
```

## 📄 Pages & Routes

### Customer-Facing Routes

- `/` - Home page with hero banner and product overview
- `/product-list` - Complete product catalog with filtering
- `/product-details/[id]` - Individual product details with related products
- `/cart` - Shopping cart management
- `/wishlist` - Wishlist page for saved products
- `/checkout` - Multi-step checkout process
  - Step 1: Delivery address selection
  - Step 2: Payment method selection
  - Step 3: Order review and confirmation
- `/checkout/confirmation` - Order confirmation page with invoice download
- `/orders` - Order management page (list all orders)
- `/orders/[id]` - Order details page with tracking, cancel, return, and reorder
- `/about` - About FluxFit, our story, services, and founders
- `/contact` - Contact form and information

### Admin Routes

- `/admin` - Admin dashboard with analytics and statistics
- `/admin/products` - Product management (CRUD, bulk upload, variants)
- `/admin/categories` - Category & brand management
- `/admin/orders` - Admin order management and tracking
- `/admin/users` - User management and administration
- `/admin/coupons` - Coupon and flash sale management
- `/admin/payments` - Payment history, refunds, and finance management
- `/admin/settings` - Website settings and configuration

## 🎯 Key Features in Detail

### Product Discovery

- Category-based navigation
- Advanced filtering (price, color, tags)
- Search functionality
- Product recommendations (related products)

### Shopping Experience

- Detailed product pages with multiple images
- Size and color selection
- Quantity management
- Shopping cart with item management
- Product reviews and ratings
- Wishlist functionality
- Recently viewed products

### Checkout Experience

- Streamlined 3-step checkout process
- Address management with multiple saved addresses
- Multiple payment gateway integrations
- Real-time price calculations with tax and shipping
- Coupon code application
- Order confirmation with downloadable invoice

### Order Management Experience

- Complete order history with search and filters
- Visual order status timeline
- Easy order cancellation (when eligible)
- Return and refund request system
- One-click reorder functionality
- Invoice generation and download

### Admin Dashboard Experience

- **Intuitive Navigation**: Collapsible sidebar with smooth animations and hover interactions
- **Glassmorphism Design**: Modern blur effects and transparent backgrounds
- **Responsive Layout**: Content area automatically adjusts when sidebar expands/collapses
- Comprehensive analytics with real-time statistics
- Interactive charts and visualizations
- Advanced product management with bulk operations
- Complete order oversight and status management
- User administration and access control
- Coupon and promotional campaign management
- Financial tracking and reporting
- Configurable system settings
- Persistent sidebar state across page reloads

### About FluxFit

- Company story and mission
- Services offered
- Meet the founders section
- Contact information

## 👥 Founders

**FluxFit** is led by a visionary team:

- **Subhash** - Founder & CEO
- **Mohan** - Co-Founder
- **Pankaj** - Co-Founder

Together, they envision FluxFit becoming a global leader in custom clothing and printing services, bringing high-quality, personalized fashion solutions to customers worldwide.

## 📞 Contact

- **Email**: fluxfit1@gmail.com
- **Phone**: +91 9958724005
- **Location**: Behrampur, Ghaziabad, Uttar Pradesh, India

## 🚀 Deployment

The application is ready for deployment on platforms like:

- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Railway**
- **DigitalOcean App Platform**

### Deployment Steps

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Test the production build locally**:

   ```bash
   npm start
   ```

3. **Deploy to your preferred platform**:
   - For Vercel: Connect your GitHub repository and deploy automatically
   - For other platforms: Follow their respective deployment guides

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/fluxfit
# or for MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fluxfit

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Payment Gateways
STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_SECRET_KEY=your-stripe-secret-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# SMS (Optional)
SMS_PROVIDER=twilio
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret
```

## 🗄️ Database Models

FluxFit uses MongoDB with Mongoose for data modeling. All models are optimized with proper indexing, validation, and relationships.

### Core Models

#### 1. **User Model** (`user.model.js`)

**Purpose**: Manages user authentication, profiles, and access control.

**Key Features**:

- User registration and authentication (email/username + password)
- Role-based access control (admin/buyer)
- Password hashing with bcrypt (automatic on save)
- JWT token generation for authentication
- Admin permissions management
- User verification status tracking
- Account blocking/deletion (soft delete)
- Profile information (name, email, phone, address, profile image)
- Last login tracking

**Use Cases**:

- User registration and login
- Admin user management
- Profile updates
- Password reset functionality
- Account verification

#### 2. **OTP Model** (`otp.model.js`)

**Purpose**: Handles OTP (One-Time Password) verification for email verification and password reset.

**Key Features**:

- Automatic expiration using TTL index (MongoDB auto-deletes expired OTPs)
- Multiple OTP types (email-verification, password-reset, login)
- Attempt tracking (max 5 attempts)
- One OTP per user per type (deletes old unused OTPs)
- Secure 6-digit OTP generation

**Use Cases**:

- Email verification during registration
- Password reset verification
- Two-factor authentication
- Login verification

#### 3. **Product Model** (`product.model.js`)

**Purpose**: Manages product catalog with variants, inventory, and SEO optimization.

**Key Features**:

- Product variants (size, color, price, stock, SKU per variant)
- Multiple product images with primary image support
- SEO fields (meta title, description, keywords, slug)
- Stock management (variant-level and product-level)
- Product status workflow (draft → pending → approved → active)
- Rating and review aggregation
- Product approval system
- Advanced search with text indexing
- Featured, new, and popular product flags

**Use Cases**:

- Product catalog management
- Inventory tracking
- Product search and filtering
- SEO optimization
- Stock management

#### 4. **Category Model** (`category.model.js`)

**Purpose**: Manages hierarchical product categories with tree structure.

**Key Features**:

- Parent-child relationships (unlimited depth)
- Category tree building and navigation
- Breadcrumb path generation
- Category images and banners
- Sort order control
- SEO optimization
- Soft delete support

**Use Cases**:

- Product categorization
- Navigation menu generation
- Category-based filtering
- SEO-friendly URLs

#### 5. **Brand Model** (`brand.model.js`)

**Purpose**: Manages brand information and associations.

**Key Features**:

- Brand logo and banner images
- Website links
- SEO fields
- Featured brand support
- Sort order control

**Use Cases**:

- Brand filtering
- Brand pages
- Product-brand associations

### E-Commerce Models

#### 6. **Order Model** (`order.model.js`)

**Purpose**: Complete order management system with status tracking and payment integration.

**Key Features**:

- Order items with product details and variants
- Shipping and billing addresses
- Order status workflow (pending → confirmed → processing → shipped → delivered)
- Status timeline with history
- Payment information integration
- Coupon application tracking
- Tax calculation (GST)
- Shipping cost calculation
- Order cancellation and return tracking
- Invoice generation support
- Delivery partner assignment
- Order number generation

**Use Cases**:

- Order creation from cart
- Order status updates
- Order tracking
- Invoice generation
- Return/refund processing

#### 7. **Cart Model** (`cart.model.js`)

**Purpose**: Manages user shopping carts with items and coupon support.

**Key Features**:

- Cart items with product references and variants
- Quantity management
- Coupon application
- Automatic total calculation (subtotal, discount, total)
- Per-user cart (one cart per user)
- Last updated tracking

**Use Cases**:

- Add/remove items from cart
- Update quantities
- Apply discount coupons
- Calculate cart totals

#### 8. **Wishlist Model** (`wishlist.model.js`)

**Purpose**: Manages user wishlists for saving favorite products.

**Key Features**:

- Product references
- Per-user wishlist (one wishlist per user)
- Add/remove products
- Check if product is in wishlist

**Use Cases**:

- Save products for later
- Quick add to cart from wishlist
- Wishlist sharing

#### 9. **Address Model** (`address.model.js`)

**Purpose**: Manages user shipping and billing addresses.

**Key Features**:

- Multiple addresses per user
- Address types (home, work, other)
- Default address support
- Complete address fields (name, phone, address lines, city, state, country, pincode)
- Landmark support
- Soft delete

**Use Cases**:

- Shipping address selection
- Billing address management
- Address validation
- Default address setting

#### 10. **Review Model** (`review.model.js`)

**Purpose**: Manages product reviews and ratings with moderation.

**Key Features**:

- Star ratings (1-5)
- Review text and title
- Review images
- Helpful votes tracking
- Moderation workflow (pending → approved/rejected)
- Verified purchase badge
- Admin/seller replies
- Automatic product rating calculation

**Use Cases**:

- Product reviews
- Rating aggregation
- Review moderation
- Customer feedback

#### 11. **RecentlyViewed Model** (`recentlyviewed.model.js`)

**Purpose**: Tracks recently viewed products for personalized recommendations.

**Key Features**:

- Product viewing history
- Automatic cleanup (TTL index - 30 days)
- Limited to 50 most recent products
- Per-user tracking

**Use Cases**:

- Show recently viewed products
- Personalized recommendations
- User behavior tracking

### Payment & Financial Models

#### 12. **Payment Model** (`payment.model.js`)

**Purpose**: Manages payment transactions with multiple gateway support.

**Key Features**:

- Multiple payment methods (card, UPI, netbanking, COD, Razorpay, Stripe, PayPal)
- Payment status tracking (pending → processing → completed → failed)
- Gateway integration (transaction IDs, payment IDs)
- Refund tracking
- Tax information
- Payment history
- Failure reason tracking
- Gateway response storage

**Use Cases**:

- Payment processing
- Payment verification
- Refund processing
- Payment history
- Financial reporting

#### 13. **Refund Model** (`refund.model.js`)

**Purpose**: Manages refund requests and processing workflow.

**Key Features**:

- Full and partial refunds
- Refund reasons and descriptions
- Refund status workflow (pending → approved → processing → completed)
- Item-level refunds
- Approval/rejection workflow
- Gateway refund integration
- Refund timeline tracking

**Use Cases**:

- Refund requests
- Refund approval/rejection
- Refund processing
- Refund history

#### 14. **Settlement Model** (`settlement.model.js`)

**Purpose**: Manages financial settlements for multi-vendor marketplace support.

**Key Features**:

- Period-based settlements (start date, end date)
- Financial summary (sales, orders, refunds, commission, tax, fees)
- Commission calculation
- Net amount calculation
- Settlement status tracking
- Bank/UPI settlement details
- Multi-vendor support

**Use Cases**:

- Vendor payouts
- Financial reporting
- Commission tracking
- Settlement processing

### Marketing Models

#### 15. **Coupon Model** (`coupon.model.js`)

**Purpose**: Manages discount coupons with validation and usage tracking.

**Key Features**:

- Coupon codes (unique, uppercase)
- Discount types (percentage or fixed amount)
- Usage limits (total and per user)
- Validity period (start and end dates)
- Minimum/maximum purchase requirements
- Applicability (all products, specific categories, products, or brands)
- Usage tracking
- Automatic validation

**Use Cases**:

- Discount coupon creation
- Coupon validation
- Coupon application
- Coupon performance tracking

#### 16. **FlashSale Model** (`flashsale.model.js`)

**Purpose**: Manages flash sale events with scheduling and product management.

**Key Features**:

- Scheduled flash sales (start and end dates)
- Product-specific discounts
- Stock management per sale
- Sale status tracking (scheduled → active → ended)
- Banner images
- Statistics (views, sales, revenue)
- Automatic status updates

**Use Cases**:

- Flash sale creation
- Time-limited offers
- Product promotion
- Sales analytics

### Configuration Models

#### 17. **Settings Model** (`settings.model.js`)

**Purpose**: Manages website-wide settings (singleton pattern - one document).

**Key Features**:

- Website information (name, logo, contact details)
- Currency settings
- Tax configuration
- Shipping defaults
- Maintenance mode
- Email/SMS settings
- Social media links

**Use Cases**:

- Website configuration
- Global settings management
- Maintenance mode control

#### 18. **ShippingRule Model** (`shippingrule.model.js`)

**Purpose**: Manages shipping rules with zone-based pricing.

**Key Features**:

- Multiple shipping types (flat, weight-based, distance-based, price-based)
- Zone management (states, cities, pincodes)
- Base price and rule-based pricing
- Free shipping thresholds
- Estimated delivery days

**Use Cases**:

- Shipping cost calculation
- Zone-based shipping
- Free shipping rules

#### 19. **TaxRate Model** (`taxrate.model.js`)

**Purpose**: Manages tax rates (GST/VAT) with regional support.

**Key Features**:

- Tax rate percentage
- Tax types (GST, VAT, sales tax, service tax)
- Applicability (all, categories, products)
- State/region-based tax
- Active/inactive status

**Use Cases**:

- Tax calculation
- Regional tax management
- GST compliance

#### 20. **EmailTemplate Model** (`emailtemplate.model.js`)

**Purpose**: Manages email templates with variable substitution.

**Key Features**:

- Template types (welcome, order-confirmation, password-reset, etc.)
- Subject and body templates
- Variable placeholders ({{variableName}})
- Template rendering with variables
- Active/inactive status

**Use Cases**:

- Email notifications
- Order confirmations
- Password reset emails
- Marketing emails

#### 21. **SMSTemplate Model** (`smstemplate.model.js`)

**Purpose**: Manages SMS templates for notifications.

**Key Features**:

- SMS message templates (160 character limit)
- Template types (OTP, order-confirmation, etc.)
- Variable substitution
- Template rendering

**Use Cases**:

- SMS notifications
- OTP delivery
- Order updates

#### 22. **APIKey Model** (`apikey.model.js`)

**Purpose**: Manages API keys for external integrations.

**Key Features**:

- API key generation (public/private keys)
- Key types (public, private, webhook)
- Permission management
- Rate limiting configuration
- IP whitelisting
- Usage tracking
- Expiration dates
- Webhook URL support

**Use Cases**:

- Third-party integrations
- API access control
- Webhook management
- Rate limiting

### Utility Models

#### 23. **ActivityLog Model** (`activitylog.model.js`)

**Purpose**: Tracks user activities and system events for auditing.

**Key Features**:

- User action logging
- Entity tracking (user, product, order, etc.)
- Action descriptions
- Metadata storage
- IP address and user agent tracking
- Success/failure status
- Error logging
- Automatic cleanup (TTL index - 90 days)

**Use Cases**:

- User activity tracking
- Audit logs
- Debugging
- Security monitoring
- Analytics

### Model Features

- ✅ **Optimized Indexing** - Strategic indexes for fast queries
- ✅ **TTL Indexes** - Automatic cleanup for OTP, RecentlyViewed, ActivityLog
- ✅ **Soft Deletes** - Preserve data with soft delete support
- ✅ **Virtual Fields** - Computed properties for common calculations
- ✅ **Pre/Post Hooks** - Automated business logic (password hashing, status updates)
- ✅ **Validation** - Comprehensive field validation
- ✅ **Relationships** - Proper references and population support
- ✅ **Methods** - Instance and static methods for common operations

### Usage Example

```javascript
import { User, Product, Order, Cart } from "@/models";

// Create user
const user = await User.create({
  username: "john_doe",
  email: "john@example.com",
  password: "securepassword",
  role: "buyer",
});

// Find products with search
const { products } = await Product.search("t-shirt", {
  category: categoryId,
  minPrice: 1000,
  maxPrice: 5000,
  page: 1,
  limit: 20,
});

// Create order
const order = await Order.create({
  user: userId,
  items: cartItems,
  shippingAddress: address,
  payment: { method: "razorpay" },
});
```

## 🚧 Future Enhancements

- Payment gateway backend integration (Stripe, Razorpay) - API endpoints
- Review and rating system - Full implementation with moderation
- Email notifications for order updates - Template integration
- Real-time order tracking with shipping APIs
- SMS notifications - Template integration
- Multi-vendor marketplace support - Enhanced settlement system
- Advanced search with Elasticsearch
- Recommendation engine
- International shipping options
- Multi-language support

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For inquiries, please contact the team through the contact information provided above.

---

Built with ❤️ by the FluxFit team
