# Admin System Documentation

## Overview

The Minalesh marketplace has a **single admin** system that allows one designated administrator to manage all aspects of the platform.

## Key Features

### 1. Single Admin Constraint
- **Only one admin user** can exist in the system at any time
- This ensures accountability and security
- The admin user is stored in the database with `role = 'admin'`

### 2. Separate Admin Login
- Admin login is located at `/admin/login`
- Dedicated UI with admin-specific branding
- Regular users cannot access admin areas even if they try to navigate there
- Middleware automatically redirects unauthorized users

### 3. Admin Initialization

To create the admin user, run:

```bash
npm run init:admin
```

The script will:
1. Check if an admin already exists
2. If not, prompt for admin credentials:
   - Email address
   - Password (minimum 8 characters)
   - First name (optional)
   - Last name (optional)
3. Create the admin user with verified email
4. Prevent creation of a second admin

### 4. Admin Capabilities

The admin can access all management features through the admin dashboard at `/admin/dashboard`:

#### Overview Tab
- Key metrics (users, vendors, orders, revenue)
- Sales trends and charts
- Recent activity
- System health indicators

#### Orders Management
- View all orders across all vendors
- Update order status
- Process refunds
- View order details and history

#### Products Management
- View all products from all vendors
- Edit product details
- Activate/deactivate products
- Delete products
- Search and filter products

#### Vendors Management
- Approve vendor registrations
- Suspend/unsuspend vendors
- View vendor details
- Manage vendor commissions

#### Analytics
- Sales analytics
- Regional performance
- Product performance
- Conversion funnels
- Cohort retention

#### Coupons Management
- Create discount codes
- Set usage limits
- Configure discount types (percentage, fixed, free shipping)
- Activate/deactivate coupons

#### Shipping Management
- Configure shipping zones
- Set shipping rates
- Manage shipping methods
- Define free shipping thresholds

#### Tax Management
- Configure VAT rates
- Set regional tax rates
- Manage tax exemptions

## Security

### Authentication Flow
1. Admin navigates to `/admin/login`
2. Enters credentials
3. System validates credentials against users with `role = 'admin'`
4. Non-admin users are rejected even with valid credentials
5. JWT token is issued with admin role
6. Middleware validates admin role for all `/admin/*` routes

### Middleware Protection
- All routes under `/admin/*` require authentication
- All routes under `/admin/*` (except `/admin/login`) require admin role
- Unauthorized access redirects to `/admin/login`
- Non-admin roles attempting access are redirected to homepage

### API Protection
- All admin APIs use `withAdmin` middleware
- APIs check for valid JWT token
- APIs verify `role = 'admin'` in the token
- Unauthorized requests return 401 or 403 errors

## Changing the Admin

Since only one admin is allowed, changing the admin requires direct database access:

### Option 1: Change existing user's role
```sql
-- First, demote current admin to customer/vendor
UPDATE users SET role = 'customer' WHERE role = 'admin';

-- Then, promote new user to admin
UPDATE users SET role = 'admin' WHERE email = 'newemail@example.com';
```

### Option 2: Use the init script
1. Manually remove the current admin from the database
2. Run `npm run init:admin` to create a new admin

## Routes

- `/admin/login` - Admin login page (public)
- `/admin` - Redirects to `/admin/dashboard`
- `/admin/dashboard` - Main admin dashboard (protected)
- `/admin/*` - All other admin routes (protected)

## API Endpoints

All admin endpoints are prefixed with `/api/admin/`:

- `/api/admin/products` - Product management
- `/api/admin/vendors` - Vendor management
- `/api/admin/orders` - Order management
- `/api/admin/coupons` - Coupon management
- `/api/admin/promotions` - Promotion management
- `/api/admin/shipping-zones` - Shipping zone management
- `/api/admin/tax-rates` - Tax rate management
- `/api/admin/flash-sales` - Flash sale management

All these endpoints require:
1. Valid JWT token in Authorization header
2. User role must be 'admin'

## Troubleshooting

### Cannot create admin
**Error:** "Only one admin user is allowed in the system"

**Solution:** An admin already exists. Use the database to check who the current admin is or change the admin as described above.

### Cannot login as admin
**Error:** "Access denied. Admin credentials required."

**Solution:** The account you're using doesn't have admin role. Verify the user has `role = 'admin'` in the database.

### Admin routes redirect to login
**Solution:** 
1. Make sure you're logged in at `/admin/login` (not `/auth/login`)
2. Verify your JWT token is valid and contains `role: 'admin'`
3. Check browser localStorage for 'auth_token'

### Cannot access admin APIs
**Error:** 401 Unauthorized or 403 Forbidden

**Solution:**
1. Ensure you're sending the JWT token in the Authorization header: `Authorization: Bearer <token>`
2. Verify the token contains `role: 'admin'`
3. Check that the token hasn't expired
