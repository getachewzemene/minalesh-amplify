# Social Sharing Feature Documentation

## Overview

The social sharing feature allows customers to share product pages across multiple social media platforms and track sharing metrics. This feature is specifically optimized for the Ethiopian market with support for WhatsApp, which is popular in Ethiopia.

## Features

### 1. Share Buttons on Product Pages
- Integrated share button on all product detail pages
- Displays share count when available
- Dropdown menu with multiple sharing options

### 2. Pre-filled Share Text
- Automatically includes product name, price, and description
- Formatted specifically for each platform
- Example: "Check out iPhone 13 Pro for 45000 ETB on Minalesh! High-quality smartphone with amazing features"

### 3. Share Count Display
- Shows total number of shares
- Real-time updates after each share
- Breakdown by platform available via API

### 4. Supported Platforms

#### WhatsApp (Popular in Ethiopia)
- Pre-filled message with product details
- Direct link to product page
- Color-coded green icon

#### Facebook
- Standard Facebook share dialog
- Includes product quote
- Blue icon

#### Twitter
- Pre-filled tweet with product name and price
- Hashtags: #Minalesh, #Ethiopia, #Shopping
- Sky blue icon

#### Telegram
- Share via Telegram with product details
- Blue icon

#### Copy Link
- One-click link copying
- Toast notification on success
- Copied state indication

#### QR Code
- Generate QR code for mobile sharing
- Download QR code as PNG
- Shows product name and price on dialog
- Perfect for offline sharing

#### Native Share (Mobile)
- Uses device's native share menu
- Available on supported mobile devices
- Falls back to other options on desktop

## API Endpoints

### Track Product Share
```
POST /api/products/{productId}/share
```

**Request Body:**
```json
{
  "platform": "whatsapp" // whatsapp, facebook, twitter, telegram, copy_link, qr_code, native
}
```

**Response:**
```json
{
  "success": true,
  "message": "Share tracked successfully",
  "shareId": "uuid"
}
```

### Get Share Statistics
```
GET /api/products/{productId}/share
```

**Response:**
```json
{
  "totalShares": 42,
  "byPlatform": {
    "whatsapp": 15,
    "facebook": 10,
    "twitter": 5,
    "telegram": 8,
    "copy_link": 3,
    "qr_code": 1,
    "native": 0
  }
}
```

## Usage

### In Product Pages

```tsx
import { ProductSocialShare } from '@/components/social'

// In your component
<ProductSocialShare
  productId={product.id}
  productName={product.name}
  productDescription={product.description}
  productPrice={effectivePrice}
  productImage={productImage}
  showShareCount={true}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| productId | string | Yes | Product ID for tracking |
| productName | string | Yes | Product name for share text |
| productDescription | string | No | Product description for share text |
| productPrice | number | Yes | Product price to display |
| productImage | string | No | Product image URL |
| url | string | No | Custom share URL (defaults to current page) |
| variant | 'default' \| 'outline' | No | Button variant (default: 'outline') |
| size | 'sm' \| 'default' \| 'lg' \| 'icon' | No | Button size (default: 'lg') |
| showShareCount | boolean | No | Show share count (default: true) |
| className | string | No | Additional CSS classes |

## Database Schema

### ProductShare Table

```sql
CREATE TABLE "product_shares" (
    "id" UUID PRIMARY KEY,
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "profiles"("id") ON DELETE SET NULL,
    "platform" "SharePlatform" NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX ON "product_shares"("product_id");
CREATE INDEX ON "product_shares"("user_id");
CREATE INDEX ON "product_shares"("platform");
CREATE INDEX ON "product_shares"("created_at");
```

### SharePlatform Enum

```sql
CREATE TYPE "SharePlatform" AS ENUM (
    'whatsapp',
    'facebook', 
    'twitter',
    'telegram',
    'copy_link',
    'qr_code',
    'native'
);
```

## Analytics

The share tracking system captures:
- **Platform**: Which platform was used for sharing
- **User ID**: If the user is logged in (optional)
- **User Agent**: Browser/device information
- **IP Address**: For geographic analytics
- **Timestamp**: When the share occurred

This data can be used for:
- Understanding which platforms are most popular
- Identifying viral products
- Geographic analysis of shares
- User engagement metrics

## Security Features

1. **Input Sanitization**: Product names and descriptions are sanitized before including in share text
2. **Filename Sanitization**: QR code filenames are sanitized to prevent path traversal
3. **Proper Error Handling**: Type-safe error handling for share operations
4. **Optional Authentication**: Works for both logged-in and anonymous users

## Ethiopian Market Optimization

1. **WhatsApp Priority**: WhatsApp is prominently featured as it's popular in Ethiopia
2. **Currency Display**: Prices shown in Ethiopian Birr (ETB)
3. **Local Hashtags**: Twitter shares include #Ethiopia hashtag
4. **QR Codes**: Useful for offline-to-online conversion in markets and shops
5. **Mobile-First**: Native share API for mobile users

## Future Enhancements

Potential improvements for future versions:
- Share rewards/incentives program
- Email sharing option
- SMS sharing for feature phones
- Share leaderboards for products
- Referral tracking through shared links
- Social proof widgets ("X people shared this")
- WhatsApp Business integration

## Dependencies

- `qrcode` - QR code generation
- `@types/qrcode` - TypeScript types (dev dependency)
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `@radix-ui/react-dialog` - Modal for QR code display
- `@radix-ui/react-dropdown-menu` - Share menu

## Browser Compatibility

- Modern browsers with ES6+ support
- Native Share API requires supported mobile browser
- Clipboard API for copy functionality
- Canvas API for QR code generation

## Testing

To test the implementation:

1. Navigate to any product page
2. Click the share button
3. Try different sharing options
4. Verify share count updates
5. Test QR code generation and download
6. Check share tracking in database

## Troubleshooting

**Share count not updating:**
- Check API endpoint is accessible
- Verify productId is correct
- Check browser console for errors

**QR code not generating:**
- Verify qrcode package is installed
- Check browser console for errors
- Ensure URL is valid

**Native share not available:**
- Feature requires HTTPS
- Only available on supported mobile browsers
- Falls back to other sharing options

## License

Part of the Minalesh Marketplace platform.
