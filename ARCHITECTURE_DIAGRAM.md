# Architecture Diagram: Implemented Features (8-13)

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MINALESH PLATFORM                            │
│                    Ethiopian E-commerce Marketplace                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js 14)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Order Tracking   │  │ Loyalty Program  │  │ Language Switch  │  │
│  │ /orders/[id]     │  │ /dashboard/      │  │ Component        │  │
│  │                  │  │ loyalty          │  │                  │  │
│  │ • Timeline UI    │  │ • Points Display │  │ • 4 Languages    │  │
│  │ • Event Tracker  │  │ • Tier System    │  │ • User Prefs     │  │
│  │ • Order Details  │  │ • Transaction    │  │ • Persistence    │  │
│  │                  │  │   History        │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐                         │
│  │ Product Compare  │  │ SEO Components   │                         │
│  │ /products/       │  │                  │                         │
│  │ compare          │  │ • Sitemap        │                         │
│  │                  │  │ • Robots.txt     │                         │
│  │ • Side-by-side   │  │ • Meta Tags      │                         │
│  │ • Specs Table    │  │ • Open Graph     │                         │
│  └──────────────────┘  └──────────────────┘                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js API Routes)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Order APIs                                                     │  │
│  │ GET    /api/orders/:orderId/events    # Fetch tracking events │  │
│  │ POST   /api/orders/:orderId/events    # Add tracking event    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Loyalty APIs                                                   │  │
│  │ GET    /api/loyalty/account           # Get loyalty account   │  │
│  │ POST   /api/loyalty/account           # Add points            │  │
│  │ GET    /api/loyalty/transactions      # Transaction history   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ User Preferences                                               │  │
│  │ GET    /api/user/preferences          # Get preferences       │  │
│  │ PATCH  /api/user/preferences          # Update language       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Email Marketing (Admin Only)                                   │  │
│  │ GET    /api/admin/email-campaigns     # List campaigns        │  │
│  │ POST   /api/admin/email-campaigns     # Create campaign       │  │
│  │ GET    /api/admin/email-campaigns/:id # Get campaign          │  │
│  │ PATCH  /api/admin/email-campaigns/:id # Update campaign       │  │
│  │ DELETE /api/admin/email-campaigns/:id # Delete campaign       │  │
│  │ POST   /api/admin/email-campaigns/:id/send # Send/schedule    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Product Comparison                                             │  │
│  │ GET    /api/products/compare          # Get comparison list   │  │
│  │ GET    /api/products/compare/details  # Get product details   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ Order          │  │ OrderEvent     │  │ OrderItem      │        │
│  │ ─────────      │  │ ──────────     │  │ ─────────      │        │
│  │ id             │  │ id             │  │ id             │        │
│  │ orderNumber    │  │ orderId        │  │ orderId        │        │
│  │ status         │  │ eventType      │  │ productId      │        │
│  │ totalAmount    │  │ status         │  │ quantity       │        │
│  │ ...            │  │ description    │  │ price          │        │
│  │                │  │ metadata       │  │ ...            │        │
│  │                │  │ createdAt      │  │                │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐                            │
│  │ LoyaltyAccount │  │ LoyaltyTrans.  │                            │
│  │ ──────────     │  │ ──────────     │                            │
│  │ id             │  │ id             │                            │
│  │ userId         │  │ accountId      │                            │
│  │ points         │  │ points         │                            │
│  │ lifetimePoints │  │ type           │                            │
│  │ tier           │  │ description    │                            │
│  │ nextTierPoints │  │ createdAt      │                            │
│  │ ...            │  │ expiresAt      │                            │
│  └────────────────┘  └────────────────┘                            │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ EmailCampaign  │  │ EmailTemplate  │  │ EmailSub.      │        │
│  │ ─────────      │  │ ──────────     │  │ ─────────      │        │
│  │ id             │  │ id             │  │ id             │        │
│  │ name           │  │ name           │  │ email          │        │
│  │ subject        │  │ htmlContent    │  │ userId         │        │
│  │ htmlContent    │  │ textContent    │  │ isSubscribed   │        │
│  │ type           │  │ category       │  │ preferences    │        │
│  │ status         │  │ variables      │  │ ...            │        │
│  │ scheduledFor   │  │ ...            │  │                │        │
│  │ sentCount      │  │                │  │                │        │
│  │ openCount      │  │                │  │                │        │
│  │ ...            │  │                │  │                │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ UserPrefs      │  │ EmailQueue     │  │ Product        │        │
│  │ ─────────      │  │ ──────────     │  │ ──────────     │        │
│  │ id             │  │ id             │  │ id             │        │
│  │ userId         │  │ to             │  │ name           │        │
│  │ language       │  │ subject        │  │ price          │        │
│  │ currency       │  │ html           │  │ images         │        │
│  │ emailMarketing │  │ status         │  │ specifications │        │
│  │ smsMarketing   │  │ metadata       │  │ features       │        │
│  │ ...            │  │ ...            │  │ ...            │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Email Queue Processing
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND SERVICES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Email Queue Processor (Cron)                               │     │
│  │ • Process pending emails                                   │     │
│  │ • Send via Resend API                                      │     │
│  │ • Update campaign analytics                                │     │
│  │ • Runs every 1-5 minutes                                   │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Scheduled Campaign Processor (Cron)                        │     │
│  │ • Check for scheduled campaigns                            │     │
│  │ • Queue emails when time matches                           │     │
│  │ • Update campaign status                                   │     │
│  │ • Runs every hour                                          │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Order Tracking Flow
```
Customer Places Order
        │
        ▼
Order Created in DB
        │
        ▼
OrderEvent: "order_placed" Created
        │
        ▼
Vendor Confirms Order
        │
        ▼
OrderEvent: "confirmed" Created
        │
        ▼
Vendor Packs Order
        │
        ▼
OrderEvent: "packed" Created
        │
        ▼
Courier Picks Up
        │
        ▼
OrderEvent: "shipped" Created
(with metadata: courier, tracking #)
        │
        ▼
Customer Views /orders/[id]
        │
        ▼
Timeline Component Fetches Events
        │
        ▼
Display Visual Timeline
```

