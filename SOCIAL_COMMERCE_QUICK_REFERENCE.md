# Social Commerce Quick Reference

## 🚀 Quick Links

- **Group Buying**: `/group-buy`
- **Ethiopian Equb**: `/equb`
- **Social Dashboard**: `/dashboard/social`

## 📊 API Endpoints

### Group Buying
```
GET  /api/social/group-purchase/create          List groups
POST /api/social/group-purchase/create          Create group
GET  /api/social/group-purchase/{id}/join       Group details
POST /api/social/group-purchase/{id}/join       Join group
```

### Ethiopian Equb
```
GET  /api/equb/circles                          List circles
POST /api/equb/circles                          Create circle
GET  /api/equb/circles/{id}/join                Circle details
POST /api/equb/circles/{id}/join                Join circle
POST /api/equb/circles/{id}/contribute          Make contribution
GET  /api/equb/circles/{id}/contribute          Contribution history
```

### Social Sharing
```
POST /api/products/{id}/share                   Track share (earn points)
GET  /api/products/{id}/share                   Share statistics
GET  /api/social/stats                          User sharing stats
```

## 💰 Loyalty Points

### Points per Share
| Platform | Points |
|----------|--------|
| WhatsApp/Facebook/Twitter/Telegram | 5 |
| QR Code | 3 |
| Copy Link | 2 |

### Milestone Bonuses
- 10 shares: +50 pts
- 25 shares: +150 pts
- 50 shares: +350 pts
- 100 shares: +800 pts
- 250 shares: +2,500 pts

## 🎯 Key Features

### Group Buying
✅ Team discounts
✅ Countdown timers
✅ Auto order creation
✅ Social sharing

### Equb (እኩብ)
✅ Rotating savings
✅ Fair distribution
✅ Contribution tracking
✅ Weekly/monthly cycles

### Share-to-Earn
✅ Multi-platform tracking
✅ Automatic point awards
✅ Milestone bonuses
✅ Analytics dashboard

## 📱 User Flow

### Join a Group Buy
1. Browse `/group-buy`
2. Click group → Join
3. Wait for group to fill
4. Order auto-created

### Start an Equb
1. Go to `/equb`
2. Click "Create Circle"
3. Set amount & frequency
4. Invite members
5. Track contributions

### Earn Points by Sharing
1. View any product
2. Click share button
3. Choose platform
4. Earn 2-5 points
5. Track at `/dashboard/social`

## 🔧 Technical Notes

### Database Models
- `GroupPurchase` + `GroupPurchaseMember`
- `EqubCircle` + `EqubCircleMember` + `EqubContribution` + `EqubDistribution`
- `ProductShare` (enhanced with loyalty rewards)
- `LoyaltyTransaction` (new type: `product_share`)

### Security
- JWT authentication required
- Transaction-based operations
- Race condition prevention
- Input validation

## 📚 Documentation
- Full guide: `SOCIAL_COMMERCE_GUIDE.md`
- API docs: `/api-docs`
- README: `README.md`
