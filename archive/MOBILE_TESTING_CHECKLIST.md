# Mobile Responsiveness Testing Checklist

Use this checklist to verify mobile responsiveness for Ethiopian users.

## Test Devices

### Small Phones (< 375px)
- [ ] iPhone SE (375x667)
- [ ] Samsung Galaxy S8 (360x740)

### Standard Phones (375-414px)
- [ ] iPhone 12/13/14 (390x844)
- [ ] iPhone 12 Pro Max (428x926)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] Google Pixel 5 (393x851)

### Tablets (768-1024px)
- [ ] iPad (768x1024)
- [ ] iPad Pro (1024x1366)
- [ ] Samsung Galaxy Tab (800x1280)

## Browser Testing

### iOS
- [ ] Safari (latest)
- [ ] Chrome
- [ ] Firefox

### Android
- [ ] Chrome (latest)
- [ ] Samsung Internet
- [ ] Firefox

## Core Features to Test

### Navigation
- [ ] Top navbar displays correctly
- [ ] Mobile menu toggle works
- [ ] Bottom navigation appears on mobile only
- [ ] Bottom nav items are touch-friendly (44px+)
- [ ] Badge counters visible on cart/wishlist
- [ ] Active state highlighting works
- [ ] Navigation doesn't overlap content

### Homepage
- [ ] Hero section scales properly
- [ ] Product grid: 1 column on mobile, 2 on tablet, 4 on desktop
- [ ] Images load and display correctly
- [ ] Text is readable (minimum 14px)
- [ ] Buttons are touch-friendly
- [ ] No horizontal scrolling

### Product Listing
- [ ] Filter controls work on mobile
- [ ] Sort dropdown is accessible
- [ ] Product cards display properly
- [ ] Grid layout responsive (1/2/4 columns)
- [ ] Images optimized for mobile
- [ ] Price and ratings visible
- [ ] Add to cart button accessible

### Product Details
- [ ] Image gallery works on touch
- [ ] Zoom functionality works
- [ ] Product info readable
- [ ] Add to cart button prominent
- [ ] Reviews section scrollable
- [ ] Related products display correctly

### Cart & Checkout
- [ ] Cart items display as cards on mobile
- [ ] Quantity controls touch-friendly
- [ ] Remove button accessible
- [ ] Total price visible
- [ ] Checkout button prominent (sticky?)
- [ ] Form fields have adequate spacing
- [ ] Keyboard doesn't obscure inputs
- [ ] Payment fields responsive

### User Dashboard
- [ ] Stats cards stack on mobile
- [ ] Charts scale to screen width
- [ ] Tables convert to mobile cards OR scroll horizontally
- [ ] Action buttons accessible
- [ ] No overlapping elements

### Search
- [ ] Search bar accessible
- [ ] Autocomplete works on mobile
- [ ] Results display properly
- [ ] Filters work in mobile view
- [ ] Clear search easily accessible

### Admin Pages
- [ ] Admin tables scroll horizontally OR use card layout
- [ ] Forms are mobile-friendly
- [ ] Action buttons accessible
- [ ] Data entry fields have proper spacing
- [ ] Dropdowns work correctly

## Accessibility

### Touch Targets
- [ ] All interactive elements minimum 44x44px
- [ ] Adequate spacing between tap targets (8px+)
- [ ] No accidental taps on adjacent elements

### Typography
- [ ] Body text minimum 14px (16px preferred)
- [ ] Headings scale appropriately
- [ ] Line height adequate for readability (1.5+)
- [ ] Text contrast meets WCAG AA (4.5:1)

### Forms
- [ ] Input fields minimum 44px height
- [ ] Labels clearly associated with inputs
- [ ] Error messages visible and clear
- [ ] Success states indicated
- [ ] Form validation works properly

### Images
- [ ] All images have alt text
- [ ] Images load progressively
- [ ] Blur placeholders display while loading
- [ ] Images don't exceed viewport width
- [ ] Lazy loading works correctly

## Performance

### Loading Speed
- [ ] Initial page load < 3 seconds on 3G
- [ ] Images optimized (WebP/AVIF)
- [ ] Code splitting implemented
- [ ] Critical CSS inlined
- [ ] Fonts optimized

### Network
- [ ] Works on slow 3G connection
- [ ] Handles offline gracefully
- [ ] Loading states clear
- [ ] Error states informative
- [ ] Retry mechanisms work