### 2. Loyalty Points Flow
```
Customer Makes Purchase
        │
        ▼
Order Completed (status: delivered)
        │
        ▼
Calculate Points (based on tier)
        │
        ▼
Create LoyaltyTransaction
(type: "purchase", points: +100)
        │
        ▼
Update LoyaltyAccount
(points += 100, lifetimePoints += 100)
        │
        ▼
Check Tier Progression
        │
        ▼
Update Tier if Threshold Reached
        │
        ▼
Customer Views /dashboard/loyalty
        │
        ▼
Display Points, Tier, History
```

### 3. Email Campaign Flow
```
Admin Creates Campaign
        │
        ▼
Save as Draft in EmailCampaign
        │
        ▼
Admin Schedules or Sends
        │
        ├─ Send Now
        │   │
        │   ▼
        │   Get Target Recipients
        │   (based on segmentCriteria)
        │   │
        │   ▼
        │   Queue Emails to EmailQueue
        │   │
        │   ▼
        │   Cron Processes Queue
        │   │
        │   ▼
        │   Send via Resend API
        │   │
        │   ▼
        │   Update Campaign Analytics
        │
        └─ Schedule for Later
            │
            ▼
            Set status: "scheduled"
            Set scheduledFor: future date
            │
            ▼
            Cron Checks Hourly
            │
            ▼
            Time Matches? → Queue Emails
```

### 4. Multi-Language Flow
```
User Opens Website
        │
        ▼
Check User Preferences DB
        │
        ├─ Has Preference? → Load Language
        │
        └─ No Preference?
            │
            ▼
            Check LocalStorage
            │
            ├─ Has Value? → Load Language
            │
            └─ No Value?
                │
                ▼
                Detect Browser Language
                │
                ▼
                Default to English
                │
                ▼
User Clicks Language Switcher
        │
        ▼
Update User Preferences API
        │
        ▼
Update LocalStorage
        │
        ▼
Reload Page with New Locale
        │
        ▼
next-intl Loads messages/[locale].json
        │
        ▼
UI Displays in Selected Language
```

## Technology Stack

```
┌─────────────────────────────────────────────┐
│ Frontend                                     │
├─────────────────────────────────────────────┤
│ • Next.js 14 (App Router)                   │
│ • React 18                                   │
│ • TypeScript                                 │
│ • Tailwind CSS                               │
│ • shadcn/ui Components                       │
│ • next-intl (Internationalization)           │
│ • date-fns (Date Formatting)                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Backend                                      │
├─────────────────────────────────────────────┤
│ • Next.js API Routes                         │
│ • Prisma ORM                                 │
│ • PostgreSQL Database                        │
│ • JWT Authentication                         │
│ • Resend (Email Service)                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ DevOps & Tools                               │
├─────────────────────────────────────────────┤
│ • Vercel (Deployment)                        │
│ • GitHub (Version Control)                   │
│ • Swagger (API Documentation)                │
│ • ESLint (Code Quality)                      │
└─────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────┐
│ Authentication & Authorization               │
├─────────────────────────────────────────────┤
│                                              │
│  Public Routes                               │
│  ├─ Product Comparison                       │
│  ├─ SEO (Sitemap, Robots)                    │
│  └─ Static Pages                             │
│                                              │
│  Authenticated Routes                        │
│  ├─ Order Tracking (own orders only)         │
│  ├─ Loyalty Dashboard                        │
│  └─ Language Preferences                     │
│                                              │
│  Admin Routes (Admin Role Required)          │
│  ├─ Email Campaigns                          │
│  ├─ Campaign Management                      │
│  └─ Send/Schedule Campaigns                  │
│                                              │
└─────────────────────────────────────────────┘

Security Features:
• JWT token validation
• Role-based access control (RBAC)
• Order ownership verification
• Admin-only email campaign access
• HTTPS enforcement (production)
• SQL injection protection (Prisma)
• XSS protection (React escaping)
```

## Performance Optimizations

```
┌─────────────────────────────────────────────┐
│ Database Optimizations                       │
├─────────────────────────────────────────────┤
│ • Indexes on orderId (OrderEvent)            │
│ • Indexes on accountId (LoyaltyTransaction) │
│ • Indexes on status, scheduledFor (Campaign) │
│ • Indexes on isSubscribed (EmailSubscription)│
│ • Pagination on transaction history          │
│ • Lazy loading of translation files          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Frontend Optimizations                       │
├─────────────────────────────────────────────┤
│ • React component lazy loading               │
│ • Image optimization (Next.js Image)         │
│ • Code splitting per route                   │
│ • Skeleton loaders for better UX             │
│ • LocalStorage caching for language          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Email Processing                             │
├─────────────────────────────────────────────┤
│ • Batch email queuing                        │
│ • Background processing via cron             │
│ • Retry logic with exponential backoff       │
│ • Rate limiting for email sending            │
└─────────────────────────────────────────────┘
```

---

**Last Updated**: December 31, 2024  
**Version**: 1.0  
**Status**: Production Ready
