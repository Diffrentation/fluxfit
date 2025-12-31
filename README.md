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

- **MongoDB (Mongoose)** - Database (ready for integration)
- **Stripe** - Payment processing
- **Cloudinary** - Image management and uploads
- **JWT** - Authentication
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

3. Run the development server:

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

### Environment Variables (if needed)

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name for image uploads
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` - Cloudinary upload preset
- `STRIPE_PUBLIC_KEY` - Stripe public key (for payment integration)
- `RAZORPAY_KEY_ID` - Razorpay key ID (for payment integration)

## 🚧 Future Enhancements

- User authentication and accounts (backend integration)
- Payment gateway backend integration (Stripe, Razorpay)
- Review and rating system (full implementation with backend)
- Email notifications for order updates
- Real-time order tracking with shipping APIs
- SMS notifications
- Multi-vendor marketplace support
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
