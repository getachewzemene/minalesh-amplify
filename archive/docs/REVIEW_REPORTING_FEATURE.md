# Review Reporting Feature

## Overview
This feature allows users to report problematic reviews. When a review is rated poorly (≤2 stars) and receives multiple reports (≥3 reports), the system automatically takes action to protect marketplace quality.

## Implementation Details

### Database Changes
Added two new fields to the `Review` model:
- `reportCount` (Int): Tracks the number of times a review has been reported
- `reportedBy` (Json): Array of user IDs who reported the review

Migration file: `prisma/migrations/20251123_add_review_reporting_fields/migration.sql`

### API Endpoint
**POST** `/api/reviews/[reviewId]/report`

**Request Body:**
```json
{
  "reason": "Explanation for reporting the review"
}
```

**Response (no action taken):**
```json
{
  "message": "Review reported successfully",
  "review": { /* updated review object */ },
  "actionTaken": false
}
```

**Response (action taken):**
```json
{
  "message": "Review reported successfully. Vendor has been suspended and product has been deactivated due to multiple reports on a bad review.",
  "review": { /* updated review object */ },
  "actionTaken": true,
  "suspensionMessage": "Your vendor account has been suspended..."
}
```

### Business Logic

#### Thresholds
- **Bad Review Threshold**: Reviews with rating ≤ 2 stars
- **Report Threshold**: 3 or more reports needed

#### Automatic Actions
When a review meets both criteria (bad review AND enough reports):

1. **Vendor Suspension**: The vendor's status is changed to `suspended`
2. **Product Deactivation**: The product's `isActive` flag is set to `false`
3. **Notification**: A detailed notification is sent to the vendor explaining:
   - Number of reports received
   - Review rating
   - Product affected
   - Reason cited in the report
   - Instructions to contact support

### UI Components

#### Report Button
- Located in the dropdown menu (three dots) on each review
- Only visible to logged-in users
- Opens a dialog to submit report reason

#### Report Dialog
- Text area for describing why the review is being reported
- Submit and Cancel buttons
- Shows appropriate toast notifications based on outcome

### Protection Against Abuse
- Users can only report a review once (checked by user ID in `reportedBy` array)
- Requires authentication to report
- Requires a written reason for reporting

### Example Suspension Message
```
Your vendor account has been suspended due to multiple reports (3) on a 
low-rated review (1 stars) for product "Ray-Ban Aviator Classic Sunglasses". 
The review received reports citing: "Inappropriate content". This action 
was taken to maintain the quality and integrity of our marketplace. Please 
contact support to appeal this decision.
```

## Testing
Comprehensive test suite in `src/__tests__/review-reporting.test.ts` covers:
- User reporting functionality
- Duplicate report prevention
- Threshold validation
- Vendor suspension logic
- Product deactivation
- Notification creation
- Edge cases (good reviews with reports, bad reviews without enough reports)

## Usage

### As a User
1. Browse to a product page
2. Scroll to reviews section
3. Click the three-dot menu on a problematic review
4. Select "Report Review"
5. Enter reason and submit

### As an Administrator
Monitor notifications and review reports to:
- Track patterns of abuse
- Review vendor suspensions
- Handle appeals through support system

## Future Enhancements
- Admin dashboard for managing reported reviews
- Appeal process for suspended vendors
- Configurable thresholds per category
- Email notifications to vendors
- Review moderation queue
- Automated content analysis for offensive language
