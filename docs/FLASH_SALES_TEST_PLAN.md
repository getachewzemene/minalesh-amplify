/**
 * Flash Sales Feature Test Plan
 * 
 * This document outlines the manual testing procedures for the Enhanced Flash Sales feature.
 */

# Enhanced Flash Sales - Test Plan

## Features to Test

### 1. Live Countdown Timers ⏰
**Location:** Flash Sales Page, Homepage, Product Card

**Test Cases:**
- [ ] Countdown displays correctly for upcoming flash sales (Days, Hours, Minutes, Seconds)
- [ ] Countdown updates every second without refresh
- [ ] When countdown reaches zero, it shows "Sale Ended"
- [ ] Days field only shows when time remaining is >= 24 hours
- [ ] Countdown switches from "Starts In" to "Ends In" when sale begins
- [ ] Multiple countdowns on same page work independently

**Expected Behavior:**
```
Upcoming Sale: "Starts In: 2 Days 05:30:45"
Active Sale: "Ends In: 03:45:20"
Ended Sale: "Sale Ended"
```

### 2. Real-time Stock Counter 📊
**Location:** Flash Sales Card (Active Sales)

**Test Cases:**
- [ ] Stock counter displays initial stock correctly
- [ ] Stock updates automatically every 5 seconds
- [ ] Progress bar reflects current stock percentage
- [ ] Visual status changes based on stock:
  - Green: 0-69% sold (In Stock)
  - Orange: 70-89% sold (Selling Fast!)
  - Red: 90-100% sold (Almost Sold Out!)
- [ ] Shows "X / Y left" format correctly
- [ ] Displays sold count below progress bar
- [ ] Handles unlimited stock gracefully ("Unlimited Stock Available")

**Expected Behavior:**
```
In Stock: Green progress bar, "50 / 100 left", "50 items sold"
Selling Fast: Orange progress bar, "25 / 100 left", "75 items sold"
Almost Sold Out: Red progress bar, "5 / 100 left", "95 items sold"
```

### 3. Pre-registration System 🔔
**Location:** Flash Sales Card (Upcoming Sales)

**Test Cases:**
- [ ] "Notify Me" button appears for upcoming sales
- [ ] Clicking "Notify Me" requires authentication
- [ ] Unauthenticated users redirected to login
- [ ] After registration, shows "You're registered!" message
- [ ] "Unregister" button appears after successful registration
- [ ] Registration status persists across page refreshes
- [ ] Can successfully unregister
- [ ] Registration disappears when sale starts
- [ ] Cannot register for sales that have already started
- [ ] Cannot register for sales that have ended

**Expected Behavior:**
```
Before Registration: Blue info box + "Notify Me" button
After Registration: Green success box + "Unregister" button
```

## API Endpoints Testing

### Public Endpoints

#### GET /api/flash-sales
```bash
curl http://localhost:3000/api/flash-sales
```
**Expected Response:**
- Returns array of active flash sales
- Each sale includes product details
- Stock remaining calculated correctly
- Registration count included

#### GET /api/flash-sales/{id}
```bash
curl http://localhost:3000/api/flash-sales/{id}
```
**Expected Response:**
- Returns single flash sale details
- 404 if sale not found

#### GET /api/flash-sales/{id}/stock
```bash
curl http://localhost:3000/api/flash-sales/{id}/stock
```
**Expected Response:**
```json
{
  "id": "uuid",
  "isActive": true,
  "stockLimit": 100,
  "stockSold": 45,
  "stockRemaining": 55,
  "stockPercentage": 45,
  "hasStarted": true,
  "hasEnded": false
}
```

#### POST /api/flash-sales/{id}/register
```bash
curl -X POST http://localhost:3000/api/flash-sales/{id}/register \
  -H "Authorization: Bearer {token}"
```
**Expected Response:**
- 401 if not authenticated
- 400 if sale already started/ended
- Success message if registration successful
- Duplicate registration handled gracefully

#### DELETE /api/flash-sales/{id}/register
```bash
curl -X DELETE http://localhost:3000/api/flash-sales/{id}/register \
  -H "Authorization: Bearer {token}"
```
**Expected Response:**
- Success message
- Removes registration from database

### Admin Endpoints

