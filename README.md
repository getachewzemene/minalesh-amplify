# Minalesh - Ethiopia's Intelligent Marketplace

A full-stack e-commerce application built with Next.js, specifically designed for the Ethiopian market.

## 🆕 Backend Architecture - Django Integration Available!

**Question:** "We use Next.js now and for backend I think Django is good, what you advice me?"

**Answer:** ✅ **YES - Django is highly recommended for Minalesh!**

We've created comprehensive documentation to help you integrate Django as your backend:

- 📋 **[Executive Summary](DJANGO_INTEGRATION_SUMMARY.md)** - Start here! Complete overview and recommendation
- 📚 **[Full Integration Guide](NEXTJS_DJANGO_INTEGRATION_GUIDE.md)** - Comprehensive 12-week migration plan
- 🚀 **[Quick Start Guide](DJANGO_QUICKSTART.md)** - Build a proof-of-concept in 30 minutes
- 💻 **[Django Starter Kit](examples/django-backend-starter/)** - Ready-to-use Django backend template
- 🔌 **[TypeScript API Client](examples/django-api-client.ts)** - Connect Next.js to Django

### Why Django for Minalesh?

✅ **E-commerce Ready** - Built-in admin, payments, orders  
✅ **Ethiopian Market** - Easy integration with Telebirr, CBE Birr, tax systems  
✅ **Scalability** - Powers Instagram, Pinterest (millions of users)  
✅ **Auto Admin** - Saves 200+ development hours  
✅ **Background Tasks** - Celery for emails, reports, inventory  
✅ **ROI** - $30/month investment saves $5,000+ in development costs

**Decision:** 6/8 criteria met → **Django Strongly Recommended**  
**Timeline:** 12-week gradual migration  
**Cost:** ~$50-75/month (vs current $15-45/month)  
**Savings:** 200+ developer hours on admin interface alone

## Features

### For Customers
- Browse products with Ethiopian Birr (ETB) pricing
- **Advanced Search** - Full-text search with autocomplete suggestions and faceted filtering
- **Product Discovery Features** - Smart recommendations, top products, and new arrivals
  - Personalized recommendations based on browsing and purchase history
  - Top-selling and most popular products
  - Recently added products to the marketplace
  - Similar product suggestions on product detail pages
  - 📚 **[View Product Recommendations Documentation](archive/docs/PRODUCT_RECOMMENDATIONS.md)**
- Search and filter by Ethiopian-specific categories
- Traditional and modern product categories
- AR view for select products
- Wishlist and cart functionality
- Product reviews and ratings
- **Coupon codes and discounts** - Apply promotional codes at checkout
- **Multiple shipping options** - Choose from standard, express, or store pickup
- **Transparent pricing** - View itemized costs including discounts, shipping, and VAT
- **Refunds & Returns** - Request full or partial refunds with automatic stock restoration
- **Dispute Resolution** - File disputes for order issues with vendor/admin mediation
- **Data Privacy** - Export your data or delete your account (GDPR compliant)
- **🎮 Gamification System** - Engage with the platform through interactive features
  - Daily check-ins with streak bonuses
  - Achievement badges with rewards
  - Interactive games (spin wheel, scratch cards, quizzes)
  - Points and rewards redemption
  - Leaderboards and rankings
  - **Full UI Dashboard** at `/dashboard/gamification`
  - 📚 **[View Gamification Documentation](archive/docs/GAMIFICATION_SYSTEM.md)**
  - 📚 **[View UI Guide](archive/docs/GAMIFICATION_UI_GUIDE.md)**

