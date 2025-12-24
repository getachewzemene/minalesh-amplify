import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Minalesh Marketplace',
  description: 'Privacy Policy and Data Protection practices for Minalesh Ethiopian Marketplace',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose prose-slate max-w-none">
        <p className="text-sm text-muted-foreground mb-6">
          Last Updated: December 24, 2024
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            Minalesh ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
            explains how we collect, use, disclose, and safeguard your information when you use our 
            e-commerce marketplace platform. We comply with Ethiopian data protection regulations and 
            international best practices.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-3">2.1 Personal Information</h3>
          <p className="mb-4">
            When you register or use our services, we may collect:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
            <li><strong>Profile Information:</strong> Profile picture, preferences, communication preferences</li>
            <li><strong>Shipping Information:</strong> Delivery addresses, contact details</li>
            <li><strong>Payment Information:</strong> Payment method details (processed by secure payment providers)</li>
            <li><strong>Vendor Information:</strong> Trade License, TIN, business name, bank account details</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.2 Transaction Information</h3>
          <p className="mb-4">
            We collect information about your purchases and sales:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Order history and details</li>
            <li>Cart contents and wishlists</li>
            <li>Product reviews and ratings</li>
            <li>Questions and answers about products</li>
            <li>Customer service communications</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.3 Technical Information</h3>
          <p className="mb-4">
            We automatically collect technical data:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>IP address and device information</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Access times and pages visited</li>
            <li>Referring website addresses</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.4 Location Information</h3>
          <p className="mb-4">
            We may collect location data to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Calculate shipping costs and delivery times</li>
            <li>Show relevant local products and vendors</li>
            <li>Detect and prevent fraud</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">
            We use your information to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Provide Services:</strong> Process orders, manage accounts, facilitate transactions</li>
            <li><strong>Communicate:</strong> Send order confirmations, shipping updates, customer support</li>
            <li><strong>Personalize:</strong> Recommend products, customize your experience</li>
            <li><strong>Improve:</strong> Analyze usage patterns, enhance platform features</li>
            <li><strong>Secure:</strong> Detect fraud, prevent abuse, ensure platform security</li>
            <li><strong>Comply:</strong> Meet legal obligations, enforce terms of service</li>
            <li><strong>Market:</strong> Send promotional emails (with your consent)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
          
          <h3 className="text-xl font-semibold mb-3">4.1 With Vendors</h3>
          <p className="mb-4">
            When you purchase products, we share necessary information with vendors including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your name and shipping address</li>
            <li>Contact information for delivery</li>
            <li>Order details</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.2 With Service Providers</h3>
          <p className="mb-4">
            We share information with trusted third parties who help us operate:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Payment Processors:</strong> Stripe, TeleBirr, CBE Birr (for payment processing)</li>
            <li><strong>Shipping Partners:</strong> Logistics companies for delivery</li>
            <li><strong>Email Services:</strong> Resend (for transactional emails)</li>
            <li><strong>Cloud Storage:</strong> AWS S3 (for image hosting)</li>
            <li><strong>Analytics:</strong> To understand platform usage</li>
            <li><strong>Error Tracking:</strong> Sentry (for monitoring and debugging)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.3 Legal Requirements</h3>
          <p className="mb-4">
            We may disclose information when required by law or to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Comply with legal processes or government requests</li>
            <li>Enforce our Terms of Service</li>
            <li>Protect our rights, property, or safety</li>
            <li>Prevent fraud or security threats</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.4 Business Transfers</h3>
          <p className="mb-4">
            In case of merger, acquisition, or sale of assets, your information may be transferred 
            to the new entity.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="mb-4">
            We implement industry-standard security measures:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Encryption:</strong> HTTPS/TLS for data in transit</li>
            <li><strong>Authentication:</strong> Secure password hashing (bcrypt)</li>
            <li><strong>Authorization:</strong> Role-based access control</li>
            <li><strong>Database Security:</strong> PostgreSQL with SSL connections</li>
            <li><strong>Payment Security:</strong> PCI-DSS compliant payment processors</li>
            <li><strong>Monitoring:</strong> Continuous security monitoring and alerts</li>
            <li><strong>Backups:</strong> Regular encrypted backups</li>
          </ul>
          <p className="mb-4">
            However, no method of transmission over the internet is 100% secure. We cannot guarantee 
            absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          
          <h3 className="text-xl font-semibold mb-3">6.1 Access and Correction</h3>
          <p className="mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information</li>
            <li>Update or correct inaccurate data</li>
            <li>View your order history and account details</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.2 Data Portability</h3>
          <p className="mb-4">
            You can request a copy of your data in a portable format (CSV, JSON).
          </p>

          <h3 className="text-xl font-semibold mb-3">6.3 Deletion</h3>
          <p className="mb-4">
            You may request deletion of your account and personal data, subject to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Completion of pending orders</li>
            <li>Legal retention requirements</li>
            <li>Legitimate business purposes (e.g., fraud prevention)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.4 Marketing Preferences</h3>
          <p className="mb-4">
            You can:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Opt out of marketing emails (unsubscribe link in emails)</li>
            <li>Manage notification preferences in your account settings</li>
            <li>Control cookie preferences</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.5 How to Exercise Your Rights</h3>
          <p className="mb-4">
            To exercise any of these rights, contact us at privacy@minalesh.et or through your 
            account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Essential Cookies:</strong> Required for platform functionality (authentication, cart)</li>
            <li><strong>Analytics Cookies:</strong> Understand how you use our platform</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            <li><strong>Marketing Cookies:</strong> Show relevant advertisements (with your consent)</li>
          </ul>
          <p className="mb-4">
            You can control cookies through your browser settings, but disabling essential cookies 
            may affect platform functionality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
          <p className="mb-4">
            Minalesh is not intended for children under 18 years old. We do not knowingly collect 
            personal information from children. If we learn we have collected data from a child, 
            we will delete it promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
          <p className="mb-4">
            We retain your information for as long as necessary to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide our services</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes</li>
            <li>Enforce our agreements</li>
          </ul>
          <p className="mb-4">
            Typical retention periods:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Account Data:</strong> Until account deletion + 90 days</li>
            <li><strong>Order History:</strong> 7 years (for tax compliance)</li>
            <li><strong>Payment Records:</strong> As required by Ethiopian tax law</li>
            <li><strong>Marketing Data:</strong> Until you unsubscribe</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
          <p className="mb-4">
            Your information may be transferred to and stored on servers outside Ethiopia (e.g., AWS 
            cloud infrastructure). We ensure adequate safeguards are in place to protect your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to Privacy Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy periodically. We will notify you of significant changes 
            via email or platform notification. The "Last Updated" date at the top indicates when the 
            policy was last revised.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
          <p className="mb-4">
            For questions about this Privacy Policy or our data practices:
          </p>
          <ul className="list-none mb-4">
            <li><strong>Email:</strong> privacy@minalesh.et</li>
            <li><strong>Data Protection Officer:</strong> dpo@minalesh.et</li>
            <li><strong>Address:</strong> Addis Ababa, Ethiopia</li>
            <li><strong>Phone:</strong> +251-XXX-XXXX</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Ethiopian Data Protection</h2>
          <p className="mb-4">
            We comply with Ethiopian data protection laws and regulations. If you have concerns 
            about our data practices, you may contact the relevant Ethiopian regulatory authority.
          </p>
        </section>

        <div className="mt-12 p-4 bg-muted rounded-lg">
          <p className="text-sm">
            By using Minalesh, you acknowledge that you have read and understood this Privacy Policy 
            and consent to our collection, use, and disclosure of your information as described.
          </p>
        </div>
      </div>
    </div>
  )
}
