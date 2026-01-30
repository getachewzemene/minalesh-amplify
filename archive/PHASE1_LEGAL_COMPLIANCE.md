# Phase 1 Legal Compliance Features

This document describes the Phase 1 legal compliance features implemented for the Minalesh marketplace platform.

## Features Overview

### 1. Data Privacy & GDPR Compliance

#### Data Export
Users can request a complete export of their personal data in JSON or CSV format.

**API Endpoints:**
- `POST /api/user/data-export` - Create export request
- `GET /api/user/data-export` - List user's export requests
- `GET /api/user/data-export/download?requestId={id}` - Download exported data

**Request Body (POST):**
```json
{
  "format": "json" // or "csv"
}
```

**Response:**
```json
{
  "message": "Data export request created successfully...",
  "requestId": "uuid",
  "status": "pending"
}
```

**Data Included in Export:**
- User account information (email, role, creation date)
- Profile data (name, address, phone)
- Order history with items
- Reviews and ratings
- Addresses
- Wishlist items
- User preferences
- Notification preferences
- Loyalty account and points

**Processing:**
- Export requests are processed by a background cron job (`/api/cron/process-data-exports`)
- Exports expire after 7 days
- Run cron job every 10-15 minutes: `curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/process-data-exports`

#### Account Deletion
Users can permanently delete their account with a confirmation flow.

**API Endpoint:**
- `DELETE /api/user/account`

**Request Body:**
```json
{
  "password": "user_password",
  "confirmation": "DELETE MY ACCOUNT"
}
```

**Deletion Behavior:**
- Prevents deletion if active orders exist
- Anonymizes reviews (preserves ratings, removes content)
- Deletes: wishlist, cart, notifications, preferences, loyalty data
- Retains orders (anonymized) for 7 years for tax compliance
- Cascading deletes for profile and addresses

---

### 2. Enhanced Vendor Verification

Vendors can submit verification documents for approval by administrators.

#### Vendor Submission

**API Endpoints:**
- `POST /api/vendors/verification` - Submit verification documents
- `GET /api/vendors/verification` - Check verification status

**Request Body (POST):**
```json
{
  "tradeLicenseUrl": "https://...",
  "tradeLicenseNumber": "TL-123456",
  "tinCertificateUrl": "https://...",
  "tinNumber": "TIN-789012",
  "businessRegUrl": "https://...", // optional
  "ownerIdUrl": "https://..." // optional
}
```

**Verification Statuses:**
- `pending` - Initial submission
- `under_review` - Admin is reviewing
- `approved` - Verification approved
- `rejected` - Verification rejected (with reason)
- `suspended` - Vendor suspended

#### Admin Review

**API Endpoints:**
- `GET /api/admin/vendors/verification` - List all verification requests
- `GET /api/admin/vendors/verification/{id}` - Get verification details
- `PATCH /api/admin/vendors/verification/{id}` - Approve/reject verification

**Request Body (PATCH):**
```json
{
  "status": "approved", // or "rejected", "under_review", "suspended"
  "rejectionReason": "Required if status is rejected"
}
```

**Query Parameters (GET list):**
- `status` - Filter by verification status
- `page` - Page number (default: 1)
- `perPage` - Results per page (default: 20)

---

### 3. Dispute Resolution System

Customers can file disputes for orders, and vendors can respond. Admins can mediate and resolve disputes.

#### Customer - File Dispute

**API Endpoints:**
- `POST /api/disputes` - Create a new dispute
- `GET /api/disputes` - List user's disputes

**Request Body (POST):**
```json
{
  "orderId": "uuid",
  "type": "not_as_described", // see types below
  "description": "The product received was different from the listing...",
  "evidenceUrls": [
    "https://image1.jpg",
    "https://image2.jpg"
  ]
}
```

**Dispute Types:**
- `not_received` - Order not received
- `not_as_described` - Product doesn't match description
- `damaged` - Product arrived damaged
- `wrong_item` - Wrong item shipped
- `refund_issue` - Refund not processed
- `other` - Other issues