### For Vendors
- Vendor registration with Trade License and TIN verification
- **Enhanced Verification** - Submit business documents for admin review and approval
- **Seller Ratings** - Build reputation through customer ratings across multiple dimensions
- Product management (Create, Read, Update, Delete)
- **Media Management** - Upload images with automatic optimization and S3 storage
- **Accessibility Support** - Add alt text to product images
- Inventory tracking
- Sales analytics
- Order management
- **Dispute Management** - Respond to customer disputes and resolve issues
- **Advanced Vendor Tools** 🚀
  - **Bulk Operations**
    - Bulk product upload via CSV/Excel files
    - Bulk export for offline editing
    - Quick actions for bulk price updates, stock adjustments, and category changes
  - **Inventory Forecasting**
    - AI-powered predictions based on sales trends
    - Days-until-stockout calculations
    - Automated reorder recommendations
    - Inventory turnover analytics and aging stock reports
  - **Performance Insights**
    - Customer behavior analytics (traffic sources, conversion rates)
    - Product performance comparison tools
    - Revenue forecasting
  - **Marketing Tools**
    - Campaign management and tracking
    - Promotional scheduler
    - Featured product management
  - **Communication Hub**
    - Customer messaging system
    - Quick response templates
    - Product Q&A management
  - **Financial Tools**
    - Expense tracking
    - Profit margin calculator
    - VAT and tax report generation
    - Ethiopian tax compliance tools (TIN validation, tax invoicing)
    - Automated tax reporting for Ethiopian tax authorities
    - 📚 **[View Tax Compliance Documentation](archive/docs/SELLER_RATINGS_AND_TAX_COMPLIANCE.md)**

### For Administrators
- **Comprehensive Product Management** - Full CRUD operations for all products
- Vendor approval system
- Analytics dashboard
- Category management
- Order oversight
- **Advanced Admin Dashboard** 🚀
  - Real-time statistics with live updates
  - Intelligent notification center
  - Fraud detection and risk alerts
  - Bulk operations (orders, products, users)
  - Customer relationship management (CRM)
  - Customer segmentation and lifetime value tracking
  - Comprehensive reporting (sales, inventory, financial)
  - CSV export for all reports
  - Site configuration management
  - 📚 **[View Advanced Admin Features Documentation](archive/docs/ADVANCED_ADMIN_FEATURES.md)**
- **Pricing & Promotions Management**
  - Create and manage coupon codes (percentage, fixed amount, free shipping)
  - Set up promotions and discounts
  - Configure flash sales with time limits
  - Implement tiered pricing for bulk purchases
- **Shipping & Tax Configuration**
  - Define shipping zones for Ethiopian regions
  - Configure shipping methods and rates
  - Set up VAT and tax rates (15% Ethiopian VAT)
- **Payment Management**
  - Process full and partial refunds
  - Capture authorized payments (full or partial amounts)
  - Support for Stripe and Ethiopian payment providers
  - 📚 **[View Refunds & Captures Documentation](archive/docs/REFUNDS_AND_CAPTURES.md)**
- **Legal Compliance & Trust** 🆕
  - Vendor verification system with document review
  - Dispute resolution and mediation
  - GDPR-compliant data export and account deletion
  - 📚 **[View Phase 1 Legal Compliance Documentation](PHASE1_LEGAL_COMPLIANCE.md)**
- [View detailed admin documentation](archive/docs/ADMIN_PRODUCT_MANAGEMENT.md)

### Ethiopian-Specific Features
- 🇪🇹 Ethiopian Birr (ETB) currency support
- 🏪 Local business verification (Trade License, TIN)
- 📋 **Ethiopian Tax Compliance** - TIN validation, tax invoicing, and automated reporting
- ⭐ **Seller Ratings System** - Multi-dimensional vendor performance tracking
- ☕ Ethiopian product categories (Coffee, Traditional Clothing, Spices, etc.)
- 📍 Ethiopian market context and terminology
- 🎨 Cultural sensitivity in product categorization
- 🚚 Ethiopian shipping zones (Addis Ababa, Major Cities, Regional Areas)
- 💰 Ethiopian VAT (15%) automatically calculated with category-based exemptions
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
# The .env file is already present with default values for local development
# Edit .env with your PostgreSQL database URL and JWT secret
# Ensure both `DATABASE_URL` and `DIRECT_URL` are set. In local development,
# you can set `DIRECT_URL` to the same value as `DATABASE_URL`.
# IMPORTANT: Use a strong, random JWT_SECRET in production

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed Ethiopian categories
npx tsx prisma/seeds/categories.ts

