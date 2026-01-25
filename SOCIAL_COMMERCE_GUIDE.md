# Social Commerce & Group Buying Features

## Overview

This Ethiopian marketplace application now includes comprehensive social commerce features inspired by Pinduoduo, integrated with traditional Ethiopian Equb culture.

## Features

### 1. 👥 Group Buying

Team purchasing with discounts - get better prices when you shop together!

#### Key Features
- **Browse Active Groups**: View all available group purchases with real-time progress
- **Create Groups**: Start a group purchase for any product with custom discount tiers
- **Join Groups**: Participate in existing groups to unlock discounted prices
- **Timer Countdown**: See how much time is left before the group expires
- **Progress Tracking**: Visual progress bars showing member count
- **Automatic Ordering**: Orders are created automatically when groups reach the required size
- **Social Sharing**: Share group purchases via WhatsApp, Facebook, Twitter, Telegram

#### API Endpoints

**List Active Group Purchases**
```bash
GET /api/social/group-purchase/create?limit=20
```

**Get Group Purchase Details**
```bash
GET /api/social/group-purchase/{id}/join
```

**Create Group Purchase**
```bash
POST /api/social/group-purchase/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "productId": "uuid",
  "title": "iPhone 15 Group Buy",
  "description": "Join us to get 20% off!",
  "requiredMembers": 10,
  "maxMembers": 15,
  "pricePerPerson": 80000,
  "regularPrice": 100000,
  "expiresInHours": 48
}
```

**Join Group Purchase**
```bash
POST /api/social/group-purchase/{id}/join
Authorization: Bearer {token}
```

#### UI Pages
- `/group-buy` - Browse all active group purchases
- `/group-buy/{id}` - View group purchase details and join

---

### 2. 🇪🇹 Ethiopian Equb (እኩብ)

Traditional rotating savings and credit association - culturally aligned with Ethiopian financial practices.

#### What is Equb?

Equb (እኩብ) is a traditional Ethiopian rotating savings and credit association (ROSCA) where:
1. A group of people agrees on a contribution amount and schedule
2. Each member contributes the agreed amount every round
3. Each round, one member receives the entire pot
4. The cycle continues until everyone has received the pot once

#### Key Features
- **Create Circles**: Start an Equb circle with customizable settings
- **Member Limits**: Support for 2-50 members
- **Flexible Frequency**: Weekly, bi-weekly, or monthly contributions
- **Position-Based Distribution**: Fair distribution based on join order
- **Contribution Tracking**: Record and track all member contributions
- **Automatic Distribution**: System tracks who receives the pot each round
- **Round Management**: Automatic progression through rounds

#### API Endpoints

**List Active Equb Circles**
```bash
GET /api/equb/circles?limit=20&status=active
```

**Create Equb Circle**
```bash
POST /api/equb/circles
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Friends Equb 2026",
  "description": "Monthly savings circle for friends",
  "memberLimit": 10,
  "contributionAmount": 5000,
  "frequency": "monthly",
  "startDate": "2026-02-01T00:00:00Z"
}
```

**Join Equb Circle**
```bash
POST /api/equb/circles/{id}/join
Authorization: Bearer {token}
```

**Make Contribution**
```bash
POST /api/equb/circles/{id}/contribute
Content-Type: application/json
Authorization: Bearer {token}

{
  "amount": 5000,
  "round": 1  // Optional, defaults to current round
}
```

**Get Contribution History**
```bash
GET /api/equb/circles/{id}/contribute?round=1
Authorization: Bearer {token}
```

#### Database Models

**EqubCircle**
- Stores circle information (name, member limit, contribution amount, frequency)
- Tracks current round and status
- Links to creator and members

**EqubCircleMember**
- Associates users with circles
- Assigns distribution position (1-N)
- Tracks membership status

**EqubContribution**
- Records each member's contribution per round
- Tracks payment amounts and timestamps

**EqubDistribution**
- Schedules and tracks payouts to members
- One distribution per round, one member receives per round
- Follows position-based ordering

#### UI Pages
- `/equb` - Browse and create Equb circles
- `/equb/{id}` - View circle details, members, and make contributions

---

### 3. 📱 Viral Social Sharing with Rewards

Share products and earn loyalty points - the more you share, the more you earn!

#### Key Features
- **Share-to-Earn**: Earn 2-5 loyalty points per share depending on platform
- **Multi-Platform Tracking**: WhatsApp, Facebook, Twitter, Telegram, QR Code, Copy Link
- **Milestone Bonuses**: Bonus points at 10, 25, 50, 100, and 250 shares
- **Real-Time Dashboard**: View your sharing statistics and earnings
- **Platform Analytics**: See which platforms you use most
- **Recent Activity**: Track recent shares and points earned

#### Point Structure

| Platform | Points per Share |
|----------|------------------|
| WhatsApp | 5 points |
| Facebook | 5 points |
| Twitter | 5 points |
| Telegram | 5 points |
| Native Share | 5 points |
| QR Code | 3 points |
| Copy Link | 2 points |

#### Milestones

| Total Shares | Bonus Points |
|--------------|--------------|
| 10 shares | +50 points |
| 25 shares | +150 points |
| 50 shares | +100 points |
| 100 shares | +800 points |
| 250 shares | +2,500 points |

#### API Endpoints

**Track Product Share**
```bash
POST /api/products/{productId}/share
Content-Type: application/json
Authorization: Bearer {token}  # Optional - awards points if logged in

{
  "platform": "whatsapp"  // whatsapp, facebook, twitter, telegram, copy_link, qr_code, native
}

# Response includes points earned
{
  "success": true,
  "message": "Share tracked successfully! You earned 5 loyalty points.",
  "shareId": "uuid",
  "pointsEarned": 5
}
```

