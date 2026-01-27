# Gamification System - Manual Testing Guide

This guide provides step-by-step instructions for manually testing the gamification system APIs.

## Prerequisites

1. Start the development server:
```bash
npm run dev
```

2. Ensure you have a user account and auth token (cookie)
   - Register at: http://localhost:3000/register
   - Login at: http://localhost:3000/login
   - Copy the `auth_token` from browser cookies (DevTools > Application > Cookies)

3. Set environment variable for easier testing:
```bash
export AUTH_TOKEN="your_auth_token_here"
```

## Test Scenarios

### 1. Daily Check-in API

#### Test 1.1: Get Check-in Status (First Time User)
```bash
curl -X GET http://localhost:3000/api/gamification/check-in \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "checkedInToday": false,
  "currentStreak": 0,
  "lastCheckIn": null,
  "nextReward": 10,
  "totalCheckIns": 0
}
```

#### Test 1.2: Perform First Check-in
```bash
curl -X POST http://localhost:3000/api/gamification/check-in \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "streakCount": 1,
  "reward": 10,
  "bonusReward": 0,
  "totalReward": 10,
  "message": "Check-in successful! +10 points"
}
```

#### Test 1.3: Attempt Duplicate Check-in (Same Day)
```bash
curl -X POST http://localhost:3000/api/gamification/check-in \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "error": "Already checked in today"
}
```
**Expected Status:** 400

#### Test 1.4: Verify Check-in Status
```bash
curl -X GET http://localhost:3000/api/gamification/check-in \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "checkedInToday": true,
  "currentStreak": 1,
  "lastCheckIn": "2024-01-15",
  "nextReward": 10,
  "totalCheckIns": 1
}
```

### 2. Achievements API

#### Test 2.1: Get All Achievements
```bash
curl -X GET http://localhost:3000/api/gamification/achievements \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "available": [
    {
      "key": "first_purchase",
      "name": "First Purchase",
      "description": "Complete your first order",
      "points": 50,
      "iconUrl": "🛍️"
    },
    ...
  ],
  "earned": [],
  "totalPoints": 0
}
```

#### Test 2.2: Get User's Earned Achievements Only
```bash
curl -X GET "http://localhost:3000/api/gamification/achievements?userOnly=true" \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "earned": [],
  "totalPoints": 0
}
```

#### Test 2.3: Award Achievement (Admin Only)
```bash
# Note: This requires admin role
curl -X POST http://localhost:3000/api/gamification/achievements \
  -H "Cookie: auth_token=$ADMIN_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "achievementKey": "first_purchase"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "achievement": {
    "id": "...",
    "userId": "...",
    "achievementKey": "first_purchase",
    "achievementName": "First Purchase",
    "description": "Complete your first order",
    "iconUrl": "🛍️",
    "points": 50,
    "earnedAt": "...",
    "rewardClaimed": false
  },
  "message": "Achievement \"First Purchase\" unlocked! +50 points"
}
```

### 3. Rewards API

#### Test 3.1: Get Available Rewards
```bash
curl -X GET http://localhost:3000/api/gamification/rewards \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "rewards": [
    {
      "key": "discount_5",
      "name": "5% Discount Coupon",
      "description": "Get 5% off your next purchase",
      "pointsCost": 100,
      "rewardType": "discount",
      "rewardValue": 5,
      "iconUrl": "🎫",
      "canAfford": false
    },
    ...
  ],
  "userPoints": 10
}
```

#### Test 3.2: Attempt to Redeem Reward (Insufficient Points)
```bash
curl -X POST http://localhost:3000/api/gamification/rewards \
  -H "Cookie: auth_token=$AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rewardKey": "discount_10"}'
```

**Expected Response:**
```json
{
  "error": "Insufficient points"
}
```
**Expected Status:** 400

#### Test 3.3: Redeem Reward (After Earning Points)
```bash
# First, earn enough points through check-ins or games
# Then redeem:
curl -X POST http://localhost:3000/api/gamification/rewards \
  -H "Cookie: auth_token=$AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rewardKey": "discount_5"}'
```

**Expected Response:**
```json
{
  "success": true,
  "couponCode": "REWARD-DISCOUNT_5-1705315200000",
  "message": "Reward redeemed successfully! You've received: 5% Discount Coupon. Your coupon code is: REWARD-DISCOUNT_5-1705315200000",
  "remainingPoints": 50
}
```

### 4. Games API

#### Test 4.1: Get Available Games
```bash
curl -X GET http://localhost:3000/api/gamification/games \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "games": [
    {
      "key": "spin_wheel",
      "name": "Spin the Wheel",
      "description": "Spin the wheel for a chance to win points or discounts",
      "iconUrl": "🎡",
      "maxPlaysPerDay": 3,
      "playsToday": 0,
      "maxPlays": 3,
      "canPlay": true
    },
    ...
  ],
  "playStats": {
    "spin_wheel": {
      "playsToday": 0,
      "maxPlays": 3,
      "canPlay": true
    },
    ...
  }
}
```