#### POST /api/admin/flash-sales
```bash
curl -X POST http://localhost:3000/api/admin/flash-sales \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Flash Sale",
    "productId": "uuid",
    "discountType": "percentage",
    "discountValue": 25,
    "originalPrice": 1000,
    "flashPrice": 750,
    "stockLimit": 50,
    "startsAt": "2024-12-25T10:00:00Z",
    "endsAt": "2024-12-25T22:00:00Z"
  }'
```

#### GET /api/admin/flash-sales
```bash
curl http://localhost:3000/api/admin/flash-sales?isActive=true \
  -H "Authorization: Bearer {admin-token}"
```

## UI/UX Testing

### Responsive Design
**Test Cases:**
- [ ] Flash sales page renders correctly on mobile (320px - 767px)
- [ ] Countdown timers stack vertically on small screens
- [ ] Cards display in grid: 1 col mobile, 2 tablet, 3-4 desktop
- [ ] All buttons are touch-friendly (min 44px tap target)
- [ ] Images scale properly across devices

### Performance
**Test Cases:**
- [ ] Page loads in < 3 seconds on 3G
- [ ] Stock counter updates don't cause UI flicker
- [ ] Multiple countdown timers don't lag the page
- [ ] Images use Next.js Image optimization
- [ ] No console errors or warnings

### Accessibility
**Test Cases:**
- [ ] All images have alt text
- [ ] Buttons have descriptive labels
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works properly
- [ ] Screen reader friendly

## Integration Testing

### Homepage Integration
**Test Cases:**
- [ ] Flash sales section appears on homepage
- [ ] Shows maximum 4 flash sales
- [ ] "View All" button links to /flash-sales
- [ ] Section hidden if no active sales

### Navigation
**Test Cases:**
- [ ] Can navigate to /flash-sales from homepage
- [ ] Can navigate to product page from flash sale card
- [ ] Back button works correctly
- [ ] Flash sales accessible from main navigation (if added)

## Edge Cases

**Test Cases:**
- [ ] Flash sale with no stock limit (unlimited)
- [ ] Flash sale that starts immediately
- [ ] Flash sale ending in < 1 minute
- [ ] Multiple flash sales for same product
- [ ] Flash sale with 0 stock remaining
- [ ] User registered for multiple flash sales
- [ ] Sale deleted while user is viewing
- [ ] Network error during stock update
- [ ] Server error during registration

## Database Testing

**Verify Schema:**
- [ ] FlashSale table has all required fields
- [ ] FlashSaleRegistration has unique constraint
- [ ] LiveStockCounter properly indexed
- [ ] Foreign key relationships work
- [ ] Cascade deletes configured correctly

## Security Testing

**Test Cases:**
- [ ] Non-admin cannot create flash sales
- [ ] Cannot register for someone else
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] CSRF protection in place
- [ ] Rate limiting on API endpoints

## Success Metrics

**Measure:**
- [ ] Average time to register: < 2 seconds
- [ ] Stock update latency: < 1 second
- [ ] Countdown accuracy: ±1 second
- [ ] Mobile conversion rate
- [ ] Registration to purchase rate

## Known Limitations

1. Stock updates are every 5 seconds (not real-time WebSocket)
2. Notification system requires separate background worker
3. No conflict resolution for simultaneous purchases
4. Limited to one flash sale per product at a time (by design)

## Test Environment

**Requirements:**
- Node.js 18+
- PostgreSQL with flash sales schema
- Test user accounts (customer, admin)
- Sample products in database
- Test flash sales in various states (upcoming, active, ended)

## Manual Test Checklist

### Setup
- [ ] Create test admin account
- [ ] Create test customer account
- [ ] Add test products to database
- [ ] Create upcoming flash sale
- [ ] Create active flash sale
- [ ] Create ended flash sale

### Execute Tests
- [ ] Test all countdown timer scenarios
- [ ] Test all stock counter scenarios
- [ ] Test pre-registration flow
- [ ] Test all API endpoints
- [ ] Test responsive design
- [ ] Test accessibility

### Cleanup
- [ ] Remove test flash sales
- [ ] Remove test registrations
- [ ] Document any bugs found

## Bug Reporting Template

```
**Title:** [Component] Brief description
**Priority:** Critical | High | Medium | Low
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Screenshots/Videos:**

**Environment:**
- Browser:
- Device:
- Screen Size:
```

## Notes

- All times in database are UTC
- Frontend converts to user's local timezone
- Stock updates are eventually consistent
- Registration notifications sent via background worker
