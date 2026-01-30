# Subscription Features - Manual Testing Guide

This document outlines the subscription features implemented and how to test them.

## ✅ Implemented Features

### 1. Premium Subscription
**Location**: `/app/subscriptions` (Premium tab)

**Features**:
- ✅ View premium benefits (free shipping, extended returns, 2x loyalty points, etc.)
- ✅ Subscribe to monthly (99 ETB) or yearly (999 ETB) plans
- ✅ View current subscription status and renewal date
- ✅ Pause subscription
- ✅ Resume subscription
- ✅ Cancel subscription (with confirmation dialog)
- ✅ Auto-renewal on subscription end date

**API Endpoints**:
- `GET /api/subscriptions/premium` - Get subscription status
- `POST /api/subscriptions/premium` - Create new subscription
- `PUT /api/subscriptions/premium` - Pause/resume subscription
- `DELETE /api/subscriptions/premium` - Cancel subscription

### 2. Product Subscription (Subscribe & Save)
**Location**: 
- Product detail pages (`/product/[id]`) - Subscribe button
- `/app/subscriptions` (Subscribe & Save tab) - Manage subscriptions

**Features**:
- ✅ Subscribe to products with 10% discount
- ✅ Choose delivery frequency (weekly, biweekly, monthly, bimonthly, quarterly)
- ✅ Select quantity per delivery (1-100)
- ✅ View all active subscriptions
- ✅ Skip next delivery
- ✅ Pause subscription
- ✅ Resume subscription
- ✅ Update frequency
- ✅ Cancel subscription
- ✅ View delivery history
- ✅ Auto-create orders on delivery dates

**API Endpoints**:
- `GET /api/subscriptions/products` - List user's product subscriptions
- `POST /api/subscriptions/products` - Create product subscription
- `GET /api/subscriptions/products/[id]` - Get subscription details
- `PUT /api/subscriptions/products/[id]` - Update/pause/resume/skip subscription
- `DELETE /api/subscriptions/products/[id]` - Cancel subscription

### 3. Auto-Renewal Processing
**Location**: Cron jobs configured in `vercel.json`

**Features**:
- ✅ Premium subscription auto-renewal (runs daily at 6 AM)
- ✅ Product subscription delivery processing (runs daily at 8 AM)
- ✅ Renewal reminder emails (runs daily at 7 AM)
- ✅ Payment simulation for premium renewals
- ✅ Order creation for product deliveries
- ✅ Stock validation before delivery
- ✅ Email notifications for all events

**Cron Endpoints**:
- `/api/cron/process-premium-renewals` - Renew premium subscriptions
- `/api/cron/process-subscriptions` - Process product deliveries
- `/api/cron/subscription-renewal-reminders` - Send renewal reminders

### 4. Email Notifications
**Implemented in**: `/src/lib/email.ts`

**Email Types**:
- ✅ Subscription renewal success
- ✅ Subscription renewal failure
- ✅ Renewal reminder (7-day, 3-day, 1-day before)
- ✅ Product delivery notification

## 🧪 Manual Testing Checklist

### Premium Subscription Flow
1. [ ] Navigate to `/subscriptions`
2. [ ] Click "Premium" tab
3. [ ] Verify benefits are displayed correctly
4. [ ] Select monthly plan
5. [ ] Click "Start Premium Membership"
6. [ ] Verify subscription is created (requires authentication)
7. [ ] Verify subscription card shows "Active" status
8. [ ] Click "Pause" and verify status changes
9. [ ] Click "Resume" and verify status changes
10. [ ] Click "Cancel" and confirm in dialog
11. [ ] Verify subscription shows cancelled status

### Product Subscription Flow
1. [ ] Navigate to any product detail page (e.g., `/product/[id]`)
2. [ ] Verify "Subscribe & Save 10%" button appears (only for in-stock products)
3. [ ] Click the Subscribe & Save button
4. [ ] Select delivery frequency (e.g., "Every month")
5. [ ] Select quantity (e.g., 2)
6. [ ] Verify discounted price calculation (10% off)
7. [ ] Click "Start Subscription"
8. [ ] Verify redirect to `/subscriptions?tab=products`
9. [ ] Verify subscription appears in the list
10. [ ] Click "Skip Next" and verify next delivery date updates
11. [ ] Click frequency dropdown and change to "Every week"
12. [ ] Click "Pause" and verify status changes
13. [ ] Click "Resume" and verify status changes
14. [ ] Click "Cancel" and confirm in dialog
15. [ ] Verify subscription shows cancelled status