#### Test 4.2: Play Spin the Wheel
```bash
curl -X POST http://localhost:3000/api/gamification/games \
  -H "Cookie: auth_token=$AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameType": "spin_wheel",
    "score": 0
  }'
```

**Expected Response (Points Reward):**
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

**OR (Discount Reward):**
```json
{
  "success": true,
  "reward": {
    "label": "10% Discount",
    "type": "discount",
    "value": 10,
    "probability": 0.05
  },
  "couponCode": "GAME-SPIN_WHEEL-1705315200000",
  "message": "Congratulations! You won: 10% Discount. Your coupon code is: GAME-SPIN_WHEEL-1705315200000",
  "playsRemaining": 2
}
```

#### Test 4.3: Play Scratch Card
```bash
curl -X POST http://localhost:3000/api/gamification/games \
  -H "Cookie: auth_token=$AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameType": "scratch_card",
    "score": 0
  }'
```

**Expected Response:** Similar to spin wheel with different rewards

#### Test 4.4: Exceed Daily Play Limit
```bash
# Play spin wheel 3 times, then try a 4th time:
curl -X POST http://localhost:3000/api/gamification/games \
  -H "Cookie: auth_token=$AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameType": "spin_wheel",
    "score": 0
  }'
```

**Expected Response (after 3 plays):**
```json
{
  "error": "Daily play limit reached for Spin the Wheel"
}
```
**Expected Status:** 400

### 5. Leaderboard API

#### Test 5.1: Get Points Leaderboard
```bash
curl -X GET "http://localhost:3000/api/gamification/leaderboard?type=points&limit=10" \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "...",
      "displayName": "John Doe",
      "avatarUrl": null,
      "points": 150,
      "tier": "bronze"
    },
    ...
  ],
  "currentUser": {
    "rank": 5,
    "points": 60,
    "tier": "bronze"
  },
  "type": "points"
}
```

#### Test 5.2: Get Achievements Leaderboard
```bash
curl -X GET "http://localhost:3000/api/gamification/leaderboard?type=achievements&limit=10" \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "...",
      "displayName": "Jane Smith",
      "avatarUrl": null,
      "achievementCount": 5,
      "achievementPoints": 500
    },
    ...
  ],
  "currentUser": null,
  "type": "achievements"
}
```

#### Test 5.3: Get Streaks Leaderboard
```bash
curl -X GET "http://localhost:3000/api/gamification/leaderboard?type=streaks&limit=10" \
  -H "Cookie: auth_token=$AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "...",
      "displayName": "Alice Johnson",
      "avatarUrl": null,
      "streak": 30,
      "lastCheckIn": "2024-01-15"
    },
    ...
  ],
  "currentUser": {
    "rank": 8,
    "streak": 5,
    "lastCheckIn": "2024-01-15"
  },
  "type": "streaks"
}
```

## Integration Testing

### Scenario: Complete User Journey

1. **New User Registration**
   - Register account
   - Get auth token

2. **Daily Check-in**
   - Check status (should be 0 streak)
   - Perform check-in (earn 10 points)
   - Verify check-in status

3. **Play Games**
   - Get available games
   - Play spin wheel (earn 50 points)
   - Play scratch card (earn 20 points)
   - Total: 80 points

4. **View Progress**
   - Check leaderboard position
   - View available achievements

5. **Redeem Reward**
   - View available rewards
   - Redeem 5% discount (costs 100 points - need to earn 20 more)
   - Play more games or check in more days
   - Redeem successfully
   - Use coupon code at checkout

## Troubleshooting

### Issue: Unauthorized (401)
**Solution:** Ensure you have a valid auth_token cookie. Re-login if necessary.

### Issue: Insufficient Points
**Solution:** Earn more points through:
- Daily check-ins (10+ points/day)
- Playing games (10-100 points per game)
- Earning achievements (50-500 points)

### Issue: Daily Limit Reached
**Solution:** Wait until the next day (UTC midnight) to play again.

### Issue: Database Connection Error
**Solution:** 
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run `npx prisma migrate dev`

## Automated Testing

To run the existing test suite:
```bash
npm test
```

## Verification Checklist

- [ ] Daily check-in works and awards points
- [ ] Streak calculation is accurate
- [ ] Achievements can be viewed
- [ ] Rewards can be redeemed
- [ ] Games respect daily limits
- [ ] Games award random rewards
- [ ] Leaderboards show correct rankings
- [ ] Points integrate with loyalty system
- [ ] Coupon codes are generated correctly
- [ ] All endpoints require authentication
- [ ] Admin-only endpoints reject non-admin users

## Next Steps

After manual testing:
1. Fix any bugs discovered
2. Run code review tool
3. Run security scanner (CodeQL)
4. Update documentation if needed
5. Request peer review
