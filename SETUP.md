# Minalesh Platform Setup Guide

This document provides comprehensive setup, configuration, and deployment instructions for the Minalesh e-commerce platform.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Development](#development)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Production Checklist](#production-checklist)
10. [Troubleshooting](#troubleshooting)

## Getting Started

Minalesh is a modern e-commerce platform built with:
- **Next.js 14+** (App Router)
- **React 18** with TypeScript
- **Prisma ORM** with PostgreSQL
- **Tailwind CSS** for styling
- **NextAuth.js** for authentication
- **Vercel** for deployment (recommended)

## Prerequisites

Before you begin, ensure you have:
- **Node.js** 18.x or later
- **npm** or **yarn** package manager
- **PostgreSQL** 14.x or later (local or cloud)
- **Git** for version control
- **Code editor** (VS Code recommended)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/getachewzemene/minalesh-amplify.git
cd minalesh-amplify
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Install Development Tools

```bash
# Install Prisma CLI globally (optional)
npm install -g prisma

# Install development dependencies
npm install --save-dev
```

## Environment Configuration

### 1. Environment File Overview

The repository includes a `.env` file with default values for local development.

**For Local Development:**
- The `.env` file is already present with safe default values
- Update the values in `.env` according to your local setup (database credentials, API keys, etc.)

**For Production Deployment:**
- DO NOT commit sensitive production values to `.env`
- Override environment variables using your deployment platform:
  - **Vercel**: Project Settings → Environment Variables
  - **AWS/Docker**: Use environment-specific configuration or AWS Secrets Manager
  - **Other platforms**: Use their respective environment variable management

### 2. Required Environment Variables

Edit `.env` and configure the following variables for your local setup:

#### Database Configuration
```env
DATABASE_URL="postgresql://user:password@localhost:5432/minalesh_db"
DIRECT_URL="postgresql://user:password@localhost:5432/minalesh_db"
```

#### Authentication (NextAuth.js)
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

#### AWS S3 (for image uploads)
```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
```

#### Email Service (Resend or SendGrid)
```env
RESEND_API_KEY="your-resend-api-key"
# or
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@yourdomain.com"
```

#### SMS Service (optional)
```env
SMS_API_KEY="your-sms-api-key"
SMS_SENDER_ID="YourBrand"
```

#### Payment Gateway (optional)
```env
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="your-webhook-secret"
```

#### Security & Protection
```env
HCAPTCHA_SECRET_KEY="your-hcaptcha-secret"
NEXT_PUBLIC_HCAPTCHA_SITE_KEY="your-hcaptcha-site-key"
```

#### Analytics (optional)
```env
NEXT_PUBLIC_GA_TRACKING_ID="your-google-analytics-id"
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Using psql
createdb minalesh_db

# Or using SQL
psql -U postgres -c "CREATE DATABASE minalesh_db;"
```

### 2. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Or for production
npx prisma migrate deploy
```

### 3. Seed the Database (Optional)

```bash
npx prisma db seed
```

This will populate the database with:
- Sample categories
- Demo products
- Test users (admin, vendor, customer)
- Sample data for testing

### 4. View Database with Prisma Studio

```bash
npx prisma studio
```

Access at: http://localhost:5555

## Development

### 1. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Access the application at: http://localhost:3000

### 2. Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database (caution!)

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### 3. Default User Accounts (After Seeding)

**Admin Account:**
- Email: `admin@minalesh.com`
- Password: `admin123`
- Role: ADMIN

**Vendor Account:**
- Email: `vendor@minalesh.com`
- Password: `vendor123`
- Role: VENDOR

**Customer Account:**
- Email: `customer@minalesh.com`
- Password: `customer123`
- Role: CUSTOMER

**⚠️ Change these credentials in production!**

## Testing

### Run All Tests

```bash
npm run test
```

### Run Specific Test Suites

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (if configured)
npm run test:e2e
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Product browsing and search
- [ ] Add to cart and checkout
- [ ] Order placement and tracking
- [ ] Vendor product management
- [ ] Admin dashboard access
- [ ] Payment processing
- [ ] Email notifications
- [ ] Image uploads
- [ ] Responsive design on mobile

## Deployment

### Vercel Deployment (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### 4. Configure Environment Variables

Add all environment variables in the Vercel dashboard:
- Project Settings → Environment Variables
- Add each variable from your `.env` file
- Ensure database URL points to production database

#### 5. Configure Database

For production, use a managed PostgreSQL service:
- **Vercel Postgres** (recommended for Vercel deployment)
- **Supabase**
- **Neon**
- **Railway**
- **PlanetScale**

### Alternative Deployment Options

#### Docker Deployment

```bash
# Build Docker image
docker build -t minalesh .

# Run container
docker run -p 3000:3000 --env-file .env minalesh
```

#### Traditional VPS/Server

```bash
# Build the application
npm run build

# Start production server
npm run start

# Or use PM2 for process management
pm2 start npm --name "minalesh" -- start
```

## Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Use strong, unique secrets for `NEXTAUTH_SECRET`
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable hCaptcha on forms
- [ ] Configure security headers
- [ ] Set up DDoS protection
- [ ] Enable database backups
- [ ] Implement monitoring and alerting

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure image optimization
- [ ] Set up caching (Redis recommended)
- [ ] Optimize database queries
- [ ] Enable gzip/brotli compression
- [ ] Monitor application performance
- [ ] Set up error tracking (Sentry, etc.)

### Configuration
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Configure production database
- [ ] Set up email service (Resend/SendGrid)
- [ ] Configure S3 bucket for production
- [ ] Set up payment gateway (Stripe, etc.)
- [ ] Configure SMS service for notifications
- [ ] Update Google Analytics tracking ID

### Database
- [ ] Run production migrations
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Optimize database indices
- [ ] Set up read replicas (if needed)

### Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Enable performance monitoring
- [ ] Set up log aggregation
- [ ] Configure alerting for critical events

### Compliance
- [ ] Review and update privacy policy
- [ ] Update terms of service
- [ ] Ensure GDPR compliance
- [ ] Configure cookie consent
- [ ] Set up data retention policies

## Troubleshooting

### Common Issues

#### Database Connection Errors

```
Error: P1001: Can't reach database server
```

**Solution:**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall rules
- Verify database credentials

#### Prisma Client Errors

```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npx prisma generate
```

#### Build Errors

```
Error: Type error: Cannot find module...
```

**Solution:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

#### Authentication Issues

```
Error: [next-auth][error][JWT_SESSION_ERROR]
```

**Solution:**
- Ensure `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Check session configuration

#### Image Upload Failures

```
Error: AWS credentials not found
```

**Solution:**
- Verify AWS credentials in `.env`
- Check S3 bucket permissions
- Ensure bucket CORS is configured

### Environment-Specific Issues

#### Development
- Clear browser cache and cookies
- Restart development server
- Check console for JavaScript errors
- Verify API routes are working

#### Production
- Check application logs
- Verify environment variables are set
- Ensure database migrations ran
- Check server resources (CPU, memory)

### Getting Help

- **Documentation**: Check archived docs in `./archive`
- **GitHub Issues**: Report bugs or request features
- **Community**: Join discussions (if available)
- **Support**: Contact maintainers

## Additional Resources

### Key Files and Directories

```
minalesh-amplify/
├── app/                    # Next.js App Router pages
├── src/
│   ├── components/        # React components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── services/         # Business logic
│   └── page-components/  # Page-level components
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seeds/            # Seed data
├── public/               # Static assets
├── archive/              # Archived documentation
├── .env                  # Environment variables (tracked with defaults)
├── FEATURES.md          # Feature documentation
├── SETUP.md             # This file
└── README.md            # Project overview
```

### Useful Commands

```bash
# Database
npx prisma db push          # Push schema without migration
npx prisma migrate reset    # Reset and reseed database
npx prisma format          # Format schema file

# Development
npm run dev -- --turbo     # Use Turbopack (faster)
npm run lint -- --fix      # Auto-fix linting issues

# Debugging
NODE_OPTIONS='--inspect' npm run dev  # Enable Node debugger
```

---

For feature documentation, see [FEATURES.md](./FEATURES.md).
For archived detailed documentation, see the [archive](./archive) directory.