**Dispute Statuses:**
- `open` - Active dispute
- `pending_vendor_response` - Waiting for vendor (3 day deadline)
- `pending_admin_review` - Escalated to admin
- `resolved` - Admin resolved
- `closed` - Closed by customer or resolved

**Eligibility:**
- Must be filed within 30 days of delivery
- Only one active dispute per order
- Order must belong to the user

#### Vendor/Customer - Dispute Communication

**API Endpoints:**
- `GET /api/disputes/{id}` - Get dispute details
- `PATCH /api/disputes/{id}` - Update dispute status
- `GET /api/disputes/{id}/messages` - Get messages
- `POST /api/disputes/{id}/messages` - Send message

**Send Message (POST):**
```json
{
  "message": "I will ship the replacement item today."
}
```

**Update Status (PATCH):**
```json
{
  "status": "pending_admin_review", // Vendor can escalate
  "resolution": "Optional resolution text"
}
```

**Automatic Escalation:**
- If vendor doesn't respond within 72 hours (3 days), dispute is auto-escalated to admin
- Run cron job every 6-12 hours: `curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/escalate-disputes`

#### Admin - Dispute Mediation

**API Endpoints:**
- `GET /api/admin/disputes` - List all disputes
- `PATCH /api/admin/disputes/{id}` - Resolve dispute

**List Disputes Query Parameters:**
- `status` - Filter by status
- `type` - Filter by dispute type
- `page` - Page number
- `perPage` - Results per page

**Resolve Dispute (PATCH):**
```json
{
  "status": "resolved", // or "closed"
  "resolution": "Refund approved. Vendor will be credited back after review.",
  "refundAmount": 500.00 // Optional - creates a refund
}
```

---

## Database Schema

### VendorVerification Table
```sql
CREATE TABLE vendor_verifications (
  id UUID PRIMARY KEY,
  vendor_id UUID UNIQUE,
  trade_license_url TEXT,
  trade_license_number TEXT,
  tin_certificate_url TEXT,
  tin_number TEXT,
  business_reg_url TEXT,
  owner_id_url TEXT,
  status VerificationStatus DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);
```

