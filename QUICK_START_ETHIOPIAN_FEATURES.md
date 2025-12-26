# Quick Start Guide: Ethiopian Market Features

This guide will help you get started with the new Ethiopian market features.

## Prerequisites

- Database setup (PostgreSQL)
- Node.js 18+
- Existing Minalesh installation

## Step 1: Database Migration

Apply the new database schema:

```bash
# Apply migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

This will create 10 new tables for the features.

## Step 2: Test the APIs

### Test Multi-Language Support

```bash
# Get user preferences (requires auth)
curl http://localhost:3000/api/user/preferences \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Update language to Amharic
curl -X PATCH http://localhost:3000/api/user/preferences \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"am"}'
```

### Test Loyalty Program

```bash
# Get loyalty account (auto-creates if doesn't exist)
curl http://localhost:3000/api/loyalty/account \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Award points (admin only)
curl -X POST http://localhost:3000/api/loyalty/account \
  -H "Cookie: auth_token=ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "points": 100,
    "type": "purchase",
    "description": "Order #12345"
  }'
```

### Test Referral Program

```bash
# Get or create referral code
curl http://localhost:3000/api/referral/code \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Generate new code
curl -X POST http://localhost:3000/api/referral/code \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

### Test Gift Cards

```bash
# Purchase gift card
curl -X POST http://localhost:3000/api/gift-cards/purchase \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "recipientEmail": "friend@example.com",
    "message": "Happy Birthday!"
  }'
```

## Step 3: Add Components to Your UI

### Add Language Switcher to Navigation

```tsx
// In your navigation component
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'

export function Navigation() {
  return (
    <nav>
      {/* ... other nav items ... */}
      <LanguageSwitcher />
    </nav>
  )
}
```

### Add Social Sharing to Product Pages

```tsx
// In your product detail page
import { SocialShare } from '@/components/social/SocialShare'

export function ProductPage({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <SocialShare 
        title={product.name}
        description={product.description}
        imageUrl={product.imageUrl}
      />
    </div>
  )
}
```

## Step 4: Integrate with Existing Features

### Award Loyalty Points on Order Completion

Add this to your order completion handler:

```typescript
import { awardPoints, calculatePointsFromAmount } from '@/lib/loyalty/points'

// After order is marked as delivered/completed
const points = calculatePointsFromAmount(order.totalAmount)
await awardPoints(
  order.userId,
  points,
  'purchase',
  `Order #${order.orderNumber}`,
  order.id
)
```

### Process Referral Rewards on First Purchase

Add this to your order completion handler:

```typescript
// Check if this is user's first completed order
const orderCount = await prisma.order.count({
  where: {
    userId: order.userId,
    status: 'delivered',
  },
})

if (orderCount === 1) {
  // Find referral
  const referral = await prisma.referral.findFirst({
    where: {
      refereeId: order.userId,
      status: 'registered',
    },
  })

  if (referral) {
    // Award points to both parties
    await awardPoints(
      referral.referrerId,
      100,
      'referral',
      'Referral reward',
      referral.id
    )
    
    await awardPoints(
      order.userId,
      50,
      'referral',
      'Referee reward',
      referral.id
    )

    // Update referral status
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        rewardIssued: true,
      },
    })
  }
}
```

## Step 5: Translation Usage

Use translations in your components:

```tsx
'use client'

import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations()
  
  return (
    <div>
      <h1>{t('products.title')}</h1>
      <button>{t('products.addToCart')}</button>
    </div>
  )
}
```

## Step 6: Environment Variables

Add these optional environment variables:

```bash
# .env
# Base URL for sitemap and SEO
NEXT_PUBLIC_BASE_URL=https://minalesh.et

# JWT secret (already exists, just ensure it's set)
JWT_SECRET=your-super-secret-key

# Email service for gift card delivery (already exists)
RESEND_API_KEY=your-resend-api-key
```

## Step 7: Testing Checklist

- [ ] Database migration applied successfully
- [ ] Language switcher appears in navigation
- [ ] User can switch between languages
- [ ] Language preference is saved
- [ ] Loyalty account is created for new users
- [ ] Points are awarded on orders
- [ ] Tier progression works correctly
- [ ] Referral codes can be generated
- [ ] Gift cards can be purchased
- [ ] Social sharing buttons work
- [ ] Sitemap.xml is accessible at /sitemap.xml
- [ ] Robots.txt is accessible at /robots.txt

## Common Issues & Solutions

### Issue: Migration fails with "DATABASE_URL not found"

**Solution**: Ensure `.env` file has `DATABASE_URL` set:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/minalesh"
```

### Issue: Language switcher doesn't appear

**Solution**: Make sure you've:
1. Installed next-intl: `npm install next-intl`
2. Created i18n.ts configuration
3. Updated middleware.ts
4. Imported the component correctly

### Issue: Loyalty points not calculating correctly

**Solution**: Check that:
1. The order total is in ETB
2. The `awardPoints` function is called after order completion
3. The user has a loyalty account (auto-created on first GET)

### Issue: Referral code not unique

**Solution**: The code generation has built-in retry logic (10 attempts). If it still fails:
1. Check database constraints
2. Verify code generation function is random enough
3. Check if code space is exhausted (very unlikely with 8 characters)

## Next Steps

1. **Build remaining UI components**:
   - Loyalty dashboard showing points and tier
   - Referral sharing modal with social buttons
   - Gift card purchase form
   - Seller rating form

2. **Complete remaining APIs**:
   - Gift card redemption
   - Gift card balance check
   - Seller rating submission
   - Dispute filing and messaging

3. **Email notifications**:
   - Gift card delivery
   - Points earned
   - Tier upgrades
   - Referral success

4. **Testing**:
   - Unit tests for utilities
   - Integration tests for APIs
   - E2E tests for user flows

## Support & Documentation

- **Feature Guide**: [NEW_FEATURES_GUIDE.md](./NEW_FEATURES_GUIDE.md)
- **Implementation Details**: [ETHIOPIAN_MARKET_IMPLEMENTATION.md](./ETHIOPIAN_MARKET_IMPLEMENTATION.md)
- **Main README**: [README.md](./README.md)
- **Feature Roadmap**: [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)

## Need Help?

If you encounter any issues:
1. Check the documentation files listed above
2. Review the API endpoint comments in the code
3. Check console logs for error messages
4. Verify database migrations are applied
5. Ensure all environment variables are set

---

**Last Updated**: December 26, 2024  
**Version**: 1.0.0
