# Minalesh - Ethiopia's Intelligent Marketplace

A full-stack e-commerce application built with Next.js, specifically designed for the Ethiopian market.

## Features

### For Customers
- Browse products with Ethiopian Birr (ETB) pricing
- Search and filter by Ethiopian-specific categories
- Traditional and modern product categories
- AR view for select products
- Wishlist and cart functionality
- Product reviews and ratings

### For Vendors
- Vendor registration with Trade License and TIN verification
- Product management (Create, Read, Update, Delete)
- Inventory tracking
- Sales analytics
- Order management

### For Administrators
- **Comprehensive Product Management** - Full CRUD operations for all products
- Vendor approval system
- Analytics dashboard
- Category management
- Order oversight
- [View detailed admin documentation](docs/ADMIN_PRODUCT_MANAGEMENT.md)

### Ethiopian-Specific Features
- 🇪🇹 Ethiopian Birr (ETB) currency support
- 🏪 Local business verification (Trade License, TIN)
- ☕ Ethiopian product categories (Coffee, Traditional Clothing, Spices, etc.)
- 📍 Ethiopian market context and terminology
- 🎨 Cultural sensitivity in product categorization

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

### Security Notes

⚠️ **Important Security Considerations:**

1. **JWT Secret**: Always set a strong, random `JWT_SECRET` in production. The application will fail to start if this is not set.
2. **Admin Access**: Set `ADMIN_EMAILS` environment variable with comma-separated admin email addresses. This is a temporary solution - implement proper role-based access control for production.
3. **Token Storage**: Currently using localStorage for JWT tokens. For production, consider implementing httpOnly cookies for better XSS protection.
4. **Vendor Approval**: The vendor approval endpoint (`/api/profile/[vendorId]/approve`) requires admin access.
5. **Password Policy**: Enforces minimum 8 characters with at least one letter and one number.
6. **Database Connection**: Ensure your PostgreSQL connection string uses SSL in production.

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Technologies Used

This project is built with:

- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- shadcn-ui
- PostgreSQL (Database)
- Prisma ORM
- TanStack Query
- JWT Authentication

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## Key Routes

- `/` - Homepage with featured products
- `/products` - Browse all products
- `/product/[id]` - Product detail page
- `/admin` - Admin dashboard with product management
- `/dashboard` - User dashboard
- `/profile` - User profile and vendor management
- `/cart` - Shopping cart
- `/wishlist` - Saved items

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

## Deployment

This Next.js application can be deployed to platforms like:
- Vercel
- Netlify
- AWS Amplify
- Any Node.js hosting platform