### Rendering
- [ ] No layout shifts (CLS)
- [ ] Smooth scrolling
- [ ] Animations perform well (60fps)
- [ ] No janky interactions
- [ ] Touch gestures responsive

## PWA Features

### Installation
- [ ] Install prompt appears
- [ ] Add to home screen works (Android)
- [ ] Add to home screen works (iOS)
- [ ] App icon displays correctly
- [ ] Splash screen shows

### Standalone Mode
- [ ] App opens in standalone mode
- [ ] No browser UI visible
- [ ] Status bar styled correctly
- [ ] Safe areas respected (notches)

### Manifest
- [ ] Manifest.json loads correctly
- [ ] Theme color applied
- [ ] App name correct
- [ ] Icons all sizes present
- [ ] Start URL correct
- [ ] Orientation locked to portrait

## Landscape Mode

### Small Phones
- [ ] Navigation accessible
- [ ] Content doesn't overflow
- [ ] Keyboard doesn't obscure inputs

### Tablets
- [ ] Desktop layout used (if appropriate)
- [ ] Two-column layouts work
- [ ] Navigation optimal for landscape

## Edge Cases

### Very Small Screens (< 320px)
- [ ] Content still readable
- [ ] Navigation accessible
- [ ] No critical features hidden

### Large Phones (> 428px)
- [ ] Uses tablet layout where appropriate
- [ ] Content doesn't look stretched
- [ ] Images scale properly

### Notched Devices
- [ ] Content respects safe areas
- [ ] No content hidden behind notch
- [ ] Status bar styled correctly

### Foldable Devices
- [ ] App adapts to folded state
- [ ] App adapts to unfolded state
- [ ] Content reflows properly

## Ethiopian-Specific

### Language Support
- [ ] Amharic text displays correctly
- [ ] Tigrinya text displays correctly
- [ ] Oromo text displays correctly
- [ ] Font sizes adequate for Ethiopian scripts
- [ ] Right-to-left support if needed

### Currency
- [ ] ETB symbol displays correctly
- [ ] Number formatting correct (Ethiopian format)
- [ ] Prices readable on all screens

### Local Features
- [ ] Ethiopian categories display properly
- [ ] Local shipping zones work
- [ ] Ethiopian phone number format correct
- [ ] Address fields work for Ethiopian addresses

## Browser DevTools Testing

### Chrome DevTools
```bash
# Open DevTools
F12 or Ctrl+Shift+I (Windows/Linux)
Cmd+Opt+I (Mac)

# Toggle Device Toolbar
Ctrl+Shift+M (Windows/Linux)
Cmd+Shift+M (Mac)

# Test Devices:
1. Select device from dropdown
2. Test portrait and landscape
3. Test different network speeds (3G, 4G)
4. Check Lighthouse scores
```

### Lighthouse Audit
- [ ] Performance score > 90
- [ ] Accessibility score > 90
- [ ] Best Practices score > 90
- [ ] SEO score > 90
- [ ] PWA checklist items passed

### Coverage Tool
- [ ] Unused CSS identified
- [ ] Unused JavaScript identified
- [ ] Critical path optimized

## Real Device Testing

### Android Testing
1. Enable USB debugging
2. Connect device to computer
3. Open Chrome DevTools > Remote Devices
4. Inspect device

### iOS Testing
1. Enable Web Inspector (Settings > Safari > Advanced)
2. Connect device to Mac
3. Open Safari > Develop > [Device Name]

## Automated Testing

### Visual Regression Testing
```bash
# Using Percy, Chromatic, or similar
npm run test:visual
```

### Responsive Screenshots
```bash
# Using Playwright or Puppeteer
npm run test:screenshots
```

### Accessibility Testing
```bash
# Using axe-core or similar
npm run test:a11y
```

## Sign-Off

### Test Summary
- Date tested: _______________
- Tester name: _______________
- Devices used: _______________
- Issues found: _______________

### Critical Issues (Must Fix)
- [ ] Issue 1: _______________
- [ ] Issue 2: _______________

### Minor Issues (Nice to Have)
- [ ] Issue 1: _______________
- [ ] Issue 2: _______________

### Approved for Release
- [ ] All critical issues resolved
- [ ] Mobile experience tested on real devices
- [ ] PWA installation verified
- [ ] Performance acceptable on 3G
- [ ] Accessibility standards met

**Approved by:** _______________ **Date:** _______________