### Auto-Renewal Testing (Manual Trigger)
1. [ ] Trigger premium renewal: `POST /api/cron/process-premium-renewals`
2. [ ] Verify response shows renewals processed
3. [ ] Trigger product deliveries: `POST /api/cron/process-subscriptions`
4. [ ] Verify response shows deliveries processed
5. [ ] Trigger renewal reminders: `POST /api/cron/subscription-renewal-reminders`
6. [ ] Verify response shows reminders sent

### Database Validation
1. [ ] Check `PremiumSubscription` table for subscription records
2. [ ] Check `ProductSubscription` table for subscription records
3. [ ] Check `SubscriptionPayment` table for payment records
4. [ ] Check `SubscriptionOrder` table for delivery orders
5. [ ] Verify `skippedDates` array updates when skipping deliveries
6. [ ] Verify `totalDeliveries` counter increments

## 🎨 UI Components

### PremiumSubscriptionCard
**Location**: `/src/components/subscriptions/PremiumSubscriptionCard.tsx`
- Shows plan selection for non-subscribers
- Shows subscription details for active subscribers
- Pause/Resume/Cancel actions with confirmation

### ProductSubscriptionsList
**Location**: `/src/components/subscriptions/ProductSubscriptionsList.tsx`
- Lists all product subscriptions
- Individual subscription cards with product image
- Skip/Pause/Resume/Cancel actions
- Frequency editor dropdown

### SubscribeAndSaveButton
**Location**: `/src/components/subscriptions/` (exported from index.ts)
**Implementation**: `/src/components/subscriptions/ProductSubscriptionsList.tsx`
- Dialog-based subscription creation
- Frequency and quantity selection
- Price calculation with discount display

## 📊 Business Logic

### Subscription Library
**Location**: `/src/lib/subscription.ts`

**Key Functions**:
- `createPremiumSubscription()` - Create premium subscription
- `createProductSubscription()` - Create product subscription
- `pausePremiumSubscription()` - Pause premium
- `pauseProductSubscription()` - Pause product subscription
- `resumePremiumSubscription()` - Resume premium
- `resumeProductSubscription()` - Resume product subscription
- `skipNextDelivery()` - Skip next product delivery
- `processSubscriptionDelivery()` - Create order from subscription
- `getSubscriptionsDueForDelivery()` - Get subscriptions ready for delivery
- `calculateNextDeliveryDate()` - Calculate next delivery based on frequency

### Pricing Constants
- Premium Monthly: **99 ETB** (30 days)
- Premium Yearly: **999 ETB** (365 days) - 16% savings
- Subscribe & Save Discount: **10%**

### Premium Benefits
- Free shipping on all orders
- Extended returns (14 days)
- 2x loyalty points
- Priority customer support
- Exclusive deals
- Early access to sales

## 🔒 Security & Validation

### Input Validation
- ✅ Plan type validation (premium_monthly, premium_yearly)
- ✅ Frequency validation (weekly, biweekly, monthly, bimonthly, quarterly)
- ✅ Quantity validation (1-100)
- ✅ Product existence validation
- ✅ User authentication required for all operations

### Cron Job Security
- ✅ CRON_SECRET environment variable for authorization
- ✅ Bearer token or X-Cron-Secret header required
- ✅ Allows in development mode if CRON_SECRET not set

## 📝 Notes

### Payment Integration
The premium renewal cron includes a **simulation** for testing. In production:
- Integrate with Stripe or payment provider
- Charge saved payment method
- Handle payment failures with retry logic
- Use webhooks for async confirmations

### Production Deployment
1. Set `CRON_SECRET` environment variable
2. Configure email service (RESEND_API_KEY)
3. Set up Stripe or payment provider
4. Configure database migrations
5. Enable cron jobs in hosting platform

### Known Limitations
- Payment processing is simulated (needs real payment gateway)
- Email sending requires RESEND_API_KEY configuration
- Cron jobs run on Vercel schedule (may need adjustment for other platforms)