# (Optional) Seed demo products (Phones, CCTV, Alarms, Storage, etc.)
npx tsx prisma/seeds/demo-products.ts

# Initialize admin user (required for admin access)
npm run init:admin
# Follow the prompts to create the admin account

# Start the development server
npm run dev
```

### Admin Setup

The system supports **only one admin user** to maintain security and accountability. To set up the admin:

1. **After database setup**, run the admin initialization script:
   ```bash
   npm run init:admin
   ```

2. **Follow the prompts** to enter:
   - Admin email address
   - Admin password (minimum 8 characters)
   - First name (optional)
   - Last name (optional)

3. **Access the admin portal** at:
   - Local: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
   - Production: `https://yourdomain.com/admin/login`

**Note:** If an admin already exists, the script will inform you and prevent creating a second admin. To change the admin user, you must manually update the database.

### Security & RBAC

✅ **Security Features Implemented:**

1. **Role-Based Access Control (RBAC)**: Database-backed roles (admin, vendor, customer) with server-side enforcement
2. **Authentication Hardening**: 
   - Email verification for new accounts
   - Password reset with secure tokens
   - Brute-force protection with account lockout
   - Token refresh mechanism
3. **Email Service with Queue & Retry**: 
   - Resend integration for reliable email delivery
   - Database-backed email queue with retry logic
   - Transactional emails (order confirmation, password reset, shipping updates)
   - Background worker for email processing
   - User notification preferences
   - 📚 **[View Email Service Documentation](archive/docs/EMAIL_SERVICE.md)**
4. **Background Workers**:
   - Email queue processor - Sends pending emails via Resend
   - Webhook retry worker - Retries failed webhooks with exponential backoff
   - Inventory cleanup worker - Releases expired reservations
   - 📚 **[View Background Workers Documentation](archive/docs/BACKGROUND_WORKERS.md)**
5. **Security Best Practices**:
   - Cryptographically secure token generation
   - Password strength requirements (8+ chars, letter + number)
   - JWT tokens with configurable expiry
   - CodeQL security scanning

📚 **[View Security & RBAC Documentation](archive/docs/SECURITY_AND_RBAC.md)** for complete API reference and implementation details.

⚠️ **Production Checklist:**
- Set strong `JWT_SECRET` and `CRON_SECRET` environment variables
- Configure Resend API key (`RESEND_API_KEY`) and verify domain
- Set up cron jobs for background workers:
  - Email queue processing (every 1-5 minutes)
  - Webhook retry processing (every 5-10 minutes)
  - Inventory cleanup (every 5 minutes)
- **Initialize admin user** using `npm run init:admin` script
- Use HTTPS and consider httpOnly cookies
- Enable PostgreSQL SSL connections

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## API Documentation

The API is fully documented using **Swagger/OpenAPI 3.0** specification. 

📚 **Interactive API Documentation:** Visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) to explore and test all API endpoints.

### Key Features:
- ✅ **Interactive Testing** - Try out API endpoints directly from the browser
- ✅ **Complete Documentation** - All 57+ endpoints documented with request/response schemas
- ✅ **Authentication Support** - Test endpoints with JWT bearer tokens
- ✅ **Organized by Tags** - Endpoints grouped by functionality (Authentication, Products, Cart, Orders, etc.)
- ✅ **Schema Definitions** - Detailed data models for all entities

### API Endpoint Categories:
- **Authentication** - Login, logout, password reset, email verification
- **Products** - CRUD operations for vendor products
- **Categories** - Browse product categories
- **Cart** - Shopping cart management
- **Orders** - Order creation and tracking
- **Payments** - Payment intent creation and processing
- **Shipping** - Shipping rate calculation
- **Coupons** - Coupon validation and discounts
- **Search** - Advanced product search with filters
- **Admin** - Administrative operations (coupons, promotions, shipping zones)
- **Analytics** - Sales and performance metrics
- **Vendors** - Vendor-specific operations
- **Seller Ratings** 🆕 - Vendor rating submission and retrieval
- **Tax Compliance** 🆕 - Ethiopian tax reporting and compliance
- **Gamification** 🎮 - Interactive engagement features
  - `GET /api/gamification/check-in` - Get daily check-in status
  - `POST /api/gamification/check-in` - Perform daily check-in
  - `GET /api/gamification/achievements` - List all achievements
  - `POST /api/gamification/achievements` - Award achievement (admin)
  - `GET /api/gamification/rewards` - List available rewards
  - `POST /api/gamification/rewards` - Redeem reward with points
  - `GET /api/gamification/games` - List available games
  - `POST /api/gamification/games` - Play a game
  - `GET /api/gamification/leaderboard` - View leaderboards
