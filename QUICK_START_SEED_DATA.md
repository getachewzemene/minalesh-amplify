# Quick Start: Demo Seed Data

## TL;DR - Get Started in 3 Steps

```bash
# 1. Ensure database is ready
npx prisma migrate dev
npx prisma generate

# 2. Run the seed script
npm run seed:demo

# 3. Login as demo vendor
# Email: demo.vendor@minalesh.com
# Password: DemoVendor123!
```

## What You Get

✅ **22 Demo Products** across 7 categories  
✅ **1 Demo Vendor Account** (approved and ready to use)  
✅ **4 Product Categories** (Electronics, Security, Storage, Networking)  
✅ **Realistic Data** with proper pricing, descriptions, and specifications

## Product Categories

### 🔷 Smart Phones (3)
High-end smartphones from Samsung, Apple, and Google

### 📷 CCTV Cameras (3)
Security cameras from Hikvision, Dahua, and TP-Link

### 🚪 Door Alarms (3)
Smart door sensors and alarm systems

### 💾 Flash Disks (3)
Large capacity USB drives (512GB - 1TB)

### 🚗 Dash Cams (3)
Car dashboard cameras with advanced features

### 📡 Routers (3)
WiFi 6 routers for home and office

### 📶 WiFi Devices (4)
Mesh systems and range extenders

## Usage Examples

### View All Products
Navigate to `/products` in your app after seeding

### Edit Products as Vendor
1. Login with demo vendor credentials
2. Navigate to vendor dashboard
3. View and edit any of the 22 products

### Test Customer Features
- Browse products by category
- Add products to cart
- View product details with full specifications
- Check ratings and reviews (pre-populated counts)

## Product Pricing

- **Price Range:** ETB 2,499 - ETB 95,999
- **Sale Items:** 14 of 22 products have discounts
- **Average Discount:** ~10-15% off regular price

## Demo Vendor Details

**Company:** Tech Solutions Ethiopia  
**Location:** Bole, Addis Ababa  
**Status:** ✅ Approved Vendor  
**Products:** All 22 demo products

**Login Credentials:**
- Email: `demo.vendor@minalesh.com`
- Password: `DemoVendor123!`

## Troubleshooting

### "Unique constraint violation"
The script uses `upsert`, but if you see errors:
```bash
# Reset and try again
npx prisma migrate reset
npm run seed:demo
```

### "Cannot find module '@prisma/client'"
Generate the Prisma client:
```bash
npx prisma generate
npm run seed:demo
```

### "Database connection error"
Check your `.env` file has correct `DATABASE_URL`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/minalesh"
```

## Next Steps

After seeding:
1. ✅ Test product browsing
2. ✅ Login as vendor and view products
3. ✅ Test cart and checkout with demo products
4. ✅ Verify search functionality with various product names
5. ✅ Test filtering by categories

## Learn More

- 📖 [Full Documentation](./prisma/seeds/README.md)
- 📊 [Complete Summary](./SEED_DATA_SUMMARY.md)
- 🏗️ [Main README](./README.md)

---

**Quick tip:** You can run `npm run seed:demo` multiple times safely - it won't create duplicates!