### DataExportRequest Table
```sql
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY,
  user_id UUID,
  status DataExportStatus DEFAULT 'pending',
  format TEXT DEFAULT 'json',
  download_url TEXT,
  file_size INTEGER,
  expires_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### Dispute & DisputeMessage Tables
Already included in the base schema.

---

## Cron Jobs

### 1. Process Data Exports
**Endpoint:** `/api/cron/process-data-exports`
**Frequency:** Every 10-15 minutes
**Function:** Generates and processes pending data export requests

### 2. Escalate Disputes
**Endpoint:** `/api/cron/escalate-disputes`
**Frequency:** Every 6-12 hours
**Function:** Auto-escalates disputes to admin if vendor hasn't responded in 3 days

---

## Security Considerations

1. **Data Export:**
   - Requires authentication
   - Only exports own data
   - Downloads expire after 7 days
   - Rate limited (one pending request at a time)

2. **Account Deletion:**
   - Requires password confirmation
   - Requires exact confirmation text
   - Prevents deletion with active orders
   - Retains financial data for compliance

3. **Vendor Verification:**
   - Role-based access (vendors and admins only)
   - Document URLs should be from secure upload service
   - Admin-only approval process

4. **Disputes:**
   - Users can only access their own disputes (or disputes for their vendor account)
   - 30-day filing window
   - Automatic escalation prevents indefinite delays
   - Admin-only resolution with refund capability

---

## Email Notifications (TODO)

The following email notifications should be implemented:

### Data Privacy
- [ ] Data export ready notification
- [ ] Data export expiring soon (1 day before)
- [ ] Account deletion confirmation

### Vendor Verification
- [ ] Verification submitted confirmation
- [ ] Verification approved
- [ ] Verification rejected (with reason)
- [ ] Admin notification of new verification request

### Disputes
- [ ] Dispute filed confirmation (to customer)
- [ ] New dispute notification (to vendor)
- [ ] Vendor response notification (to customer)
- [ ] Dispute escalated (to admin and customer)
- [ ] Dispute resolved (to both parties)

---

## Frontend Integration (TODO)

### User Settings Pages
- [ ] `/settings/privacy` - Data export and account deletion
- [ ] `/settings/data-export` - View export requests and download

### Vendor Dashboard
- [ ] `/vendor/verification` - Submit/view verification status
- [ ] `/vendor/disputes` - Manage disputes

### Admin Dashboard
- [ ] `/admin/vendors/verification` - Review verification requests
- [ ] `/admin/disputes` - Mediate and resolve disputes

### Customer Pages
- [ ] `/orders/{id}/dispute` - File a dispute
- [ ] `/disputes` - View all disputes
- [ ] `/disputes/{id}` - Dispute detail with messaging

---

## Testing

Run tests with:
```bash
npm test
```

### Manual Testing

1. **Data Export:**
   ```bash
   # Request export
   curl -X POST https://yourdomain.com/api/user/data-export \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"format":"json"}'
   
   # Process exports (cron)
   curl -X POST https://yourdomain.com/api/cron/process-data-exports \
     -H "Authorization: Bearer $CRON_SECRET"
   
   # Download
   curl https://yourdomain.com/api/user/data-export/download?requestId=$ID \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Account Deletion:**
   ```bash
   curl -X DELETE https://yourdomain.com/api/user/account \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"password":"mypassword","confirmation":"DELETE MY ACCOUNT"}'
   ```

3. **Vendor Verification:**
   ```bash
   # Submit
   curl -X POST https://yourdomain.com/api/vendors/verification \
     -H "Authorization: Bearer $VENDOR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"tradeLicenseUrl":"https://...","tradeLicenseNumber":"TL-123",...}'
   
   # Admin approve
   curl -X PATCH https://yourdomain.com/api/admin/vendors/verification/$ID \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status":"approved"}'
   ```

4. **Disputes:**
   ```bash
   # File dispute
   curl -X POST https://yourdomain.com/api/disputes \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"orderId":"...","type":"not_as_described","description":"..."}'
   
   # Send message
   curl -X POST https://yourdomain.com/api/disputes/$ID/messages \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message":"I will send a replacement"}'
   
   # Admin resolve
   curl -X PATCH https://yourdomain.com/api/admin/disputes/$ID \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status":"resolved","resolution":"Full refund approved","refundAmount":500}'
   ```

---

## Production Deployment Checklist

- [ ] Set `CRON_SECRET` environment variable
- [ ] Configure cron jobs or serverless functions:
  - [ ] `/api/cron/process-data-exports` every 10-15 minutes
  - [ ] `/api/cron/escalate-disputes` every 6-12 hours
- [ ] Set up S3 bucket for data export files (replace base64 data URLs)
- [ ] Configure email service for notifications
- [ ] Update privacy policy with data export/deletion procedures
- [ ] Add frontend pages for all features
- [ ] Test all endpoints with real data
- [ ] Monitor cron job execution and error rates

---

## Future Enhancements

1. **Data Export:**
   - Store exports in S3 instead of base64 data URLs
   - Support additional formats (XML, PDF)
   - Include more granular data filtering
   - Add export scheduling

2. **Vendor Verification:**
   - OCR verification for document authenticity
   - Integration with Ethiopian government APIs
   - Automated verification checks
   - Periodic re-verification reminders

3. **Disputes:**
   - More sophisticated resolution workflows
   - Integration with payment providers for automatic refunds
   - Dispute analytics and reporting
   - Multi-party disputes (multiple vendors)
   - Video evidence support

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2024  
**Authors:** Minalesh Development Team
