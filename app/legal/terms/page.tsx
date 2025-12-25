import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Minalesh Marketplace',
  description: 'Terms of Service and User Agreement for Minalesh Ethiopian Marketplace',
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose prose-slate max-w-none">
        <p className="text-sm text-muted-foreground mb-6">
          Last Updated: December 24, 2024
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            Welcome to Minalesh, Ethiopia's intelligent marketplace. By accessing or using our platform, 
            you agree to be bound by these Terms of Service and all applicable laws and regulations. 
            If you do not agree with any of these terms, you are prohibited from using this site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
          <h3 className="text-xl font-semibold mb-3">2.1 Account Registration</h3>
          <p className="mb-4">
            To access certain features of Minalesh, you must register for an account. You agree to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information to keep it accurate</li>
            <li>Maintain the security of your password</li>
            <li>Accept all risks of unauthorized access to your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.2 Account Types</h3>
          <p className="mb-4">
            Minalesh offers three account types:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Customer Account:</strong> For buyers purchasing products</li>
            <li><strong>Vendor Account:</strong> For sellers listing and selling products (requires verification)</li>
            <li><strong>Admin Account:</strong> For platform administrators</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Vendor Terms</h2>
          <h3 className="text-xl font-semibold mb-3">3.1 Vendor Verification</h3>
          <p className="mb-4">
            To become a vendor on Minalesh, you must:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide a valid Ethiopian Trade License</li>
            <li>Provide a valid Tax Identification Number (TIN)</li>
            <li>Complete identity verification</li>
            <li>Agree to our Vendor Agreement and Commission Structure</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.2 Product Listings</h3>
          <p className="mb-4">
            Vendors agree to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate product descriptions and images</li>
            <li>Set fair and competitive prices in Ethiopian Birr (ETB)</li>
            <li>Maintain adequate stock levels</li>
            <li>Honor all sales and commitments</li>
            <li>Comply with Ethiopian consumer protection laws</li>
            <li>Not list prohibited, counterfeit, or illegal items</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.3 Commission and Fees</h3>
          <p className="mb-4">
            Minalesh charges a commission on each sale. Commission rates vary by category and are 
            disclosed during vendor registration. Payment processing fees may also apply.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Buyer Terms</h2>
          <h3 className="text-xl font-semibold mb-3">4.1 Purchasing</h3>
          <p className="mb-4">
            When making a purchase, you agree to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate shipping and billing information</li>
            <li>Pay all charges in Ethiopian Birr (ETB)</li>
            <li>Accept responsibility for items purchased under your account</li>
            <li>Review product details carefully before purchase</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.2 Payment</h3>
          <p className="mb-4">
            Minalesh accepts various payment methods including credit cards, TeleBirr, CBE Birr, 
            and other Ethiopian payment providers. All prices include 15% Ethiopian VAT unless 
            otherwise stated.
          </p>

          <h3 className="text-xl font-semibold mb-3">4.3 Returns and Refunds</h3>
          <p className="mb-4">
            Returns and refunds are subject to our Return Policy. Generally:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Items can be returned within 7 days of delivery</li>
            <li>Items must be unused and in original packaging</li>
            <li>Refunds are processed to the original payment method</li>
            <li>Shipping costs may not be refundable</li>
            <li>Some items may not be eligible for return (perishables, custom items, etc.)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Prohibited Activities</h2>
          <p className="mb-4">
            You may not:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Violate any Ethiopian laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Sell counterfeit or prohibited items</li>
            <li>Engage in fraudulent activities</li>
            <li>Manipulate prices or reviews</li>
            <li>Harass other users or vendors</li>
            <li>Attempt to bypass security measures</li>
            <li>Use automated systems to access the platform (bots, scrapers)</li>
            <li>Share account credentials</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
          <p className="mb-4">
            The Minalesh platform, including its design, features, and content, is owned by Minalesh 
            and protected by Ethiopian and international intellectual property laws. Vendors retain 
            ownership of their product images and descriptions but grant Minalesh a license to display them.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Shipping and Delivery</h2>
          <p className="mb-4">
            Shipping is handled by our logistics partners and vendors. Delivery times vary by location:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Addis Ababa:</strong> 1-3 business days</li>
            <li><strong>Major Cities:</strong> 3-7 business days</li>
            <li><strong>Regional Areas:</strong> 5-10 business days</li>
          </ul>
          <p className="mb-4">
            Shipping costs are calculated based on weight, dimensions, and destination. Free shipping 
            may be available for orders exceeding certain thresholds.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
          <p className="mb-4">
            Your privacy is important to us. Please review our Privacy Policy to understand how we 
            collect, use, and protect your personal information. We comply with Ethiopian data 
            protection regulations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Dispute Resolution</h2>
          <p className="mb-4">
            In case of disputes between buyers and vendors, Minalesh may mediate to reach a fair 
            resolution. For unresolved disputes, Ethiopian law shall govern and disputes shall be 
            resolved in Ethiopian courts.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
          <p className="mb-4">
            Minalesh acts as a marketplace platform connecting buyers and vendors. We are not 
            responsible for:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Quality, safety, or legality of products listed</li>
            <li>Accuracy of product descriptions or vendor information</li>
            <li>Ability of vendors to complete sales</li>
            <li>Shipping delays or damages (handled by logistics partners)</li>
            <li>Unauthorized access to your account</li>
          </ul>
          <p className="mb-4">
            To the maximum extent permitted by Ethiopian law, Minalesh's total liability shall not 
            exceed the transaction value or 1,000 ETB, whichever is less.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
          <p className="mb-4">
            We reserve the right to suspend or terminate accounts that violate these terms, engage 
            in fraudulent activities, or pose a risk to the platform or other users. You may also 
            terminate your account at any time by contacting support.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
          <p className="mb-4">
            We may update these Terms of Service from time to time. We will notify users of 
            significant changes via email or platform notifications. Continued use after changes 
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
          <p className="mb-4">
            For questions about these Terms of Service, please contact us:
          </p>
          <ul className="list-none mb-4">
            <li><strong>Email:</strong> legal@minalesh.et</li>
            <li><strong>Address:</strong> Addis Ababa, Ethiopia</li>
            <li><strong>Phone:</strong> +251-XXX-XXXX</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
          <p className="mb-4">
            These Terms of Service are governed by the laws of the Federal Democratic Republic of 
            Ethiopia. Any disputes arising from these terms shall be subject to the exclusive 
            jurisdiction of Ethiopian courts.
          </p>
        </section>

        <div className="mt-12 p-4 bg-muted rounded-lg">
          <p className="text-sm">
            By using Minalesh, you acknowledge that you have read, understood, and agree to be 
            bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}
