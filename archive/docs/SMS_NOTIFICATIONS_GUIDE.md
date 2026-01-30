# SMS Notifications Integration Guide

**Version:** 1.0  
**Last Updated:** January 23, 2026  
**Status:** Production Ready

## Overview

The Minalesh Marketplace includes a comprehensive SMS notification system that keeps customers informed about their order status through every stage of the delivery process. This guide explains how SMS notifications work and how to configure them for production.

---

## Table of Contents

1. [Features](#features)
2. [How It Works](#how-it-works)
3. [Supported Providers](#supported-providers)
4. [Production Setup](#production-setup)
5. [SMS Workflow](#sms-workflow)
6. [Phone Number Formatting](#phone-number-formatting)
7. [Testing](#testing)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Features

✅ **Automatic SMS Notifications** - Sent at key order stages  
✅ **Ethiopian Phone Format** - Auto-formatting for +251 numbers  
✅ **Multiple Providers** - Africa's Talking, Twilio, or Mock  
✅ **Delivery Tracking** - All SMS logged in database  
✅ **Custom Messages** - Stage-specific messages with order details  
✅ **Courier Information** - Include courier name and contact  
✅ **Estimated Times** - Share delivery estimates with customers  
✅ **Async Processing** - Non-blocking SMS sending  

---

## How It Works

### Integration Points

SMS notifications are automatically triggered when:

1. **Order Status Changes** (`/api/orders/[orderId]/status`)
   - Order placed (pending)
   - Vendor confirms order (confirmed)
   - Order packed (packed)
   - Picked up by courier (picked_up)
   - In transit (in_transit)
   - Out for delivery (out_for_delivery)
   - Delivered (delivered)

2. **Tracking Updates** (`/api/orders/[orderId]/tracking`)
   - Manual SMS trigger via `sendNotification` parameter
   - Courier information updated
   - Delivery window updated

### Architecture

```
Order Status Update
        ↓
Status Change Saved to DB
        ↓
SMS Notification Triggered (async)
        ↓
SMS Provider API Called
        ↓
Notification Logged in DeliveryTracking
```

### SMS Content

Each stage has a pre-defined message template:

```typescript
// Example SMS Messages

// 1. Order Placed
"Minalesh: Your order MIN-1234 has been placed successfully. We'll notify you when it's confirmed."

// 2. Order Confirmed
"Minalesh: Great news! Your order MIN-1234 has been confirmed by the vendor and is being prepared."

// 3. Order Packed
"Minalesh: Your order MIN-1234 has been packed and is ready for pickup by our delivery partner."

// 4. Picked Up
"Minalesh: Your order MIN-1234 has been picked up by Ahmed (0911234567)."

// 5. In Transit
"Minalesh: Your order MIN-1234 is on the way! Estimated arrival: 3:00 PM"

// 6. Out for Delivery
"Minalesh: Your order MIN-1234 is out for delivery! Courier: Ahmed Contact: 0911234567"

// 7. Delivered
"Minalesh: Your order MIN-1234 has been delivered! Thank you for shopping with us. Rate your experience in the app."
```

---

## Supported Providers

### 1. Africa's Talking (Recommended for Ethiopia) ⭐

**Why Choose Africa's Talking:**
- ✅ Wide coverage across Ethiopia
- ✅ Reliable delivery rates
- ✅ Competitive pricing
- ✅ Local support
- ✅ Easy integration

**Configuration:**
```bash
SMS_PROVIDER=africas_talking
AFRICAS_TALKING_USERNAME=your_username
AFRICAS_TALKING_API_KEY=your_production_api_key
AFRICAS_TALKING_SHORT_CODE=12345  # Optional: Custom sender ID
```

**Pricing (Approximate):**
- ETB 0.80 - 1.20 per SMS (varies by volume)
- Volume discounts available
- No monthly fees for pay-as-you-go

### 2. Twilio (International)

**Why Choose Twilio:**
- ✅ Global coverage
- ✅ High reliability
- ✅ Advanced features
- ❌ Higher cost than local providers

**Configuration:**
```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Mock Provider (Development/Testing)

**For Development Only:**
```bash
SMS_PROVIDER=mock  # Or SMS_PROVIDER=none
```

- ✅ No actual SMS sent
- ✅ Logs to console
- ✅ Perfect for testing
- ❌ Not for production

---

## Production Setup

### Step 1: Choose Your Provider

We recommend **Africa's Talking** for Ethiopian deployment.

### Step 2: Create Account

**For Africa's Talking:**

1. Go to [Africa's Talking](https://africastalking.com)
2. Click "Sign Up"
3. Choose "Business Account"
4. Complete registration form
5. Verify your email address
6. Submit business documents for verification

**Required Documents:**
- Business license or trading certificate
- Tax identification number (TIN)
- National ID of authorized signatory
- Proof of business address

### Step 3: Get Production Credentials

1. Log in to your Africa's Talking dashboard
2. Navigate to **Account → API Settings**
3. Copy your credentials:
   - Username (your account username)
   - API Key (click "Generate" if needed)

### Step 4: Add Credit

1. Go to **Billing → Add Credit**
2. Choose payment method:
   - Bank transfer (recommended for large amounts)
   - Mobile money (M-Pesa, TeleBirr, etc.)
   - Credit/debit card
3. Add initial credit (recommend ETB 5,000 - 10,000 for testing)

### Step 5: Configure Sender ID (Optional)

**What is a Sender ID?**
A custom sender name that appears instead of a phone number.

**Example:**
- Without Sender ID: "From: +251900000000"
- With Sender ID: "From: MINALESH"

**How to Request:**

1. In dashboard, go to **SMS → Sender IDs**
2. Click "Request New Sender ID"
3. Enter desired sender ID (e.g., "MINALESH")
4. Provide business justification
5. Submit for approval

**Note:** Approval takes 1-3 business days. Use without sender ID until approved.

### Step 6: Set Environment Variables

Add to your production environment:

```bash
# SMS Provider Configuration
SMS_PROVIDER=africas_talking
AFRICAS_TALKING_USERNAME=your_username
AFRICAS_TALKING_API_KEY=your_production_api_key
AFRICAS_TALKING_SHORT_CODE=MINALESH  # Optional: After approval
```

**For Vercel:**
```bash
# Via Vercel Dashboard
# Settings → Environment Variables → Add New

# Or via CLI
vercel env add SMS_PROVIDER production
vercel env add AFRICAS_TALKING_USERNAME production
vercel env add AFRICAS_TALKING_API_KEY production
```

**For AWS Amplify:**
```bash
# Via AWS Console
# Amplify → Your App → Environment Variables → Manage Variables

# Or via AWS CLI
aws amplify put-environment-variable \
  --app-id YOUR_APP_ID \
  --environment-name production \
  --environment-variables SMS_PROVIDER=africas_talking
```

### Step 7: Test Integration

After deployment, test with a real order:

```bash
# 1. Create a test order with your phone number
# 2. Update order status to "confirmed"
# 3. Check if you receive SMS
# 4. Verify SMS logged in database

# Check SMS logs in database
SELECT * FROM delivery_tracking 
WHERE order_id = 'your-order-id'
AND sms_notifications_sent IS NOT NULL;
```

---

## SMS Workflow

### Automatic Notifications

SMS is automatically sent when order status changes:

```typescript
// Example: Update order status to "confirmed"
PUT /api/orders/{orderId}/status
{
  "status": "confirmed",
  "notes": "Vendor confirmed the order"
}

// Response
{
  "id": "order-id",
  "status": "confirmed",
  ...
}

// SMS is sent asynchronously:
// ✅ "Minalesh: Great news! Your order MIN-1234 has been confirmed..."
```

### Manual Notifications

You can also trigger SMS manually via tracking endpoint:

```typescript
// Send SMS notification manually
PUT /api/orders/{orderId}/tracking
{
  "sendNotification": true,
  "notificationStage": "in_transit"
}

// Response
{
  "success": true,
  "tracking": {...}
}
```

### Notification Stages

| Stage | Trigger | Message Content |
|-------|---------|----------------|
| `pending` | Order created | "Your order has been placed successfully" |
| `confirmed` | Vendor confirms | "Your order has been confirmed by the vendor" |
| `packed` | Order packed | "Your order has been packed and ready for pickup" |
| `picked_up` | Courier picks up | "Your order has been picked up by [Courier Name]" |
| `in_transit` | En route | "Your order is on the way! Estimated arrival: [Time]" |
| `out_for_delivery` | Out for delivery | "Your order is out for delivery! Courier: [Name] Contact: [Phone]" |
| `delivered` | Delivered | "Your order has been delivered! Thank you for shopping" |

---

## Phone Number Formatting

The system automatically formats Ethiopian phone numbers to international format.

### Supported Formats

All of these are converted to `+251911234567`:

```javascript
// Input → Output
"0911234567"      → "+251911234567"  // Remove leading 0
"911234567"       → "+251911234567"  // Add +251
"+251911234567"   → "+251911234567"  // Already correct
"251911234567"    → "+251911234567"  // Add +
```

### Phone Number Sources

The system checks for phone numbers in this order:

1. **Shipping Address Phone** - From order shipping address
2. **User Profile Phone** - From user's profile
3. **Billing Address Phone** - From order billing address

### Validation

- ✅ Must be a valid Ethiopian mobile number
- ✅ Must start with +251 after formatting
- ✅ Must be 13 characters total (+251 + 9 digits)

---

## Testing

### Development Testing

Use mock provider for development:

```bash
# .env.local
SMS_PROVIDER=mock
```

Console output:
```
📱 SMS (Mock): {
  to: '+251911234567',
  message: 'Minalesh: Your order MIN-1234 has been confirmed...',
  stage: 'confirmed'
}
```

### Staging Testing

Use Africa's Talking sandbox for staging:

```bash
# .env.staging
SMS_PROVIDER=africas_talking
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=your_sandbox_api_key
```

### Production Testing

Test with small amount of credit:

1. Create test order with your personal phone
2. Progress through order stages
3. Verify SMS received at each stage
4. Check delivery time and content
5. Verify cost in Africa's Talking dashboard

---

## Monitoring

### SMS Delivery Tracking

All SMS notifications are logged in the `delivery_tracking` table:

```sql
-- Check SMS notifications for an order
SELECT 
  order_id,
  sms_notifications_sent
FROM delivery_tracking
WHERE order_id = 'order-id';

-- Example result
{
  "order_id": "123",
  "sms_notifications_sent": [
    {
      "stage": "confirmed",
      "phone": "+251911234567",
      "success": true,
      "sentAt": "2026-01-23T10:00:00Z"
    },
    {
      "stage": "packed",
      "phone": "+251911234567",
      "success": true,
      "sentAt": "2026-01-23T12:00:00Z"
    }
  ]
}
```

### Application Logs

SMS events are logged for monitoring:

```typescript
// Success
logEvent('sms_sent', {
  to: '+251911234567',
  stage: 'confirmed',
  orderId: 'order-id',
  messageId: 'ATXid_...'
});

// Failure
logError(new Error('SMS send failed'), {
  operation: 'sendSMS',
  to: '+251911234567',
  stage: 'confirmed'
});
```

### Metrics to Track

Monitor these metrics in production:

1. **SMS Success Rate**
   - Target: > 95%
   - Alert if: < 90%

2. **Average Delivery Time**
   - Target: < 30 seconds
   - Alert if: > 2 minutes

3. **Cost per SMS**
   - Track daily/monthly spend
   - Set budget alerts

4. **Failed Deliveries**
   - Investigate if > 5%
   - Check phone number validity

### Africa's Talking Dashboard

Monitor in real-time:

1. Go to **SMS → Outbox**
2. View sent messages
3. Check delivery status
4. Review failure reasons
5. Track spending

---

## Troubleshooting

### SMS Not Sending

**Symptom:** SMS not being sent when order status changes

**Checklist:**

1. ✅ Verify SMS provider is configured:
   ```bash
   SMS_PROVIDER=africas_talking  # Not 'none' or 'mock'
   ```

2. ✅ Check API credentials are set:
   ```bash
   AFRICAS_TALKING_USERNAME=your_username
   AFRICAS_TALKING_API_KEY=your_api_key
   ```

3. ✅ Verify Africa's Talking account has credit

4. ✅ Check application logs for errors

5. ✅ Test SMS provider directly:
   ```bash
   # Use Africa's Talking API explorer
   curl -X POST https://api.africastalking.com/version1/messaging \
     -H "apiKey: YOUR_API_KEY" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=YOUR_USERNAME&to=+251911234567&message=Test"
   ```

### SMS Sent But Not Received

**Possible Causes:**

1. **Invalid Phone Number**
   - Verify format: +251911234567
   - Check if number is active

2. **Network Issues**
   - Try different phone/network
   - Check network coverage

3. **Blocked Sender**
   - Customer may have blocked sender
   - Ask customer to unblock

4. **Carrier Filtering**
   - Some carriers filter commercial SMS
   - Use approved sender ID

**Solutions:**

```bash
# 1. Check phone format in database
SELECT shipping_address->>'phone' FROM orders WHERE id = 'order-id';

# 2. Test with different phone number

# 3. Check Africa's Talking delivery report
# Dashboard → SMS → Delivery Reports
```

### High SMS Costs

**Cost Optimization:**

1. **Consolidate Messages**
   - Combine multiple updates into one SMS
   - Send only critical notifications

2. **Use Email for Non-Critical Updates**
   - Detailed updates via email
   - SMS only for time-sensitive info

3. **Negotiate Volume Discounts**
   - Contact Africa's Talking sales
   - Get better rates for high volume

4. **Optimize Message Length**
   - Keep under 160 characters
   - Avoid special characters (increases length)

### API Errors

**Error: "Invalid API Key"**
```bash
# Solution: Verify API key is correct
echo $AFRICAS_TALKING_API_KEY
# Should not be empty or 'your-api-key'
```

**Error: "Insufficient Credit"**
```bash
# Solution: Add credit to Africa's Talking account
# Dashboard → Billing → Add Credit
```

**Error: "Invalid Phone Number"**
```bash
# Solution: Check phone format
# Must be: +251XXXXXXXXX (13 chars)
```

---

## Best Practices

### Message Content

1. ✅ Keep messages concise (< 160 chars)
2. ✅ Include order number for reference
3. ✅ Add brand name ("Minalesh:")
4. ✅ Use clear, simple language
5. ✅ Include call-to-action when appropriate

### Timing

1. ✅ Send immediately after status change
2. ✅ Avoid sending between 10 PM - 7 AM
3. ✅ Group updates if multiple occur quickly
4. ❌ Don't spam (max 1 SMS per status)

### Privacy

1. ✅ Only send to opted-in customers
2. ✅ Include opt-out instructions
3. ✅ Respect customer preferences
4. ✅ Protect phone number data

### Cost Management

1. ✅ Monitor daily spending
2. ✅ Set budget alerts
3. ✅ Review delivery rates monthly
4. ✅ Optimize message templates

---

## Advanced Features

### Custom Messages

You can customize SMS messages per notification stage:

```typescript
// src/lib/sms.ts

const ORDER_STAGE_MESSAGES: Record<string, (orderNumber: string, extras?: Record<string, string>) => string> = {
  confirmed: (orderNumber) => 
    `🎉 Great news! Order ${orderNumber} confirmed and being prepared!`,
  // Customize other stages...
};
```

### Multi-Language Support

Add Amharic messages for local customers:

```typescript
const locale = order.user?.locale || 'en';

const messages = {
  en: {
    confirmed: `Order ${orderNumber} confirmed`,
  },
  am: {
    confirmed: `ትዕዛዝ ${orderNumber} ተረጋግጧል`,
  },
};
```

### A/B Testing

Test different message templates:

```typescript
// Randomly assign variant
const variant = Math.random() < 0.5 ? 'A' : 'B';

const messages = {
  A: `Your order ${orderNumber} has been confirmed!`,
  B: `Great news! Order ${orderNumber} is confirmed and being prepared!`,
};

// Track which variant performs better
```

---

## Support

### Documentation

- **Main Documentation:** This guide
- **API Reference:** `/docs/API.md`
- **Production Setup:** `/docs/PRODUCTION_SETUP_GUIDE.md`

### Provider Support

**Africa's Talking:**
- Email: support@africastalking.com
- Phone: +254 20 8200088
- Docs: https://developers.africastalking.com

**Minalesh Support:**
- Email: support@minalesh.com
- GitHub Issues: Report bugs and request features

---

**Last Updated:** January 23, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
