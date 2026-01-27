# Gamification UI - Quick Start Guide

## Accessing the Gamification Dashboard

**URL:** `/dashboard/gamification`

### Local Development
```
http://localhost:3000/dashboard/gamification
```

### Production
```
https://yourdomain.com/dashboard/gamification
```

## UI Overview

The gamification dashboard features a comprehensive interface with 5 main tabs:

### 1. Overview Tab (Default)

**Quick Stats Cards** (Top Row):
- 🔥 Current Streak - Shows your consecutive check-in days
- 💰 Available Points - Your total redeemable points
- 🏆 Achievements - Progress on unlocking badges
- 📈 Leaderboard Rank - Your position among all users

**Daily Check-in Section:**
- Large "Check In Now" button (disabled if already checked in today)
- Current streak display with flame icon
- Next reward amount preview
- Streak milestones (7-day, 30-day bonuses) with visual indicators

**Quick Play Section:**
- 3 featured games for quick access
- Play counter (X/Y plays remaining)
- Instant play buttons

### 2. Achievements Tab

**Unlocked Section:**
- Gold/yellow gradient cards for earned achievements
- Achievement icon (emoji)
- Name, description, and points
- Date earned timestamp
- Visual badge with points

**Locked Section:**
- Grayscale cards for achievements to unlock
- Same structure but muted appearance
- Shows what you can earn next

### 3. Rewards Tab

**Header:**
- Available points displayed prominently
- Visual emphasis on your spending power

**Reward Catalog:**
- Grid layout of 7 rewards
- Large emoji icons
- Reward name and description
- Points cost badge
- Reward type badge (discount, free shipping, etc.)
- "Redeem" button (disabled if insufficient points)
- Visual indicator for affordable rewards (green border)

**Reward Types:**
- 🎫 5% Discount Coupon (100 pts)
- 🎟️ 10% Discount Coupon (200 pts)
- 🎁 15% Discount Coupon (300 pts)
- 📦 Free Shipping (150 pts)
- 💵 50 ETB Cash Back (500 pts)
- 💰 100 ETB Cash Back (1000 pts)
- 🎰 Spin Wheel Token (50 pts)

### 4. Games Tab

**Game Cards:**
- Large emoji icon
- Game name and description
- Progress bar showing plays used
- "Plays Today" counter (X/Y)
- "Play Now" button (disabled when limit reached)
- Visual feedback for available vs. maxed games

**Available Games:**
- 🎡 Spin the Wheel (3 plays/day)
- 🎴 Scratch Card (2 plays/day)
- ❓ Product Quiz (5 plays/day)
- 📋 Customer Survey (1 play/day)
- 🎮 Mini Game (5 plays/day)

### 5. Leaderboard Tab

**Sub-tabs:**
- Points Leaderboard
- Achievements Leaderboard
- Streaks Leaderboard

**Your Rank Card:**
- Highlighted in blue/purple gradient
- Shows your position and stats
- Always visible at top

**Top Users List:**
- Numbered circles (1-10)
- Medal colors for top 3 (🥇 gold, 🥈 silver, 🥉 bronze)
- User display name
- Relevant stat (points, achievements, or streak)
- Tier badge (for points leaderboard)

## User Interactions

### Daily Check-in
1. Click "Check In Now" button
2. Toast notification shows points earned
3. Button changes to "Checked In" (disabled)
4. Stats update automatically

### Playing Games
1. Navigate to Games tab
2. Click "Play Now" on any available game
3. Toast shows reward won (points or coupon)
4. Play counter updates
5. Points balance refreshes

### Redeeming Rewards
1. Navigate to Rewards tab
2. Check available points at top
3. Click "Redeem" on an affordable reward
4. Toast shows success and coupon code (if applicable)
5. Points balance updates

### Viewing Leaderboards
1. Navigate to Leaderboard tab
2. Click sub-tab (Points, Achievements, Streaks)
3. Your rank shown at top in highlighted card
4. Scroll to see top 10 users

## Visual Feedback

### Success States
- ✅ Green badges for completed actions
- 🎉 Success toast notifications
- Updated stats in real-time

### Error States
- ❌ Disabled buttons when action not allowed
- ⚠️ Error toast notifications
- Visual cues (opacity, border colors)

### Loading States
- Skeleton loaders during initial load
- Smooth transitions between states

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Stacked cards
- Full-width buttons
- Tab navigation at bottom

### Tablet (768px - 1024px)
- 2-column grid for cards
- Optimized spacing

### Desktop (> 1024px)
- 3-4 column grid layouts
- Maximum content width
- Side-by-side displays

## Color Coding

- **Gold/Yellow** - Points, rewards, achievements
- **Orange/Red** - Streaks, urgency
- **Green** - Available actions, success
- **Purple** - Premium features, platinum tier
- **Blue** - Information, navigation
- **Gray** - Disabled, locked, unavailable

## Toast Notifications

All user actions provide instant feedback:
- "Check-in successful! +10 points"
- "Congratulations! You won: 50 Points"
- "Reward redeemed successfully! Your coupon code is: XXX"
- "Daily play limit reached for Spin the Wheel"
- "Insufficient points"

## Navigation

The gamification dashboard is part of the main dashboard:
- Access from: Dashboard → Gamification
- Direct URL: `/dashboard/gamification`

## Tips for Users

1. **Check in daily** to build streaks (7-day and 30-day bonuses)
2. **Play all games daily** to maximize point earnings
3. **Save points** for higher-value rewards
4. **Track your rank** on the leaderboard for motivation
5. **Complete achievements** for bonus points

## Development Notes

### Testing Locally
1. Start dev server: `npm run dev`
2. Login to your account
3. Navigate to: http://localhost:3000/dashboard/gamification
4. Ensure you have cookies enabled for authentication

### Required Components
All UI components are from `@/components/ui`:
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Badge, Button, Progress, Skeleton
- Tabs, TabsContent, TabsList, TabsTrigger

### Dependencies
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `sonner` - Toast notifications

## Troubleshooting

**Issue:** "Unauthorized" or blank page
**Solution:** Ensure you're logged in with valid auth cookie

**Issue:** Stats not updating
**Solution:** Refresh the page or check browser console for errors

**Issue:** Can't redeem reward
**Solution:** Verify you have enough points (shown at top of Rewards tab)

**Issue:** Can't play game
**Solution:** Check if daily limit reached (shows in game card)

## Next Steps

After launching:
1. Monitor user engagement metrics
2. Adjust reward costs based on user behavior
3. Add new achievements seasonally
4. Introduce special event games
5. Expand leaderboard features

---

**Access Now:** http://localhost:3000/dashboard/gamification