- **Advanced Vendor Tools** 🚀 - Professional e-commerce features
  - `POST /api/vendors/products/bulk-upload` - Bulk product import via CSV/Excel
  - `GET /api/vendors/products/export` - Export products to CSV
  - `GET /api/vendors/inventory/forecast` - AI-powered inventory forecasting
  - `GET /api/vendors/analytics/customer-insights` - Customer behavior analytics
  - `GET /api/vendors/tax-report` 🆕 - Ethiopian tax compliance reporting
  - `GET /api/vendors/stats` 🆕 - Vendor statistics with ratings

Access the OpenAPI JSON specification at: [http://localhost:3000/api/swagger.json](http://localhost:3000/api/swagger.json)

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
- Sentry (Error Tracking & Performance Monitoring)
- Pino (Structured Logging)

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite
- `npm run db:seed:categories` - Seed Ethiopian categories
- `npm run db:seed:shipping-tax` - Seed shipping zones and tax rates

## Database migration scripts
- `npx prisma migrate reset --force` - reset the migration for fresh start
- `npx prisma migrate dev --name init` - initialize the migration files
- `npx prisma generate` - generate new migration files

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

See [Search Backend Documentation](archive/docs/SEARCH_BACKEND.md) for API details.

## Media Management

Comprehensive image handling with professional features:
- **S3 Storage**: AWS S3 integration with local fallback
- **Auto-Optimization**: Multiple sizes (thumbnail, medium, large)
- **WebP Conversion**: Modern format for better compression
- **Alt Text Support**: Accessibility-first design
- **Secure Upload**: Authentication and authorization checks

See [Media Management Documentation](archive/docs/MEDIA_MANAGEMENT.md) for API details.

## Admin Product Management

The admin panel includes a comprehensive product management system with:
- Full CRUD operations
- Search and filtering
- Pagination
- Ethiopian category support
- Vendor information display
- Stock and pricing management

See [Admin Product Management Documentation](archive/docs/ADMIN_PRODUCT_MANAGEMENT.md) for detailed information.

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
Create time-limited sales with enhanced features:
- **Live Countdown Timers** - Real-time countdown showing days, hours, minutes, and seconds
- **Real-time Stock Counter** - Live updates of remaining stock with visual progress bars
- **Pre-registration System** - Users can register to be notified when sale starts
- **Scheduled start and end times**
- **Stock limits with sold count tracking**
- **Priority over other discounts**

**Flash Sales Features:**
- Automated notifications for registered users when sales start
- Dynamic stock updates every 5 seconds
- Visual indicators for stock status (In Stock, Selling Fast, Almost Sold Out)
- Responsive design optimized for mobile devices
- Integration with product pages

**Public API Endpoints:**
```bash
# Get all active flash sales
GET /api/flash-sales

# Get specific flash sale
GET /api/flash-sales/{id}

# Get real-time stock information
GET /api/flash-sales/{id}/stock

# Register for flash sale notifications
POST /api/flash-sales/{id}/register

# Check registration status
GET /api/flash-sales/{id}/register

# Unregister from flash sale
DELETE /api/flash-sales/{id}/register
```

**Admin API Endpoints:**
```bash
# Create new flash sale (Admins and Vendors)
POST /api/admin/flash-sales
{
  "name": "iPhone 14 Flash Sale",
  "productId": "uuid",
  "discountType": "percentage",
  "discountValue": 30,
  "originalPrice": 50000,
  "flashPrice": 35000,
  "stockLimit": 100,
  "startsAt": "2024-01-01T10:00:00Z",
  "endsAt": "2024-01-01T22:00:00Z"
}
# Note: Admins can create for any product, vendors only for their own products

# Get all flash sales (with filters)
GET /api/admin/flash-sales?isActive=true&page=1&perPage=20
```

**Vendor API Endpoints:**
```bash
# Create flash sale for vendor's product
POST /api/vendors/flash-sales
{
  "name": "Weekend Flash Sale",
  "productId": "your-product-id",
  "discountType": "percentage",
  "discountValue": 30,
  "originalPrice": 1000,
  "flashPrice": 700,
  "stockLimit": 50,
  "startsAt": "2024-12-25T10:00:00Z",
  "endsAt": "2024-12-25T22:00:00Z"
}
# Requirements: Approved vendor status, product ownership

# Get vendor's flash sales
GET /api/vendors/flash-sales?isActive=true&page=1&perPage=20
```

**User Experience:**
- Browse flash sales at `/flash-sales`
- See flash sales prominently featured on homepage
- Register for upcoming sales to receive notifications
- Real-time countdown and stock updates during active sales
- Clear visual indicators for sale status (Upcoming, Active, Ended)
- **Vendors:** Manage flash sales at `/vendor/flash-sales`

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

### Payment Management
- `POST /api/refunds` - Initiate full or partial refund
- `GET /api/refunds?orderId={id}` - Get refund history for an order
- `POST /api/payments/capture` - Capture authorized payment (full or partial)
- `GET /api/payments/capture?orderId={id}` - Get capture status

**Example - Process Partial Refund:**
```bash
POST /api/refunds
{
  "orderId": "uuid",
  "amount": 500.00,
  "reason": "Damaged item",
  "restoreStock": true
}
```

**Example - Partial Payment Capture:**
```bash
POST /api/payments/capture
{
  "orderId": "uuid",
  "amount": 750.00,
  "finalCapture": false
}
```

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

## Observability & Performance

The platform includes comprehensive observability and performance optimizations:

### Observability Features
- ✅ **Structured Logging** - JSON-formatted logs with Pino for production monitoring
- ✅ **Error Tracking** - Sentry integration for client, server, and edge errors
- ✅ **Performance Metrics** - Request duration, cache hit rates, and custom metrics
- ✅ **API Request Logging** - Automatic logging for all API routes with user context

### Performance Features
- ✅ **CDN Optimization** - Cache headers for static assets and API responses
- ✅ **API Response Caching** - In-memory caching with configurable TTL
- ✅ **Stale-While-Revalidate** - Serve stale content while refreshing in background
- ✅ **Image Optimization** - Next.js Image Optimization with AVIF/WebP support
- ✅ **Cache Invalidation** - Automatic cache clearing on content updates

📚 **[View Observability & Performance Documentation](archive/docs/OBSERVABILITY_AND_PERFORMANCE.md)** for detailed implementation guide.

### Configuration

Set up observability by adding these environment variables:

```bash
# Sentry (Optional)
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"

# Logging
LOG_LEVEL="info"  # Options: trace, debug, info, warn, error, fatal
```

## Analytics & Reporting

The platform includes comprehensive analytics and reporting capabilities for admins:

### Analytics Features
- ✅ **Sales Analytics** - Revenue trends with day/week/month grouping
- ✅ **Conversion Funnel** - 5-stage funnel tracking with drop-off rates
- ✅ **Cohort Retention** - Customer retention analysis by cohort
- ✅ **Product Performance** - Top products and category breakdown
- ✅ **Regional Analytics** - Geographic performance metrics
- ✅ **Overview Dashboard** - KPIs with period-over-period comparison

### Analytics API Endpoints
- `GET /api/analytics/overview` - Comprehensive KPIs
- `GET /api/analytics/sales` - Sales metrics and trends
- `GET /api/analytics/conversion-funnel` - Funnel analysis
- `GET /api/analytics/cohort-retention` - Retention metrics
- `GET /api/analytics/products` - Product performance
- `GET /api/analytics/regional` - Regional performance

All analytics endpoints require admin authentication and support date range filtering.

📚 **[View Analytics API Documentation](archive/docs/ANALYTICS_API.md)** for complete API reference and examples.

## Mobile Responsiveness

The platform is **fully optimized for Ethiopian mobile users** with a comprehensive mobile-first design:

### Mobile-First Features ✅
- ✅ **Mobile-First Design** - 88+ responsive breakpoint instances throughout
- ✅ **Mobile Bottom Navigation** - Persistent navigation bar for Home, Search, Cart, Wishlist, Account
- ✅ **PWA Support** - Installable as mobile app with offline capabilities
- ✅ **Touch-Friendly** - Minimum 44px tap targets for accessibility
- ✅ **Responsive Layouts** - 1 column mobile → 2 tablet → 4 desktop grids
- ✅ **Adaptive Navigation** - Mobile menu with hamburger, desktop with full navigation
- ✅ **Responsive Charts** - Analytics charts adapt to screen size
- ✅ **Card-Based Layouts** - Mobile-friendly alternatives to data tables
- ✅ **Safe Area Support** - Handles device notches and rounded corners
- ✅ **Responsive Typography** - Text scales appropriately for mobile readability

### Mobile Enhancements
- **Viewport Configuration** - Optimized meta tags with Ethiopian gold theme color
- **Mobile CSS Utilities** - Custom utilities for mobile-first development
- **Image Optimization** - Next.js Image component with responsive sizing
- **Performance** - Optimized for 3G/4G Ethiopian networks
- **Multilingual** - Support for Amharic, Tigrinya, and Oromo scripts

### Documentation
- 📚 **[Mobile-First Design Guide](archive/MOBILE_FIRST_GUIDE.md)** - Complete mobile development guide
- 📚 **[Mobile Testing Checklist](archive/MOBILE_TESTING_CHECKLIST.md)** - Comprehensive testing procedures
- 📚 **[Mobile Responsiveness QA Report](archive/docs/MOBILE_RESPONSIVENESS_QA.md)** - Detailed audit results

### Testing Mobile Experience
```bash
# Open in browser DevTools (F12)
# Toggle device mode (Ctrl+Shift+M)
# Test devices:
# - iPhone 12 Pro (390x844)
# - Samsung Galaxy S21 (360x800)
# - iPad (768x1024)
```

## Production Database Setup

The platform is production-ready with comprehensive database configuration:

### Features
- ✅ **Multiple Provider Support** - Supabase, Neon, AWS RDS, DigitalOcean
- ✅ **Connection Pooling** - Optimized for serverless deployments
- ✅ **SSL/TLS Security** - Encrypted connections required
- ✅ **Health Monitoring** - `/api/health/db` endpoint with detailed metrics
- ✅ **Backup Strategies** - Automated and manual backup procedures
- ✅ **Performance Monitoring** - Connection pool stats, slow queries, table sizes

### Quick Start
For production deployment, follow our comprehensive guides:

📚 **[Production Database Setup Guide](archive/docs/PRODUCTION_DATABASE_SETUP.md)** - Complete configuration guide  
📚 **[Production Deployment Quick Start](archive/docs/PRODUCTION_DEPLOYMENT_QUICKSTART.md)** - Step-by-step deployment walkthrough

### Database Providers

| Provider | Best For | Free Tier | Connection Pooling |
|----------|----------|-----------|-------------------|
| **Supabase** | MVP, Quick Setup | ✅ 500MB | ✅ Built-in PgBouncer |
| **Neon** | Serverless | ✅ 512MB | ✅ Automatic |
| **AWS RDS** | Enterprise | ❌ | ⚠️ Requires RDS Proxy |
| **DigitalOcean** | Mid-size | ❌ | ✅ Built-in |

### Configuration Example

```bash
# Supabase (recommended for MVP)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Neon (recommended for serverless)
DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require"
```

### Health Check API

Monitor database health in production:

```bash
# Basic health check
curl https://yourdomain.com/api/health/db

# Detailed metrics (connection pool, server stats, table sizes)
curl https://yourdomain.com/api/health/db?detailed=true
```

## Deployment

This Next.js application can be deployed to platforms like:
- **Vercel** (Recommended - Best Next.js support, **Free tier available**)
- AWS Amplify
- Netlify
- Any Node.js hosting platform

### 🚀 Quick Deployment to Vercel (Free)

Deploy the Minalesh Marketplace to Vercel for **free** with a custom .com domain:

**Total Cost: ~$10/year** (domain only - hosting is free!)

#### Quick Start (20 minutes)
1. **Sign up**: [vercel.com](https://vercel.com) (free account)
2. **Import**: Click "New Project" → Import from GitHub → Select this repository
3. **Configure**: Add environment variables (DATABASE_URL, JWT_SECRET, etc.)
4. **Deploy**: Click "Deploy" button
5. **Domain**: Add your custom .com domain in Settings → Domains

#### Complete Guides
- 📚 **[Vercel Deployment Guide](archive/VERCEL_DEPLOYMENT_GUIDE.md)** - Comprehensive step-by-step instructions
  - Prerequisites and setup (5 min)
  - Environment variables configuration
  - Database setup (Supabase/Neon - free tier)
  - Custom domain configuration
  - SSL certificates (automatic)
  - Webhook setup
  - Post-deployment checklist

- 📚 **[Beta Launch Summary](archive/BETA_LAUNCH_SUMMARY.md)** - Complete overview of beta features
  - New beta features (feedback system, announcements)
  - API endpoints documentation
  - Testing procedures
  - Success metrics

- 📚 **[Beta User Guide](archive/BETA_USER_GUIDE.md)** - Guide for beta testers
  - Getting started
  - How to provide feedback
  - Beta program benefits

#### Free Tier Resources
All these services offer generous free tiers:
- **Vercel**: Free (100GB bandwidth/month, unlimited sites)
- **Supabase**: Free (500MB database, 1GB file storage)
- **Resend**: Free (3,000 emails/month)
- **Sentry**: Free (5,000 errors/month)

### 🤖 Automated Deployment with GitHub Actions

This repository includes pre-configured GitHub Actions workflows for automated building and deployment:

#### Available Workflows

1. **Build and Test** (`.github/workflows/build-test.yml`)
   - Automatically runs on every push and pull request
   - Lints code, runs tests, and builds the application
   - Uploads build artifacts for download

2. **Deploy Demo to Vercel** (`.github/workflows/deploy-demo.yml`)
   - Automatically deploys to Vercel on push to main branch
   - Creates preview deployments for pull requests
   - Provides deployment URLs in PR comments

#### Quick Setup

1. **Enable workflows**: Workflows are ready to use - they'll run automatically on push/PR
2. **For Vercel deployment**: Add `VERCEL_TOKEN` to repository secrets
   - Go to Settings → Secrets and variables → Actions
   - Add new secret: `VERCEL_TOKEN` with your Vercel token
   - Get token from: https://vercel.com/account/tokens

#### Manual Deployment

You can also trigger deployments manually:
1. Go to the "Actions" tab in GitHub
2. Select "Deploy Demo to Vercel"
3. Click "Run workflow"
4. Select your branch and click "Run workflow"

📚 **[View Complete Deployment Documentation](.github/DEPLOYMENT.md)**
- **Domain**: ~$10/year (Namecheap, GoDaddy, Google Domains)

### Other Deployment Resources
- [Production Database Setup Guide](archive/archive/docs/PRODUCTION_DATABASE_SETUP.md)
- [Production Deployment Quick Start](archive/archive/docs/PRODUCTION_DEPLOYMENT_QUICKSTART.md)
- [Beta Release Checklist](archive/BETA_RELEASE_CHECKLIST.md)

## Documentation

For comprehensive documentation, please refer to:

- **[FEATURES.md](./FEATURES.md)** - Complete feature documentation organized by user type (Customer, Vendor, Admin)
- **[SETUP.md](./SETUP.md)** - Installation, configuration, deployment, and troubleshooting guide
- **[archive](./archive)** - Archived detailed documentation and implementation guides

## License

[Add your license here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
