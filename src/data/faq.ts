/**
 * FAQ Data for Minalesh Marketplace
 * 
 * Centralized FAQ content used for both display and SEO structured data.
 */

export interface FAQQuestion {
  question: string
  answer: string
}

export interface FAQCategory {
  title: string
  questions: FAQQuestion[]
}

export const faqCategories: Record<string, FAQCategory> = {
  general: {
    title: 'General',
    questions: [
      {
        question: 'What is Minalesh?',
        answer: 'Minalesh is Ethiopia\'s intelligent e-commerce marketplace connecting buyers and sellers across the country. We offer a wide range of products from traditional Ethiopian goods to modern electronics, all priced in Ethiopian Birr (ETB).',
      },
      {
        question: 'How do I create an account?',
        answer: 'Click on "Sign Up" in the top navigation, fill in your details (email, password, name), and verify your email address. You can choose between a customer account (for buying) or a vendor account (for selling).',
      },
      {
        question: 'Is Minalesh available throughout Ethiopia?',
        answer: 'Yes! We deliver to Addis Ababa, all major cities (Dire Dawa, Bahir Dar, Gondar, Mekelle, etc.), and regional areas. Shipping times and costs vary by location.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept credit/debit cards (Visa, Mastercard), TeleBirr, CBE Birr, Awash Bank payments, and other Ethiopian payment providers. All payments are secure and encrypted.',
      },
    ],
  },
  buying: {
    title: 'Buying & Orders',
    questions: [
      {
        question: 'How do I place an order?',
        answer: 'Browse products, add items to your cart, proceed to checkout, enter shipping information, select payment method, and confirm your order. You\'ll receive an order confirmation email immediately.',
      },
      {
        question: 'Can I track my order?',
        answer: 'Yes! After your order ships, you\'ll receive a tracking number. You can view order status in your account under "My Orders" or click the tracking link in your shipping confirmation email.',
      },
      {
        question: 'What are the shipping costs?',
        answer: 'Shipping costs vary by location and weight:\n- Addis Ababa: 50 ETB (standard), 100 ETB (express)\n- Major Cities: 100 ETB (standard), 200 ETB (express)\n- Regional Areas: 150 ETB (standard)\nFree shipping is available on orders above certain thresholds.',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Delivery times depend on your location:\n- Addis Ababa: 1-3 business days\n- Major Cities: 3-7 business days\n- Regional Areas: 5-10 business days\nExpress delivery is faster where available.',
      },
      {
        question: 'Can I cancel my order?',
        answer: 'You can cancel orders before they are shipped. Once shipped, you\'ll need to request a return. Contact customer support or use the "Cancel Order" option in your account.',
      },
      {
        question: 'Do you offer Cash on Delivery (COD)?',
        answer: 'Cash on Delivery availability depends on the vendor and your location. Check the payment options during checkout to see if COD is available for your order.',
      },
    ],
  },
  returns: {
    title: 'Returns & Refunds',
    questions: [
      {
        question: 'What is your return policy?',
        answer: 'Items can be returned within 7 days of delivery if unused and in original packaging. Some items (perishables, custom products, intimate items) are not eligible for return. Check product pages for specific return eligibility.',
      },
      {
        question: 'How do I return an item?',
        answer: 'Go to "My Orders," select the order, click "Request Return," provide a reason, and follow instructions. You may need to ship the item back. Approved returns receive refunds to the original payment method.',
      },
      {
        question: 'How long do refunds take?',
        answer: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. The time for funds to appear in your account depends on your payment provider (typically 3-10 business days).',
      },
      {
        question: 'What if I receive a damaged or wrong item?',
        answer: 'Contact us immediately with photos of the damaged item or wrong product. We\'ll arrange a free return pickup and provide a full refund or replacement. This must be reported within 48 hours of delivery.',
      },
    ],
  },
  selling: {
    title: 'Selling on Minalesh',
    questions: [
      {
        question: 'How do I become a vendor?',
        answer: 'Register for a vendor account, provide your Ethiopian Trade License and Tax Identification Number (TIN), complete identity verification, and wait for approval (typically 1-3 business days).',
      },
      {
        question: 'What are the selling fees?',
        answer: 'Minalesh charges a commission on each sale (rates vary by category, typically 5-15%). Payment processing fees may also apply. There are no upfront or monthly fees to list products.',
      },
      {
        question: 'How do I list products?',
        answer: 'After vendor approval, go to your vendor dashboard, click "Add Product," fill in details (name, description, price, category, images), set stock quantity, and publish. Your products will be visible to buyers immediately.',
      },
      {
        question: 'When do I get paid?',
        answer: 'Payments are processed after the order is delivered and the return period expires (typically 7 days). Funds are transferred to your registered bank account on a weekly or bi-weekly basis.',
      },
      {
        question: 'Can I offer discounts or promotions?',
        answer: 'Yes! Vendors can create discount coupons, run flash sales, and participate in platform-wide promotions. You can manage all pricing and promotions from your vendor dashboard.',
      },
      {
        question: 'What categories can I sell in?',
        answer: 'We support numerous categories including Ethiopian traditional items (coffee, spices, clothing), electronics, home goods, fashion, agriculture products, and more. Check the category list during product creation.',
      },
    ],
  },
  account: {
    title: 'Account & Security',
    questions: [
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to your inbox. The link expires after 1 hour for security.',
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Yes! We use industry-standard encryption (HTTPS/TLS) and PCI-DSS compliant payment processors. We never store your full credit card details on our servers.',
      },
      {
        question: 'How do I update my shipping address?',
        answer: 'Go to "My Account" > "Addresses," where you can add, edit, or delete shipping addresses. You can also add a new address during checkout.',
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, contact support at support@minalesh.et to request account deletion. Note that some data may be retained for legal compliance (order history, tax records) even after account deletion.',
      },
      {
        question: 'How do I unsubscribe from emails?',
        answer: 'Click the "Unsubscribe" link at the bottom of any marketing email, or manage your email preferences in "Account Settings" > "Notifications." Note: You\'ll still receive transactional emails (order confirmations, shipping updates).',
      },
    ],
  },
  technical: {
    title: 'Technical Support',
    questions: [
      {
        question: 'Which browsers are supported?',
        answer: 'Minalesh works best on modern browsers: Chrome, Firefox, Safari, and Edge (latest versions). We also support mobile browsers on iOS and Android devices.',
      },
      {
        question: 'Is there a mobile app?',
        answer: 'Our website is fully mobile-responsive and works great on phones and tablets. A dedicated mobile app may be released in the future.',
      },
      {
        question: 'Why can\'t I add items to my cart?',
        answer: 'This usually happens if the item is out of stock or your cart session expired. Try refreshing the page or clearing your browser cache. If the problem persists, contact support.',
      },
      {
        question: 'I\'m having trouble uploading product images',
        answer: 'Ensure images are in JPG, PNG, or WebP format and under 5MB each. Images are automatically optimized. If you continue having issues, check your internet connection or try a different browser.',
      },
    ],
  },
}

/**
 * Get all FAQ questions as a flat array for structured data
 */
export function getAllFAQQuestions(): FAQQuestion[] {
  return Object.values(faqCategories).flatMap(category => category.questions)
}

/**
 * Get category keys
 */
export function getFAQCategoryKeys(): string[] {
  return Object.keys(faqCategories)
}
