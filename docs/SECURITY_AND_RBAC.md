# Security, RBAC & Notifications

This document describes the security features, role-based access control (RBAC), and notification system implemented in the Minalesh marketplace application.

## Table of Contents

- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Authentication Hardening](#authentication-hardening)
- [Email Notifications](#email-notifications)
- [API Endpoints](#api-endpoints)
- [Migration Guide](#migration-guide)

## Role-Based Access Control (RBAC)

### User Roles

The system supports three user roles:

1. **Customer** (default): Regular users who can browse and purchase products
2. **Vendor**: Users who can sell products and manage their inventory
3. **Admin**: Users with full system access

### Role Assignment

- New users are automatically assigned the `customer` role on registration
- Vendors must apply for vendor status through their profile
- When an admin approves a vendor application, the user's role is updated to `vendor`
- Admin roles must be assigned manually through database updates

### Server-Side Enforcement

All API routes enforce role-based permissions at the server level using middleware:

```typescript
// Require authentication
import { withAuth } from '@/lib/middleware';
const { error, payload } = withAuth(request);
if (error) return error;

// Require admin access
import { withAdmin } from '@/lib/middleware';
const { error, payload } = withAdmin(request);
if (error) return error;

// Require vendor or admin access
import { withVendorOrAdmin } from '@/lib/middleware';
const { error, payload } = withVendorOrAdmin(request);
if (error) return error;
```

### Helper Functions

The `auth.ts` library provides role-checking functions:

```typescript
import { isAdmin, isVendor, isCustomer, hasRole } from '@/lib/auth';

// Check specific role
if (isAdmin(userRole)) { ... }
if (isVendor(userRole)) { ... }  // true for vendor and admin
if (isCustomer(userRole)) { ... } // true for all roles

// Check multiple roles
if (hasRole(userRole, ['admin', 'vendor'])) { ... }
```

## Authentication Hardening

### Brute-Force Protection

The login system includes automatic account lockout after failed attempts:

- **Max Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Auto-Reset**: Login attempts reset after successful login or lockout expiry

### Password Requirements

- Minimum 8 characters
- At least one letter
- At least one number

### Email Verification

New users receive an email verification link upon registration:

1. User registers with email and password
2. System generates a secure verification token
3. Verification email is sent with a link containing the token
4. User clicks link to verify email
5. Token is validated and `emailVerified` timestamp is set

Verification tokens expire after 24 hours.

### Password Reset Flow

Secure password reset with token expiry:

1. User requests password reset with email
2. System generates secure reset token (valid for 1 hour)
3. Reset email is sent with link containing token
4. User clicks link and enters new password
5. Token is validated, password is updated, and token is cleared

### Token Refresh

JWT tokens have configurable expiry times:

- **Access Token**: 7 days (default, configurable via `JWT_EXPIRES_IN`)
- **Refresh Token**: 30 days (default, configurable via `REFRESH_TOKEN_EXPIRES_IN`)

Clients can use the `/api/auth/refresh` endpoint to get new tokens without re-authentication.

### Security Tokens

All security tokens (email verification, password reset) use cryptographically secure random generation via Node.js `crypto` module, not `Math.random()`.

## Email Notifications

### Email Service Configuration

Configure email service in `.env`:

```bash
# Email Service Configuration (Optional)
EMAIL_FROM="noreply@minalesh.et"
# SENDGRID_API_KEY="your-sendgrid-api-key"  # For SendGrid
# AWS_SES_ACCESS_KEY="your-key"             # For AWS SES
```

In development, emails are logged to console. In production, integrate with:
- SendGrid
- AWS SES
- Mailgun
- Other email service providers

### Email Templates

Four transactional email templates are provided:

1. **Order Confirmation**: Sent after successful order creation
2. **Shipping Update**: Sent when order status changes
3. **Password Reset**: Sent when user requests password reset
4. **Email Verification**: Sent upon user registration

All templates support both plain text and HTML formats.

### Notification Preferences

Users can manage their notification preferences:

```typescript
interface NotificationPreference {
  emailOrderConfirm: boolean;      // Order confirmation emails
  emailShippingUpdate: boolean;    // Shipping update emails
  emailPromotions: boolean;        // Promotional emails
  emailNewsletter: boolean;        // Newsletter emails
  inAppOrderUpdates: boolean;      // In-app order notifications
  inAppPromotions: boolean;        // In-app promotional notifications
}
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "customer",
    "emailVerified": null
  },
  "token": "...",
  "refreshToken": "..."
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "customer",
    "emailVerified": "2024-01-01T00:00:00.000Z"
  },
  "token": "...",
  "refreshToken": "..."
}
```

**Error Responses:**
- `401`: Invalid credentials (with remaining attempts)
- `429`: Account locked due to too many failed attempts

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "..."
}
```

**Response:**
```json
{
  "token": "...",
  "refreshToken": "..."
}
```

#### POST `/api/auth/verify-email`
Verify email address with token.

**Request Body:**
```json
{
  "token": "verification-token-from-email"
}
```

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

#### POST `/api/auth/password-reset/request`
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

#### POST `/api/auth/password-reset/confirm`
Confirm password reset with token and new password.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

### Notification Preferences Endpoints

#### GET `/api/user/notification-preferences`
Get user's notification preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "...",
  "userId": "...",
  "emailOrderConfirm": true,
  "emailShippingUpdate": true,
  "emailPromotions": false,
  "emailNewsletter": false,
  "inAppOrderUpdates": true,
  "inAppPromotions": true
}
```

#### PUT `/api/user/notification-preferences`
Update notification preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "emailPromotions": true,
  "emailNewsletter": true
}
```

**Response:**
```json
{
  "id": "...",
  "userId": "...",
  "emailOrderConfirm": true,
  "emailShippingUpdate": true,
  "emailPromotions": true,
  "emailNewsletter": true,
  "inAppOrderUpdates": true,
  "inAppPromotions": true
}
```

## Migration Guide

### Database Migration

Run the migration to add new fields to the database:

```bash
npx prisma migrate deploy
```

This will:
1. Add `UserRole` enum (customer, vendor, admin)
2. Add `role` field to users table
3. Add authentication hardening fields (email verification, password reset, brute-force protection)
4. Create `notification_preferences` table
5. Migrate existing vendor users to the `vendor` role

### Environment Variables

Update your `.env` file with new configuration:

```bash
# Token expiry configuration
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Email service (optional)
EMAIL_FROM="noreply@minalesh.et"
# Add your email service provider credentials here
```

### Removing Email-Based Admin Checks

The old `ADMIN_EMAILS` environment variable is no longer used. Admin access is now controlled through the database `role` field.

To manually set admin users, update the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@minalesh.et';
```

### Client-Side Updates

Update your client-side code to:

1. Handle the new `role` field in user objects
2. Use `refreshToken` for token refresh
3. Show email verification prompts for unverified users
4. Allow users to manage notification preferences

## Security Best Practices

1. **Always use HTTPS** in production to protect tokens in transit
2. **Store tokens securely** - consider httpOnly cookies instead of localStorage
3. **Rotate secrets regularly** - update JWT_SECRET periodically
4. **Monitor failed login attempts** - watch for unusual patterns
5. **Configure email service** - don't rely on console logging in production
6. **Regular security audits** - use CodeQL and other tools to scan for vulnerabilities
7. **Rate limiting** - implement additional rate limiting at the API gateway level

## Testing

Run the test suite to verify RBAC and authentication:

```bash
npm test
```

The test suite includes:
- RBAC helper function tests
- Brute-force protection tests
- Middleware authorization tests
- Email template generation tests

## Support

For questions or issues related to security and RBAC, please contact the development team or open an issue in the repository.
