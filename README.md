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

### Custom Printing Services

- Custom design printing on all apparel
- Full-color printing with vibrant, long-lasting colors
- Bulk order support for businesses and events
- Quality assurance on all products

### User Experience

- **Responsive Design**: Fully responsive across all devices (mobile, tablet, desktop)
- **Smooth Animations**: Powered by Framer Motion for engaging interactions
- **Modern UI**: Built with Tailwind CSS for a clean, modern interface
- **Fast Performance**: Optimized Next.js application

## 🛠️ Tech Stack

### Frontend

- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Ant Design (antd)** - UI component library
- **Tabler Icons** - Icon library

### Backend & Services

- **MongoDB (Mongoose)** - Database (ready for integration)
- **Stripe** - Payment processing
- **Cloudinary** - Image management
- **JWT** - Authentication

### Development Tools

- **ESLint** - Code linting
- **TypeScript** (ready for migration)
- **React Compiler** - Performance optimization

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
│   │   └── contact/           # Contact page
│   ├── components/            # React components
│   │   ├── About/             # About section components
│   │   ├── ContactUs/         # Contact form component
│   │   ├── Footer/            # Footer component
│   │   ├── GetInTouch/        # Get in touch section
│   │   ├── Header/            # Navigation component
│   │   ├── Home/              # Home page components
│   │   └── ui/                # Reusable UI components
│   ├── context/               # React Context providers
│   │   └── CartContext.jsx    # Shopping cart state management
│   └── lib/                   # Utility functions and data
│       ├── productDatabase.js # Product data
│       └── utils.js           # Helper functions
├── public/                    # Static assets
├── package.json
└── README.md
```

## 📄 Pages & Routes

- `/` - Home page with hero banner and product overview
- `/product-list` - Complete product catalog with filtering
- `/product-details/[id]` - Individual product details with related products
- `/cart` - Shopping cart management
- `/about` - About FluxFit, our story, services, and founders
- `/contact` - Contact form and information

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

## 🚧 Future Enhancements

- User authentication and accounts
- Order management system
- Payment integration with Stripe
- Admin dashboard
- Product image uploads via Cloudinary
- Review and rating system
- Wishlist functionality
- Email notifications

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For inquiries, please contact the team through the contact information provided above.

---

Built with ❤️ by the FluxFit team
