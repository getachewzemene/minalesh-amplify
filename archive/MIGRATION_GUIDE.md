# Migration Guide (Legacy Reference)

Supabase integration has been fully removed. This document is retained only as a historical reference.

## Overview

The application uses PostgreSQL with Prisma ORM as the database toolkit and Next.js API routes for the backend.

## What Changed

### 1. Database Layer
PostgreSQL with Prisma ORM

### 2. Authentication
Custom JWT-based authentication with bcryptjs for password hashing

### 3. Data Access
Next.js API routes with Prisma client

### 4. Real-time Features
Polling (notifications refresh every 30 seconds). Consider WebSockets for true real-time in the future.

## Architecture

```
Frontend (React Components)
    ↓
Next.js API Routes (/app/api/*)
    ↓
Prisma Client
    ↓
PostgreSQL Database
```

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/minalesh?schema=public"
JWT_SECRET="your-strong-random-secret-key-here"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**: Generate a strong random string for `JWT_SECRET` in production:
```bash
openssl rand -base64 32
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Seed the database
npx prisma db seed
```

### 3. Build and Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout (client-side token removal)
- `GET /api/auth/me` - Get current user

### Profile
- `PATCH /api/profile` - Update user profile
- `POST /api/profile/[vendorId]/approve` - Approve vendor (admin only - not implemented)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications` - Mark notification(s) as read
- `DELETE /api/notifications?id={id}` - Delete notification

### Orders
- `GET /api/orders` - Get user orders

### Products
- `GET /api/products` - Get vendor products
- `POST /api/products` - Create product (vendor only)
- `PATCH /api/products` - Update product (vendor only)

### Reviews
- `GET /api/reviews?productId={id}` - Get product reviews
- `POST /api/reviews` - Create review

## Database Schema

The Prisma schema includes the following models:
- User (authentication)
- Profile (user details and vendor info)
- Category
- Product
- ProductVariant
- Cart
- Order
- OrderItem
- Review
- Wishlist
- Notification
- VendorPayout
- AnalyticsEvent

See `prisma/schema.prisma` for the full schema definition.

## Breaking Changes

### 1. Property Names
All database field names changed from `snake_case` to `camelCase`:
- `display_name` → `displayName`
- `first_name` → `firstName`
- `is_vendor` → `isVendor`
- `vendor_status` → `vendorStatus`
- etc.

### 2. Authentication
- No more `supabase.auth` methods
- Use new `login()`, `register()`, `logout()` from `useAuth()` hook
- Tokens stored in localStorage (consider httpOnly cookies for production)

### 3. Data Fetching
- No more direct Supabase queries from components
- All data access through API routes with JWT authentication

### 4. Real-time Updates
- Supabase real-time subscriptions replaced with polling
- Notifications refresh every 30 seconds
- For true real-time, consider WebSockets or Server-Sent Events

## Security Considerations

### Production Checklist
- [ ] Set strong `JWT_SECRET` environment variable
- [ ] Use HTTPS/TLS for database connections
- [ ] Implement rate limiting on API routes
- [ ] Add CSRF protection
- [ ] Consider httpOnly cookies instead of localStorage for tokens
- [ ] Implement proper admin role verification
- [ ] Add input sanitization for all user inputs
- [ ] Set up proper CORS policies
- [ ] Enable database connection pooling
- [ ] Implement proper logging and monitoring

### Current Security Features
✅ JWT authentication with bcrypt password hashing
✅ Email format validation
✅ Password strength requirements (min 8 chars, letter + number)
✅ Protected API routes requiring authentication
✅ SQL injection protection via Prisma ORM
✅ Environment variable validation in production

### Known Limitations
⚠️ Tokens in localStorage (vulnerable to XSS)
⚠️ Admin endpoint not fully implemented
⚠️ No rate limiting
⚠️ No CSRF protection

## Migration Checklist for Existing Data

If you are importing legacy data:

1. **Transform snake_case to camelCase**
   - Update column names in the SQL dump
   - Or use Prisma migrations to rename columns

2. **Import to PostgreSQL**
   ```sql
   psql -h localhost -U postgres -d minalesh < backup.sql
   ```

3. **Run Prisma migrations**
   ```bash
   npx prisma migrate dev
   ```

## Troubleshooting

### Build Errors
- Ensure all snake_case properties updated to camelCase
- Run `npx prisma generate` if Prisma client is outdated
- Check TypeScript errors with `npm run build`

### Database Connection
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall/network settings

### Authentication Issues
- Verify `JWT_SECRET` is set
- Check token expiration (`JWT_EXPIRES_IN`)
- Clear localStorage and try logging in again

## Support

For issues or questions:
1. Check this migration guide
2. Review the Prisma documentation: https://www.prisma.io/docs
3. Check Next.js API routes documentation: https://nextjs.org/docs/api-routes/introduction

## Rollback Plan

Rollback to Supabase is not supported in the current stack. Reintroducing Supabase would require reversing this migration and reinstalling its client library.

## Future Enhancements

Consider implementing:
- [ ] Refresh token mechanism
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Role-based access control (RBAC)
- [ ] WebSocket support for real-time features
- [ ] File upload handling (if needed)
- [ ] Database backup automation
- [ ] Performance monitoring
- [ ] Error tracking (e.g., Sentry)
