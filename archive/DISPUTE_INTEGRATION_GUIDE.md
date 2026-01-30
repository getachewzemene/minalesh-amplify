# Integration Guide for Dispute Resolution

## Adding "File Dispute" Button to Orders Page

To enable customers to file disputes from their order details, add the following integration to the Orders page.

### Option 1: Add to Orders List Page

In `src/page-components/Orders.tsx`, add a "File Dispute" button to each order card:

```tsx
import { DisputeForm } from '@/components/disputes/DisputeForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

// In the order card rendering, add:
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm">
      <AlertCircle className="h-4 w-4 mr-2" />
      File Dispute
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DisputeForm
      orderId={order.id}
      orderNumber={order.orderNumber}
      onSuccess={() => {
        // Close dialog and refresh
        window.location.href = '/disputes';
      }}
    />
  </DialogContent>
</Dialog>
```

### Option 2: Add Link to Disputes

Simply add a link to the disputes page:

```tsx
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

<Link href="/disputes">
  <Button variant="ghost" size="sm">
    <MessageSquare className="h-4 w-4 mr-2" />
    My Disputes
  </Button>
</Link>
```

### Conditions for Showing "File Dispute" Button

Only show the button if:
1. Order is delivered (or past expected delivery date)
2. Within 30 days of delivery
3. No active dispute exists for this order

```tsx
const canFileDispute = (order: Order) => {
  // Check if delivered
  if (!order.deliveredAt && order.status !== 'delivered') {
    return false;
  }
  
  // Check if within 30 days
  const deliveryDate = order.deliveredAt || new Date();
  const daysSince = Math.floor((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince > 30) {
    return false;
  }
  
  // Check if no active dispute (this requires fetching disputes)
  // For simplicity, show button and handle error on submission
  return true;
};
```

## Adding Link to Navigation

### Add to Navbar for Logged-in Users

In `src/components/navbar.tsx`, add a link to disputes:

```tsx
// In the user menu or main navigation
{user && (
  <Link href="/disputes">
    <Button variant="ghost" className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4" />
      <span>Disputes</span>
    </Button>
  </Link>
)}
```

### Add to User Dashboard

In the dashboard sidebar or quick links:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Support</CardTitle>
  </CardHeader>
  <CardContent>
    <Link href="/disputes">
      <Button variant="outline" className="w-full">
        <AlertCircle className="h-4 w-4 mr-2" />
        My Disputes
      </Button>
    </Link>
  </CardContent>
</Card>
```

## Vendor Integration

### Add to Vendor Dashboard

In `src/page-components/VendorAdvancedDashboard.tsx` or vendor-specific pages:

```tsx
<Link href="/disputes">
  <Card className="hover:shadow-md transition-shadow cursor-pointer">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Disputes</h3>
          <p className="text-sm text-muted-foreground">Manage customer disputes</p>
        </div>
        <AlertCircle className="h-8 w-8 text-orange-500" />
      </div>
    </CardContent>
  </Card>
</Link>
```

## Adding Notifications

### Email Notifications (To Be Implemented)

When a dispute is created, the backend should send emails to:
- Customer (confirmation)
- Vendor (notification)
- Admin (if escalated)

Example notification points in the API routes:

```typescript
// In /api/disputes/route.ts after creating dispute
await sendEmail({
  to: vendor.user.email,
  subject: 'New Dispute Filed',
  template: 'vendor-dispute-notification',
  data: { dispute, order }
});

// In /api/disputes/[id]/messages/route.ts after message
await sendEmail({
  to: recipientEmail,
  subject: 'New Message in Your Dispute',
  template: 'dispute-message-notification',
  data: { dispute, message }
});
```

### In-App Notifications

Display a badge count of active disputes:

```tsx
// Fetch active disputes count
const [disputeCount, setDisputeCount] = useState(0);

useEffect(() => {
  const fetchDisputeCount = async () => {
    const res = await fetch('/api/disputes?status=open');
    const data = await res.json();
    setDisputeCount(data.disputes.length);
  };
  fetchDisputeCount();
}, []);

// Display in navigation
<Link href="/disputes" className="relative">
  <AlertCircle className="h-5 w-5" />
  {disputeCount > 0 && (
    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
      {disputeCount}
    </Badge>
  )}
</Link>
```

## Mobile Responsiveness

All dispute components are mobile-responsive with:
- Stacked layouts on small screens
- Touch-friendly buttons and inputs
- Scrollable message containers
- Responsive text sizing

Test on:
- Mobile (< 640px)
- Tablet (640px - 1024px)
- Desktop (> 1024px)

## Accessibility Features

- Proper ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance
- Focus indicators

## Security Considerations

1. **Authorization**: All API routes check user permissions
2. **Validation**: Form inputs are validated on both client and server
3. **XSS Prevention**: All user input is escaped
4. **CSRF Protection**: Built into Next.js
5. **Rate Limiting**: Consider adding to prevent spam disputes

## Performance Optimization

1. **Lazy Loading**: Components are code-split
2. **Polling Optimization**: Messages poll every 10s (configurable)
3. **Pagination**: Support for large dispute lists
4. **Caching**: Consider adding React Query for better caching
5. **Optimistic Updates**: UI updates before API response

## Example: Complete Integration in Orders Page

```tsx
// In src/page-components/Orders.tsx

import { useState } from 'react';
import { DisputeForm } from '@/components/disputes/DisputeForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

// Add state for dialog
const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

// In the order card JSX
{order.status === 'delivered' && (
  <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
    <DialogTrigger asChild>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSelectedOrder(order)}
      >
        <AlertCircle className="h-4 w-4 mr-2" />
        File Dispute
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      {selectedOrder && (
        <DisputeForm
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.orderNumber}
          onSuccess={() => {
            setDisputeDialogOpen(false);
            router.push('/disputes');
          }}
          onCancel={() => setDisputeDialogOpen(false)}
        />
      )}
    </DialogContent>
  </Dialog>
)}
```

## Testing the Integration

1. **Test Dispute Filing**:
   ```bash
   # As a customer
   1. Navigate to orders
   2. Click "File Dispute" on a delivered order
   3. Fill form and submit
   4. Verify redirect to disputes list
   5. Check dispute appears with correct status
   ```

2. **Test Messaging**:
   ```bash
   # As vendor
   1. Navigate to disputes
   2. Click on pending dispute
   3. Send message
   4. Verify message appears
   5. Test as customer - verify message received
   ```

3. **Test Admin Resolution**:
   ```bash
   # As admin
   1. Navigate to Admin Dashboard > Disputes
   2. Click "Resolve" on a dispute
   3. Enter resolution details
   4. Submit
   5. Verify dispute status updated
   6. Check all parties can see resolution
   ```

## Conclusion

With these integration points, the dispute resolution system will be fully functional and accessible throughout the application. The modular design allows for easy integration into existing pages without major refactoring.
