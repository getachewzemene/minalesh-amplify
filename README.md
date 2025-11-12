# Minalesh - Ethiopia's Intelligent Marketplace

A full-stack e-commerce application built with Next.js, specifically designed for the Ethiopian market.

## Features

### For Customers
- Browse products with Ethiopian Birr (ETB) pricing
- **Advanced Search** - Full-text search with autocomplete suggestions and faceted filtering
- Search and filter by Ethiopian-specific categories
- Traditional and modern product categories
- AR view for select products
- Wishlist and cart functionality
- Product reviews and ratings
- **Coupon codes and discounts** - Apply promotional codes at checkout
- **Multiple shipping options** - Choose from standard, express, or store pickup
- **Transparent pricing** - View itemized costs including discounts, shipping, and VAT

### For Vendors
- Vendor registration with Trade License and TIN verification
- Product management (Create, Read, Update, Delete)
- **Media Management** - Upload images with automatic optimization and S3 storage
- **Accessibility Support** - Add alt text to product images
- Inventory tracking
- Sales analytics
- Order management

### For Administrators
- **Comprehensive Product Management** - Full CRUD operations for all products
- Vendor approval system
- Analytics dashboard
- Category management
- Order oversight
- **Pricing & Promotions Management**
  - Create and manage coupon codes (percentage, fixed amount, free shipping)
  - Set up promotions and discounts
  - Configure flash sales with time limits
  - Implement tiered pricing for bulk purchases
- **Shipping & Tax Configuration**
  - Define shipping zones for Ethiopian regions
  - Configure shipping methods and rates
  - Set up VAT and tax rates (15% Ethiopian VAT)
- [View detailed admin documentation](docs/ADMIN_PRODUCT_MANAGEMENT.md)

### Ethiopian-Specific Features
- 🇪🇹 Ethiopian Birr (ETB) currency support
- 🏪 Local business verification (Trade License, TIN)
- ☕ Ethiopian product categories (Coffee, Traditional Clothing, Spices, etc.)
- 📍 Ethiopian market context and terminology
- 🎨 Cultural sensitivity in product categorization
- 🚚 Ethiopian shipping zones (Addis Ababa, Major Cities, Regional Areas)
- 💰 Ethiopian VAT (15%) automatically calculated
- 🏙️ Support for major Ethiopian cities and regions

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd minalesh-amplify

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL database URL and JWT secret
# IMPORTANT: Use a strong, random JWT_SECRET in production

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed Ethiopian categories
npx tsx prisma/seeds/categories.ts

