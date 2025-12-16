# Database Seed Scripts

This directory contains seed scripts to populate the database with demo and initial data.

## Available Seed Scripts

### demo-products.ts

Seeds the database with comprehensive demo products across multiple categories.

**Products Included:**
- **Smart Phones** (3 products)
  - Samsung Galaxy S24 Ultra
  - iPhone 15 Pro Max
  - Google Pixel 8 Pro

- **CCTV Cameras** (3 products)
  - Hikvision 4K Ultra HD IP Camera
  - Dahua 2MP Dome Camera
  - TP-Link Tapo 360° Pan/Tilt Camera

- **Door Alarms** (3 products)
  - Ring Alarm Door/Window Sensor
  - SimpliSafe Smart Door Lock with Alarm
  - Yale Wireless Door/Window Alarm Kit

- **Portable Flash Disks** (above 512GB) (3 products)
  - SanDisk Extreme PRO 1TB
  - Samsung BAR Plus 512GB
  - Kingston DataTraveler Max 1TB

- **Dash Cams** (3 products)
  - Garmin Dash Cam 67W
  - Viofo A129 Plus Duo
  - NextBase 622GW 4K

- **Routers** (3 products)
  - TP-Link Archer AX73 WiFi 6
  - ASUS RT-AX86U Pro Gaming
  - Netgear Nighthawk AX12

- **Wireless WiFi Devices** (4 products)
  - TP-Link Deco X60 Mesh System
  - Google Nest WiFi Pro 6E
  - Netgear Orbi WiFi 6 Mesh
  - TP-Link RE815XE WiFi 6E Extender

**Total: 22 demo products**

## Usage

### Prerequisites

1. Ensure your database is set up and migrations are run:
   ```bash
   npx prisma migrate dev
   ```

2. Make sure your `.env` file has the correct `DATABASE_URL` configured.

### Running the Demo Products Seed

```bash
npx tsx prisma/seeds/demo-products.ts
```

### What Gets Created

The script automatically creates:
- A demo vendor user (email: `demo.vendor@minalesh.com`, password: `DemoVendor123!`)
- A vendor profile with approved status
- Four product categories (Electronics, Security Systems, Storage Devices, Networking)
- 22 demo products with comprehensive details including:
  - Product names, descriptions, and specifications
  - Pricing (including sale prices)
  - Stock quantities
  - SKUs
  - Features and specifications
  - Images (placeholder paths)
  - Ratings and review counts

### Demo Vendor Login

After running the seed script, you can log in as the demo vendor:
- **Email:** demo.vendor@minalesh.com
- **Password:** DemoVendor123!

## Notes

- The script uses `upsert` operations, so it's safe to run multiple times
- Existing products with the same slug won't be duplicated
- All prices are in Ethiopian Birr (ETB)
- Image paths are placeholders - you may need to add actual images to match the paths
- Products are marked as active and available for purchase
- Some products are marked as "featured" for homepage display

## Troubleshooting

### Database Connection Error
Ensure your `DATABASE_URL` in `.env` is correctly configured:
```
DATABASE_URL="postgresql://username:password@localhost:5432/minalesh"
```

### TypeScript Errors
Make sure all dependencies are installed:
```bash
npm install
```

### Missing Prisma Client
Generate the Prisma client:
```bash
npx prisma generate
```

## Adding More Seed Scripts

To add additional seed scripts:

1. Create a new TypeScript file in this directory
2. Import PrismaClient and necessary dependencies
3. Follow the pattern shown in `demo-products.ts`
4. Document your seed script in this README
5. Use `upsert` operations to make scripts idempotent

## Related Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [Main Project README](../../README.md)
- [Admin Product Management](../../docs/ADMIN_PRODUCT_MANAGEMENT.md)