**Get Sharing Statistics**
```bash
GET /api/social/stats
Authorization: Bearer {token}

# Response
{
  "success": true,
  "data": {
    "totalShares": 42,
    "sharesByPlatform": {
      "whatsapp": 15,
      "facebook": 10,
      "twitter": 8,
      "telegram": 5,
      "copy_link": 3,
      "qr_code": 1
    },
    "pointsFromSharing": 215,
    "currentTier": "silver",
    "totalPoints": 1250,
    "recentShares": [...],
    "recentTransactions": [...],
    "milestones": [...],
    "nextMilestone": {
      "shares": 50,
      "reward": 350,
      "achieved": false
    }
  }
}
```

#### UI Pages
- `/dashboard/social` - Social sharing dashboard with statistics and rewards

#### Integration with ProductSocialShare Component

The existing `ProductSocialShare` component automatically tracks shares and awards points. No changes needed to use it - just ensure users are logged in to receive points.

---

## Database Schema

### New Models Added

1. **EqubCircle** - Rotating savings circles
2. **EqubCircleMember** - Circle membership
3. **EqubContribution** - Member contributions
4. **EqubDistribution** - Payout distributions

### Enhanced Models

1. **ProductShare** - Now triggers loyalty point awards
2. **LoyaltyTransaction** - New transaction types for sharing rewards

---

## Navigation

All new features are accessible via:

**Desktop Navigation**
- Group Buy icon (Users) in main navbar
- Equb, Group Buying in user menu dropdown

**Mobile Navigation**
- Group Buy button in mobile menu
- Equb button in mobile menu
- User menu has quick links

---

## Usage Examples

### Example 1: Create and Join a Group Purchase

```javascript
// 1. Create a group purchase
const response = await fetch('/api/social/group-purchase/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    productId: 'product-uuid',
    title: 'iPhone 15 Pro Group Buy',
    description: 'Save 20% when we reach 10 members!',
    requiredMembers: 10,
    pricePerPerson: 90000,
    regularPrice: 112500,
    expiresInHours: 72,
  }),
});

// 2. Share the group purchase link
const { data } = await response.json();
const shareUrl = `https://yourdomain.com/group-buy/${data.id}`;

// 3. Others join the group
await fetch(`/api/social/group-purchase/${groupId}/join`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});
```

### Example 2: Start an Equb Circle

```javascript
// 1. Create an Equb circle
const response = await fetch('/api/equb/circles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Family Equb 2026',
    description: 'Monthly savings for our family',
    memberLimit: 12,
    contributionAmount: 10000,  // 10,000 ETB per month
    frequency: 'monthly',
    startDate: '2026-02-01',
  }),
});

// 2. Members join (positions assigned automatically)
await fetch(`/api/equb/circles/${circleId}/join`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});

// 3. Make monthly contribution
await fetch(`/api/equb/circles/${circleId}/contribute`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 10000,
  }),
});
```

### Example 3: Share Products for Rewards

```javascript
// Share a product on WhatsApp
const response = await fetch(`/api/products/${productId}/share`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    platform: 'whatsapp',
  }),
});

const { pointsEarned } = await response.json();
console.log(`You earned ${pointsEarned} loyalty points!`);

// Check your sharing stats
const statsResponse = await fetch('/api/social/stats', {
  headers: { 'Authorization': `Bearer ${token}` },
});

const { data } = await statsResponse.json();
console.log(`Total shares: ${data.totalShares}`);
console.log(`Points from sharing: ${data.pointsFromSharing}`);
```

---

## Testing

### Manual Testing Checklist

**Group Buying:**
- [ ] Create a group purchase
- [ ] Browse active group purchases
- [ ] Join a group purchase
- [ ] View group purchase details
- [ ] Share a group purchase
- [ ] Wait for group to complete and verify order creation

**Equb:**
- [ ] Create an Equb circle
- [ ] Join an Equb circle
- [ ] Make a contribution
- [ ] View contribution history
- [ ] Verify position assignment
- [ ] Test round completion and distribution

**Social Sharing:**
- [ ] Share a product (logged out)
- [ ] Share a product (logged in) and verify points awarded
- [ ] Share on different platforms
- [ ] View social dashboard
- [ ] Reach a milestone and verify bonus points
- [ ] Check platform analytics

---

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication except viewing public groups
2. **Race Conditions**: Transaction-based operations prevent duplicate joins/contributions
3. **Validation**: Input validation on all endpoints
4. **Data Integrity**: Foreign key constraints maintain referential integrity
5. **User Privacy**: Personal information is not exposed in public listings

---

## Future Enhancements

1. **Group Purchase Notifications**: Email/SMS when groups fill up
2. **Equb Reminders**: Contribution reminders via email/SMS
3. **Social Leaderboards**: Top sharers leaderboard with badges
4. **Referral Bonuses**: Extra points for referrals from shares
5. **Advanced Analytics**: Conversion tracking for shared links
6. **Commission System**: Revenue sharing for successful referrals
7. **Gamification**: Achievements and badges for sharing milestones

---

## Support

For issues or questions about these features:
- Check the API documentation at `/api-docs`
- View the codebase at GitHub
- Contact support team

---

## Credits

Features inspired by:
- **Pinduoduo**: Group buying and social commerce mechanics
- **Ethiopian Equb**: Traditional rotating savings culture
- **Modern Loyalty Programs**: Point-based rewards and gamification
