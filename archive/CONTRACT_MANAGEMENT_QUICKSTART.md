# Vendor Contract Management - Quick Start Guide

## Overview
The Vendor Contract Management system has been successfully implemented. This guide provides quick instructions for getting started.

## Database Migration

Run the Prisma migration to create the new database tables:

```bash
# Generate migration
npx prisma migrate dev --name add_vendor_contract_management

# Generate Prisma client
npx prisma generate
```

## Seed Contract Templates

Load the pre-built contract templates:

```bash
npx tsx prisma/seeds/contract-templates.ts
```

This creates three templates:
- Standard Vendor Agreement (15% commission)
- Premium Vendor Agreement (reduced commission, enhanced benefits)
- Enterprise Vendor Agreement (custom terms, SLA)

## Setup Cron Job

Add this cron job to your scheduler (Vercel Cron, cron-job.org, or system crontab):

```bash
# Daily at midnight UTC
0 0 * * * curl -X GET https://yourdomain.com/api/cron/process-contract-renewals \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

Or configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-contract-renewals",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## Environment Variables

Ensure these are set:

```bash
# Required for cron authentication
CRON_SECRET=your-cron-secret-key

# Optional: For PDF storage
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## API Usage Examples

### Create a Contract (Vendor)

```bash
curl -X POST https://yourdomain.com/api/vendors/contracts \
  -H "Authorization: Bearer ${VENDOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "template-uuid",
    "contractType": "standard",
    "startDate": "2026-02-01T00:00:00Z",
    "endDate": "2027-02-01T00:00:00Z",
    "autoRenew": true,
    "renewalPeriodMonths": 12
  }'
```

### Sign a Contract

```bash
curl -X PUT https://yourdomain.com/api/vendors/contracts/{contractId}/sign \
  -H "Authorization: Bearer ${VENDOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "signatureData": "base64-encoded-signature",
    "accept": true
  }'
```

### List Vendor Contracts

```bash
curl -X GET "https://yourdomain.com/api/vendors/contracts?status=active&page=1&perPage=20" \
  -H "Authorization: Bearer ${VENDOR_TOKEN}"
```

### Admin: Create Template

```bash
curl -X POST https://yourdomain.com/api/admin/contract-templates \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Vendor Agreement",
    "contractType": "custom",
    "content": "<h1>CUSTOM AGREEMENT</h1><p>Terms: {{vendorName}}...</p>",
    "variables": {
      "vendorName": "Vendor business name"
    }
  }'
```

### Admin: List All Contracts

```bash
curl -X GET "https://yourdomain.com/api/admin/contracts?status=active&page=1" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

## Contract Workflow

### Standard Flow
1. **Vendor creates contract** from template → Status: `draft`
2. **Vendor signs** → Status: `pending_signature`
3. **Admin signs** → Status: `active`
4. **Auto-renewal** (if enabled) → New version created with status: `pending_signature`

### Termination Flow
1. Vendor or admin calls terminate endpoint
2. Provides termination reason
3. Contract status → `terminated`

### Renewal Flow
1. **Automatic**: Cron job runs daily, finds contracts due for renewal (30 days before expiry)
2. **Manual**: Vendor or admin calls renew endpoint
3. New contract version created with incremented version number
4. Old contract status → `renewed`

## Template Variables

Available variables for contract templates:

- `{{contractNumber}}` - Auto-generated contract number
- `{{vendorName}}` - Vendor business name
- `{{vendorEmail}}` - Vendor email
- `{{tradeLicense}}` - Trade license number
- `{{tinNumber}}` - TIN number
- `{{startDate}}` - Contract start date (formatted)
- `{{endDate}}` - Contract end date (formatted)
- `{{commissionRate}}` - Commission percentage
- `{{renewalPeriod}}` - Renewal period in months
- `{{currentDate}}` - Current date (formatted)

## Contract Statuses

- `draft` - Created but not signed
- `pending_signature` - Waiting for admin signature
- `active` - Fully signed and in effect
- `expired` - Past end date
- `terminated` - Manually terminated
- `renewed` - Superseded by new version

## Frontend Integration

The API is ready for frontend integration. Consider creating:

1. **Vendor Dashboard Page** (`/vendor/contracts`)
   - List contracts with status badges
   - View contract details
   - Sign contracts with e-signature pad
   - Request renewal

2. **Admin Contract Management** (`/admin/contracts`)
   - View all vendor contracts
   - Review and sign pending contracts
   - Manage templates
   - Terminate contracts if needed

3. **Contract Viewer** (`/contracts/{id}`)
   - Display contract content
   - Show signature status
   - Version history timeline
   - Download PDF (when implemented)

## Next Steps

### Immediate
- Run database migration
- Seed contract templates
- Set up cron job

### Optional Enhancements
- PDF generation from contract content
- Email notifications for signatures/renewals
- Contract amendment workflow
- Advanced analytics dashboard
- Bulk contract operations
- Digital signature verification

## Support

For issues or questions:
- See: VENDOR_CONTRACT_MANAGEMENT_IMPLEMENTATION.md
- API Documentation: /api-docs (Swagger)
- GitHub Issues: Create an issue with tag `contracts`

## Security Notes

- All endpoints require authentication
- Contracts are scoped to vendor ownership
- Admin approval required for activation
- Audit trail maintained for all actions
- IP and user agent logged for signatures
- CRON_SECRET required for background jobs