# Start the development server
npm run dev
```

### Security & RBAC

✅ **Security Features Implemented:**

1. **Role-Based Access Control (RBAC)**: Database-backed roles (admin, vendor, customer) with server-side enforcement
2. **Authentication Hardening**: 
   - Email verification for new accounts
   - Password reset with secure tokens
   - Brute-force protection with account lockout
   - Token refresh mechanism
3. **Email Notifications**: 
   - Transactional emails (order confirmation, shipping updates)
   - User notification preferences
   - Ready for integration with SendGrid, AWS SES, or Mailgun
4. **Security Best Practices**:
   - Cryptographically secure token generation
   - Password strength requirements (8+ chars, letter + number)
   - JWT tokens with configurable expiry
   - CodeQL security scanning

📚 **[View Security & RBAC Documentation](docs/SECURITY_AND_RBAC.md)** for complete API reference and implementation details.

⚠️ **Production Checklist:**
- Set strong `JWT_SECRET` environment variable
- Configure email service provider
- Manually assign admin roles via database
- Use HTTPS and consider httpOnly cookies
- Enable PostgreSQL SSL connections

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Technologies Used

This project is built with:

- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- shadcn-ui
- PostgreSQL (Database with pg_trgm extension)
- Prisma ORM
- TanStack Query
- JWT Authentication
- AWS S3 (Optional - Media Storage)
- Sharp (Image Optimization)

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite
- `npm run db:seed:categories` - Seed Ethiopian categories
- `npm run db:seed:shipping-tax` - Seed shipping zones and tax rates

## Key Routes

- `/` - Homepage with featured products
- `/products` - Browse all products
- `/product/[id]` - Product detail page
- `/admin` - Admin dashboard with product management
- `/dashboard` - User dashboard
- `/profile` - User profile and vendor management
- `/cart` - Shopping cart
- `/wishlist` - Saved items

## Advanced Search Backend

The platform features a powerful PostgreSQL-based search system:
- **Full-Text Search**: PostgreSQL trigram similarity for relevant results
- **Faceted Filtering**: Category, price range, rating, vendor, location filters
- **Search Suggestions**: Autocomplete for better UX
- **Multiple Sort Options**: Relevance, price, rating, newest, popular
- **Performance Optimized**: GIN indexes for fast queries

See [Search Backend Documentation](docs/SEARCH_BACKEND.md) for API details.

## Media Management

Comprehensive image handling with professional features:
- **S3 Storage**: AWS S3 integration with local fallback
- **Auto-Optimization**: Multiple sizes (thumbnail, medium, large)
- **WebP Conversion**: Modern format for better compression
- **Alt Text Support**: Accessibility-first design
- **Secure Upload**: Authentication and authorization checks

See [Media Management Documentation](docs/MEDIA_MANAGEMENT.md) for API details.

## Admin Product Management

The admin panel includes a comprehensive product management system with:
- Full CRUD operations
- Search and filtering
- Pagination
- Ethiopian category support
- Vendor information display
- Stock and pricing management

See [Admin Product Management Documentation](docs/ADMIN_PRODUCT_MANAGEMENT.md) for detailed information.

## Ethiopian Categories

The platform supports culturally relevant categories including:
- Traditional Clothing (Habesha Kemis, Netela)
- Coffee & Tea (Ethiopian Coffee, Jebena)
- Spices & Ingredients (Berbere, Mitmita)
- Handicrafts & Art
- Religious Items
- Agriculture & Farming
- And more...

Run the seed script to populate these categories in your database.

## Pricing & Promotions System

### Discount Types
The platform supports three types of discounts:
- **Percentage Discount** - e.g., 10% off
- **Fixed Amount** - e.g., 50 ETB off
- **Free Shipping** - Waive shipping charges

### Coupon Codes
Create promotional codes with:
- Usage limits (total and per-user)
- Minimum purchase requirements
- Maximum discount caps
- Start and expiration dates
- Status tracking (active, inactive, expired, depleted)

**Example API Usage:**
```bash
# Validate a coupon code
POST /api/coupons/validate
{
  "code": "WELCOME10",
  "subtotal": 500
}
```

### Promotions
Configure automatic discounts:
- **Product Discount** - Discount on specific products
- **Category Discount** - Discount on product categories
- **Cart Discount** - Discount on entire cart
- **Buy X Get Y** - Bundle deals

### Tiered Pricing
Offer quantity-based discounts:
- Define min/max quantity ranges
- Apply percentage or fixed discounts
- Automatic calculation at checkout

### Flash Sales
Create time-limited sales with:
- Scheduled start and end times
- Stock limits
- Countdown timers
- Priority over other discounts

**Example API Usage:**
```bash
# Get active promotions
GET /api/promotions?productId={productId}
```

## Shipping & Tax System

### Ethiopian Shipping Zones
Pre-configured zones for Ethiopia:
1. **Addis Ababa** - Capital city
   - Standard: 50 ETB base + 10 ETB/kg
   - Express: 100 ETB base + 20 ETB/kg
   - Free shipping threshold: 1,000 ETB

2. **Major Cities** - Dire Dawa, Bahir Dar, Gondar, Mekelle, etc.
   - Standard: 100 ETB base + 15 ETB/kg
   - Express: 200 ETB base + 25 ETB/kg
   - Free shipping threshold: 1,500 ETB

3. **Regional Areas** - Other cities and towns
   - Standard: 150 ETB base + 20 ETB/kg
   - Free shipping threshold: 2,000 ETB

### Shipping Methods
- **Standard Delivery** - 3-7 business days
- **Express Delivery** - 1-3 business days
- **Store Pickup** - Free, 1-2 days

**Example API Usage:**
```bash
# Calculate shipping rates
POST /api/shipping/rates
{
  "address": {
    "country": "ET",
    "city": "Addis Ababa"
  },
  "subtotal": 500,
  "totalWeight": 2.5
}
```

### Ethiopian Tax (VAT)
- Standard VAT rate: **15%**
- Automatic calculation based on address
- Tax-exempt categories supported (basic food, medicine, books)
- Compound tax support for multiple tax rates

### Complete Cart Calculation
Calculate totals with all pricing rules:
```bash
POST /api/cart/calculate
{
  "subtotal": 500,
  "couponCode": "WELCOME10",
  "shippingRateId": "...",
  "shippingAddress": {
    "country": "ET",
    "city": "Addis Ababa"
  }
}

# Response
{
  "subtotal": 500,
  "discountAmount": 50,
  "subtotalAfterDiscount": 450,
  "shippingAmount": 50,
  "taxAmount": 67.50,
  "total": 567.50
}
```

## Admin API Endpoints

### Coupon Management
- `GET /api/admin/coupons` - List all coupons
- `POST /api/admin/coupons` - Create new coupon
- Query params: `status`, `page`, `perPage`

### Promotion Management
- `GET /api/admin/promotions` - List all promotions
- `POST /api/admin/promotions` - Create new promotion
- Query params: `isActive`, `page`, `perPage`

### Flash Sale Management
- `GET /api/admin/flash-sales` - List all flash sales
- `POST /api/admin/flash-sales` - Create new flash sale
- Includes product information and stock tracking

### Shipping Zone Management
- `GET /api/admin/shipping-zones` - List all zones with rates
- `POST /api/admin/shipping-zones` - Create new zone

**Note:** All admin endpoints require authentication and admin privileges (set via `ADMIN_EMAILS` env variable).

## Database Seeding

After setting up the database, run the seed scripts:

```bash
# Seed Ethiopian categories
npm run db:seed:categories

# Seed shipping zones and tax rates
npm run db:seed:shipping-tax
```

This will populate:
- Ethiopian product categories
- Shipping zones for Ethiopian regions
- Shipping methods (Standard, Express, Pickup)
- Shipping rates in ETB
- 15% Ethiopian VAT rate

## Deployment

This Next.js application can be deployed to platforms like:
- Vercel
- Netlify
- AWS Amplify
- Any Node.js hosting platform
