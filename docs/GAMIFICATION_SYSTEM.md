# Gamification System Documentation

## Overview

The Minalesh marketplace now includes a comprehensive gamification system inspired by JD.com, featuring daily check-ins, achievement badges, points & rewards, and interactive games. This system is designed to increase user engagement and loyalty.

## Features

### 1. 🎯 Daily Check-ins

Users can check in daily to earn loyalty points and build streaks.

**API Endpoints:**
- `GET /api/gamification/check-in` - Get check-in status and current streak
- `POST /api/gamification/check-in` - Perform daily check-in

**Rewards:**
- Base reward: 10 points per check-in
- Streak bonus: +2 points for every 2 consecutive days
- 7-day streak bonus: +50 points
- 30-day streak bonus: +200 points

**Example Request:**
```bash
# Get check-in status
curl -X GET https://yourdomain.com/api/gamification/check-in \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Perform check-in
curl -X POST https://yourdomain.com/api/gamification/check-in \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "streakCount": 5,
  "reward": 10,
  "bonusReward": 4,
  "totalReward": 14,
  "message": "Check-in successful! +14 points (5-day streak)"
}
```

### 2. 🏆 Achievement Badges

Users can earn achievement badges for completing various milestones.

**API Endpoints:**
- `GET /api/gamification/achievements` - Get all achievements (available and earned)
- `GET /api/gamification/achievements?userOnly=true` - Get only user's earned achievements
- `POST /api/gamification/achievements` - Award achievement (admin only)

**Available Achievements:**

| Achievement | Description | Points |
|------------|-------------|--------|
| 🛍️ First Purchase | Complete your first order | 50 |
| ⭐ Power Reviewer | Write 10 product reviews | 100 |
| 🏆 Loyal Customer | Make 25 purchases | 200 |
| 💰 Big Spender | Spend 10,000 ETB in total | 300 |
| 🦋 Social Butterfly | Share 20 products on social media | 75 |
| ⏰ Early Bird | Purchase during a flash sale | 50 |
| 🔥 Check-in Warrior | Maintain a 30-day check-in streak | 250 |
| 🎁 Referral Champion | Refer 10 friends who make a purchase | 500 |
| ❤️ Wishlist Master | Add 50 items to your wishlist | 50 |
| 🎫 Bargain Hunter | Use 20 coupon codes | 150 |

**Example Request:**
```bash
# Get all achievements
curl -X GET https://yourdomain.com/api/gamification/achievements \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Award achievement (admin only)
curl -X POST https://yourdomain.com/api/gamification/achievements \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "achievementKey": "first_purchase"
  }'
```

**Example Response:**
```json
{
  "available": [
    {
      "key": "power_reviewer",
      "name": "Power Reviewer",
      "description": "Write 10 product reviews",
      "points": 100,
      "iconUrl": "⭐"
    }
  ],
  "earned": [
    {
      "id": "achievement-uuid",
      "userId": "user-uuid",
      "achievementKey": "first_purchase",
      "achievementName": "First Purchase",
      "description": "Complete your first order",
      "iconUrl": "🛍️",
      "points": 50,
      "earnedAt": "2024-01-15T10:30:00Z",
      "rewardClaimed": false
    }
  ],
  "totalPoints": 50
}
```

### 3. 🎁 Points & Rewards

Users can redeem loyalty points for various rewards including discounts and cash back.

**API Endpoints:**
- `GET /api/gamification/rewards` - Get available rewards
- `POST /api/gamification/rewards` - Redeem a reward

**Available Rewards:**

| Reward | Cost | Type |
|--------|------|------|
| 🎫 5% Discount Coupon | 100 points | Discount |
| 🎟️ 10% Discount Coupon | 200 points | Discount |
| 🎁 15% Discount Coupon | 300 points | Discount |
| 📦 Free Shipping | 150 points | Free Shipping |
| 💵 50 ETB Cash Back | 500 points | Cash Back |
| 💰 100 ETB Cash Back | 1000 points | Cash Back |
| 🎰 Spin Wheel Token | 50 points | Game Token |

**Example Request:**
```bash
# Get available rewards
curl -X GET https://yourdomain.com/api/gamification/rewards \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Redeem reward
curl -X POST https://yourdomain.com/api/gamification/rewards \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rewardKey": "discount_10"}'
```

**Example Response:**
```json
{
  "success": true,
  "couponCode": "REWARD-DISCOUNT_10-1705315200000",
  "message": "Reward redeemed successfully! You've received: 10% Discount Coupon. Your coupon code is: REWARD-DISCOUNT_10-1705315200000",
  "remainingPoints": 300
}
```

### 4. 🎮 Game Mechanics

Users can play various games to earn points and rewards with daily limits.

**API Endpoints:**
- `GET /api/gamification/games` - Get available games and play statistics
- `POST /api/gamification/games` - Play a game

**Available Games:**

