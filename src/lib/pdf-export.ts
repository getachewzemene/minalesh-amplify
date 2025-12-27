import jsPDF from 'jspdf';

/**
 * Export data to PDF format
 * Converts user data to a formatted PDF document
 */

interface UserData {
  email?: string;
  role?: string;
  createdAt?: Date | string;
}

interface ProfileData {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface OrderData {
  id: string;
  orderNumber?: string;
  totalAmount?: number;
  status?: string;
}

interface ReviewData {
  rating?: number;
}

interface WishlistData {
  product?: {
    name?: string;
    price?: number;
  };
}

interface LoyaltyAccountData {
  points?: number;
  tier?: string;
  transactions?: any[];
}

interface AddressData {
  label?: string;
  street?: string;
  city?: string;
  country?: string;
}

export interface ExportData {
  user: UserData | null;
  profile: ProfileData | null;
  orders?: OrderData[];
  reviews?: ReviewData[];
  addresses?: AddressData[];
  wishlists?: WishlistData[];
  preferences?: any;
  notificationPreferences?: any;
  loyaltyAccount?: LoyaltyAccountData | null;
}

export async function generatePDFExport(data: ExportData): Promise<Buffer> {
  const doc = new jsPDF();
  let yPosition = 20;
  const lineHeight = 7;
  const pageHeight = doc.internal.pageSize.height;

  // Helper function to add a line of text
  const addLine = (text: string, isBold = false) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    }
    doc.text(text, 10, yPosition);
    if (isBold) {
      doc.setFont('helvetica', 'normal');
    }
    yPosition += lineHeight;
  };

  // Title
  doc.setFontSize(20);
  addLine('User Data Export', true);
  doc.setFontSize(12);
  yPosition += 5;

  // User Information
  addLine('User Information', true);
  addLine(`Email: ${data.user?.email || 'N/A'}`);
  addLine(`Role: ${data.user?.role || 'N/A'}`);
  addLine(`Account Created: ${data.user?.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : 'N/A'}`);
  yPosition += 5;

  // Profile Information
  if (data.profile) {
    addLine('Profile Information', true);
    addLine(`Display Name: ${data.profile.displayName || 'N/A'}`);
    addLine(`First Name: ${data.profile.firstName || 'N/A'}`);
    addLine(`Last Name: ${data.profile.lastName || 'N/A'}`);
    addLine(`Phone: ${data.profile.phone || 'N/A'}`);
    yPosition += 5;
  }

  // Orders Summary
  if (data.orders && data.orders.length > 0) {
    addLine('Orders Summary', true);
    addLine(`Total Orders: ${data.orders.length}`);
    const totalSpent = data.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    addLine(`Total Amount Spent: $${totalSpent.toFixed(2)}`);
    yPosition += 5;

    addLine('Recent Orders:', true);
    data.orders.slice(0, 5).forEach((order, index) => {
      addLine(`${index + 1}. Order #${order.orderNumber || order.id.substring(0, 8)} - $${order.totalAmount || 0} - ${order.status}`);
    });
    yPosition += 5;
  }

  // Reviews
  if (data.reviews && data.reviews.length > 0) {
    addLine('Reviews Summary', true);
    addLine(`Total Reviews: ${data.reviews.length}`);
    const avgRating = data.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / data.reviews.length;
    addLine(`Average Rating Given: ${avgRating.toFixed(1)} / 5`);
    yPosition += 5;
  }

  // Wishlist
  if (data.wishlists && data.wishlists.length > 0) {
    addLine('Wishlist', true);
    addLine(`Items in Wishlist: ${data.wishlists.length}`);
    yPosition += 5;
  }

  // Loyalty Account
  if (data.loyaltyAccount) {
    addLine('Loyalty Account', true);
    addLine(`Points: ${data.loyaltyAccount.points || 0}`);
    addLine(`Tier: ${data.loyaltyAccount.tier || 'None'}`);
    yPosition += 5;
  }

  // Addresses
  if (data.addresses && data.addresses.length > 0) {
    addLine('Saved Addresses', true);
    data.addresses.forEach((address: any, index: number) => {
      addLine(`${index + 1}. ${address.label || 'Address'}: ${address.street || ''}, ${address.city || ''}, ${address.country || ''}`);
    });
    yPosition += 5;
  }

  // Footer
  doc.setFontSize(10);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      10,
      doc.internal.pageSize.height - 10
    );
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

/**
 * Export specific categories of data to PDF
 */
export async function generateCategoryPDFExport(data: ExportData, categories: string[]): Promise<Buffer> {
  const filteredData: ExportData = {
    user: data.user,
    profile: data.profile,
  };

  // Include only selected categories
  if (categories.includes('orders') && data.orders) {
    filteredData.orders = data.orders;
  }
  if (categories.includes('reviews') && data.reviews) {
    filteredData.reviews = data.reviews;
  }
  if (categories.includes('addresses') && data.addresses) {
    filteredData.addresses = data.addresses;
  }
  if (categories.includes('wishlists') && data.wishlists) {
    filteredData.wishlists = data.wishlists;
  }
  if (categories.includes('preferences') && data.preferences) {
    filteredData.preferences = data.preferences;
  }
  if (categories.includes('loyalty') && data.loyaltyAccount) {
    filteredData.loyaltyAccount = data.loyaltyAccount;
  }

  return generatePDFExport(filteredData);
}
