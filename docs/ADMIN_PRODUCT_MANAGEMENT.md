# Admin Product Management - Ethiopian E-commerce Features

## Overview

The admin product management panel provides comprehensive CRUD operations for managing products in the Minalesh Ethiopian marketplace. It includes features specifically designed for the Ethiopian e-commerce ecosystem.

## Features

### Core Functionality

1. **Product Creation**
   - Full product form with all necessary fields
   - Auto-generated URL slugs
   - Multiple image support
   - Product features management
   - Category assignment
   - Stock management
   - Pricing with sale price support

2. **Product Listing**
   - Paginated product table
   - Search by name, description, or SKU
   - Filter by category
   - Filter by active/inactive status
   - Vendor information display

3. **Product Updates**
   - Edit all product fields
   - Update stock levels
   - Change pricing
   - Toggle active/featured status

4. **Product Deletion**
   - Confirmation dialog for safety
   - Complete removal from database

### Ethiopian-Specific Features

#### 1. Currency Support
- All prices displayed in Ethiopian Birr (ETB)
- Proper formatting: "ETB 2,499.00"
- Support for both regular and sale prices

#### 2. Ethiopian Categories
The system includes pre-configured categories relevant to Ethiopian commerce:

**Traditional & Cultural:**
- Traditional Clothing (Habesha Kemis, Netela)
- Coffee & Tea (Ethiopian Coffee Beans, Jebena)
- Spices & Ingredients (Berbere, Mitmita)
- Handicrafts & Art
- Religious Items

**Modern Commerce:**
- Electronics
- Fashion & Beauty
- Home & Kitchen
- Health & Wellness
- Sports & Outdoor

**Local Industries:**
- Agriculture & Farming
- Automotive
- Baby & Kids
- Books & Education

#### 3. Vendor Verification
- Display vendor verification status
- Show trade license information
- TIN (Taxpayer Identification Number) support
- Vendor approval workflow

#### 4. Local Business Context
- Support for local business registration (Trade License)
- Ethiopian tax identification (TIN)
- Vendor approval system for marketplace quality

## API Endpoints

### Admin Endpoints

#### GET `/api/admin/products`
Fetch all products with pagination and filtering.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term for name/description/SKU
- `category` - Category slug to filter by
- `isActive` - Filter by active status (true/false)

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### PATCH `/api/admin/products`
Update any product (admin permission).

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Product Name",
  "price": 2499,
  "stockQuantity": 50,
  ...
}
```

#### DELETE `/api/admin/products?id=uuid`
Delete any product (admin permission).

### Vendor Endpoints

#### GET `/api/products`
Fetch vendor's own products only.

#### POST `/api/products`
Create new product (vendor must be verified).

#### PATCH `/api/products`
Update vendor's own product.

#### DELETE `/api/products?id=uuid`
Delete vendor's own product.

### Category Endpoint

#### GET `/api/categories`
Fetch all active categories.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Traditional Clothing",
    "slug": "traditional-clothing",
    "description": "...",
    "parentId": null
  },
  ...
]
```

## Database Seeding

To populate the database with Ethiopian categories:

```bash
npx tsx prisma/seeds/categories.ts
```

This will create:
- 15 main categories
- Multiple subcategories for major categories
- Proper hierarchical structure

## Ethiopian E-commerce Best Practices

### Product Information
1. **Detailed Descriptions**: Include all relevant details in Amharic or English
2. **Clear Pricing**: Always show prices in ETB
3. **Stock Transparency**: Keep stock levels accurate
4. **Quality Images**: Use high-quality product images

### Vendor Management
1. **Verification Process**: Ensure all vendors have valid trade licenses
2. **TIN Registration**: Verify TIN numbers for tax compliance
3. **Quality Control**: Review vendor products before approval

### Categories
1. **Cultural Sensitivity**: Respect Ethiopian cultural products
2. **Proper Classification**: Use appropriate categories for traditional items
3. **Local Terminology**: Use terms familiar to Ethiopian customers

### Compliance
1. **Business Registration**: Verify all vendors are legally registered
2. **Tax Compliance**: Ensure TIN registration for all vendors
3. **Product Standards**: Maintain quality standards for marketplace

## Usage Guide

### For Administrators

1. **Access Admin Panel**
   - Navigate to `/admin`
   - Click on "Products" tab

2. **Add New Product**
   - Click "Add Product" button
   - Fill in all required fields (marked with *)
   - Add images and features
   - Select appropriate category
   - Set pricing in ETB
   - Save

3. **Edit Product**
   - Click edit icon on any product
   - Update fields as needed
   - Save changes

4. **Delete Product**
   - Click delete icon
   - Confirm deletion in dialog

5. **Filter Products**
   - Use search bar for text search
   - Select category filter
   - Choose active/inactive status
   - Click "Clear Filters" to reset

### For Vendors

Vendors use the same interface but can only manage their own products. The system automatically filters products by vendor ID.

## Future Enhancements

- [ ] Bulk product operations
- [ ] Product import/export (CSV, Excel)
- [ ] Advanced analytics per product
- [ ] Inventory alerts for low stock
- [ ] Multi-language support (Amharic)
- [ ] Image upload to cloud storage
- [ ] Product review moderation
- [ ] SEO optimization tools
- [ ] Product bundling
- [ ] Discount and promotion management
- [ ] Shipping zone configuration for Ethiopian regions
- [ ] Integration with Ethiopian payment gateways (CBE Birr, telebirr, etc.)

## Technical Notes

### Authentication
Currently uses JWT token authentication. Admin role verification is marked with TODO comments for future implementation.

### Database
Uses PostgreSQL with Prisma ORM. All product data is stored with proper relationships to vendors and categories.

### Security
- Vendor authorization checks on all operations
- Product ownership verification for vendor operations
- Input validation on all forms
- SQL injection protection via Prisma

## Support

For issues or questions:
1. Check the main README.md
2. Review the Prisma schema
3. Check API route implementations
4. Contact development team