| Game | Description | Max Plays/Day |
|------|-------------|---------------|
| 🎡 Spin the Wheel | Spin for points or discounts | 3 |
| 🎴 Scratch Card | Reveal hidden rewards | 2 |
| ❓ Product Quiz | Answer product questions | 5 |
| 📋 Customer Survey | Complete surveys | 1 |
| 🎮 Mini Game | Play fun mini-games | 5 |

**Game Rewards:**

Each game has different reward probabilities:

**Spin the Wheel:**
- 10 Points (30%)
- 25 Points (20%)
- 50 Points (15%)
- 100 Points (10%)
- 5% Discount (15%)
- 10% Discount (5%)
- Free Shipping (5%)

**Example Request:**
```bash
# Get games
curl -X GET https://yourdomain.com/api/gamification/games \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Play a game
curl -X POST https://yourdomain.com/api/gamification/games \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameType": "spin_wheel",
    "score": 0,
    "metadata": {}
  }'
```

**Example Response:**
```json
{
  "success": true,
  "reward": {
    "label": "50 Points",
    "type": "points",
    "value": 50,
    "probability": 0.15
  },
  "couponCode": null,
  "message": "Congratulations! You won: 50 Points",
  "playsRemaining": 2
}
```

### 5. 📊 Leaderboard

View top users by points, achievements, or check-in streaks.

**API Endpoints:**
- `GET /api/gamification/leaderboard?type=points` - Points leaderboard
- `GET /api/gamification/leaderboard?type=achievements` - Achievements leaderboard
- `GET /api/gamification/leaderboard?type=streaks` - Check-in streaks leaderboard

**Query Parameters:**
- `type` - Leaderboard type: `points`, `achievements`, or `streaks` (default: `points`)
- `limit` - Number of top users (default: 100, max: 1000)

**Example Request:**
```bash
# Get points leaderboard
curl -X GET https://yourdomain.com/api/gamification/leaderboard?type=points&limit=10 \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

**Example Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user-uuid",
      "displayName": "John Doe",
      "avatarUrl": "https://...",
      "points": 15000,
      "tier": "platinum"
    }
  ],
  "currentUser": {
    "rank": 42,
    "points": 2500,
    "tier": "silver"
  },
  "type": "points"
}
```

## Integration with Loyalty System

The gamification system is fully integrated with the existing loyalty program:

- All points earned through gamification are added to the user's loyalty account
- Users progress through loyalty tiers (Bronze → Silver → Gold → Platinum)
- Tier thresholds:
  - Bronze: 0 points
  - Silver: 1,000 lifetime points
  - Gold: 5,000 lifetime points
  - Platinum: 15,000 lifetime points

## Database Schema

The gamification system uses the following Prisma models:

### DailyCheckIn
```prisma
model DailyCheckIn {
  id          String   @id @default(uuid())
  userId      String   @db.Uuid
  checkInDate DateTime @db.Date
  streakCount Int      @default(1)
  reward      Int
  bonusReward Int      @default(0)
  createdAt   DateTime @default(now())
}
```

### UserAchievement
```prisma
model UserAchievement {
  id              String    @id @default(uuid())
  userId          String    @db.Uuid
  achievementKey  String
  achievementName String
  description     String
  iconUrl         String?
  points          Int       @default(0)
  earnedAt        DateTime  @default(now())
  rewardClaimed   Boolean   @default(false)
  claimedAt       DateTime?
}
```

### GameScore
```prisma
model GameScore {
  id         String   @id @default(uuid())
  userId     String   @db.Uuid
  gameType   GameType
  score      Int      @default(0)
  reward     Int
  rewardType String
  metadata   Json?
  playedAt   DateTime @default(now())
}
```

## Security & Authentication

All gamification endpoints require authentication via JWT token in cookies (`auth_token`).

**Authorization:**
- Most endpoints are accessible by authenticated users
- Achievement awarding (`POST /api/gamification/achievements`) is restricted to admins only

## Best Practices

1. **Daily Limits:** Games have daily play limits to prevent abuse
2. **Streak Calculation:** Check-in streaks reset if a user misses a day
3. **Reward Probabilities:** Game rewards use probability-based selection
4. **Coupon Expiry:** Reward coupons expire after 14-30 days
5. **Point Transactions:** All point awards are logged in `LoyaltyTransaction` table

## Future Enhancements

Potential future additions to the gamification system:

- **Seasonal Events:** Special events with limited-time achievements
- **Team Challenges:** Collaborative challenges for groups of users
- **Power-ups:** Temporary boosts for games or shopping
- **Badges Display:** Visual badge collection on user profiles
- **Social Sharing:** Share achievements on social media
- **Notification System:** Push notifications for new achievements

## Testing

To test the gamification endpoints locally:

```bash
# Start the development server
npm run dev

# Make API calls using curl or Postman
# Ensure you have a valid auth_token cookie
```

## Support

For issues or questions about the gamification system, please refer to:
- API Documentation: `/api-docs`
- Main README: `/README.md`
- Loyalty Program Documentation: `/docs/LOYALTY_PROGRAM.md`
