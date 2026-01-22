/**
 * Seed script to create default contract templates
 * 
 * Run with: npx tsx prisma/seeds/contract-templates.ts
 */

import { PrismaClient, ContractType } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Standard Vendor Agreement',
    contractType: 'standard' as ContractType,
    version: '1.0',
    content: `
<h1>VENDOR AGREEMENT</h1>

<p><strong>Contract Number:</strong> {{contractNumber}}</p>
<p><strong>Effective Date:</strong> {{currentDate}}</p>

<h2>PARTIES</h2>
<p>This Vendor Agreement ("Agreement") is entered into between:</p>
<ul>
  <li><strong>Minalesh Marketplace</strong> ("Platform"), an Ethiopian e-commerce platform</li>
  <li><strong>{{vendorName}}</strong> ("Vendor"), with Trade License Number {{tradeLicense}} and TIN {{tinNumber}}</li>
</ul>

<h2>1. TERM</h2>
<p>This Agreement shall commence on <strong>{{startDate}}</strong> and continue until <strong>{{endDate}}</strong>, unless terminated earlier in accordance with the terms herein.</p>

<h2>2. VENDOR OBLIGATIONS</h2>
<p>The Vendor agrees to:</p>
<ul>
  <li>Provide accurate product descriptions, images, and pricing</li>
  <li>Maintain adequate inventory levels</li>
  <li>Process orders within 24 hours of receipt</li>
  <li>Ship products within the agreed timeframe</li>
  <li>Respond to customer inquiries within 48 hours</li>
  <li>Comply with all Ethiopian laws and regulations</li>
  <li>Maintain valid business licenses and permits</li>
</ul>

<h2>3. COMMISSION AND PAYMENTS</h2>
<p>The Vendor agrees to pay a commission of <strong>{{commissionRate}}%</strong> on all sales made through the Platform.</p>
<p>Payment terms: Net 15 days from the end of each month.</p>

<h2>4. PRODUCT LISTINGS</h2>
<p>The Vendor shall:</p>
<ul>
  <li>Ensure all product information is accurate and up-to-date</li>
  <li>Comply with Platform's content guidelines</li>
  <li>Not list prohibited or restricted items</li>
  <li>Maintain competitive pricing</li>
</ul>

<h2>5. INTELLECTUAL PROPERTY</h2>
<p>The Vendor retains all rights to their product content, images, and trademarks. The Vendor grants the Platform a license to display and promote Vendor's products on the marketplace.</p>

<h2>6. TERMINATION</h2>
<p>Either party may terminate this Agreement with 30 days written notice. The Platform may terminate immediately for breach of terms or violation of Ethiopian law.</p>

<h2>7. DISPUTE RESOLUTION</h2>
<p>Any disputes shall be resolved through good-faith negotiation. If unresolved, disputes shall be handled in accordance with Ethiopian law.</p>

<h2>8. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of the Federal Democratic Republic of Ethiopia.</p>

<p><strong>Vendor Email:</strong> {{vendorEmail}}</p>
<p><strong>Date:</strong> {{currentDate}}</p>
`,
    variables: {
      contractNumber: 'Auto-generated contract number',
      vendorName: 'Vendor business name',
      vendorEmail: 'Vendor email address',
      tradeLicense: 'Trade license number',
      tinNumber: 'TIN number',
      startDate: 'Contract start date',
      endDate: 'Contract end date',
      commissionRate: 'Commission rate percentage',
      currentDate: 'Current date',
    },
    isActive: true,
  },
  {
    name: 'Premium Vendor Agreement',
    contractType: 'premium' as ContractType,
    version: '1.0',
    content: `
<h1>PREMIUM VENDOR AGREEMENT</h1>

<p><strong>Contract Number:</strong> {{contractNumber}}</p>
<p><strong>Effective Date:</strong> {{currentDate}}</p>

<h2>PARTIES</h2>
<p>This Premium Vendor Agreement ("Agreement") is entered into between:</p>
<ul>
  <li><strong>Minalesh Marketplace</strong> ("Platform")</li>
  <li><strong>{{vendorName}}</strong> ("Premium Vendor"), Trade License {{tradeLicense}}, TIN {{tinNumber}}</li>
</ul>

<h2>1. TERM AND RENEWAL</h2>
<p>This Agreement commences on <strong>{{startDate}}</strong> and continues until <strong>{{endDate}}</strong>.</p>
<p>Auto-renewal: This contract automatically renews for {{renewalPeriod}} months unless either party provides 60 days notice.</p>

<h2>2. PREMIUM BENEFITS</h2>
<p>As a Premium Vendor, you receive:</p>
<ul>
  <li>Featured product placement on homepage</li>
  <li>Priority customer support</li>
  <li>Advanced analytics and reporting</li>
  <li>Reduced commission rate of {{commissionRate}}%</li>
  <li>Early access to new features</li>
  <li>Marketing support and promotional opportunities</li>
</ul>

<h2>3. VENDOR OBLIGATIONS</h2>
<p>Premium Vendors must:</p>
<ul>
  <li>Maintain a minimum seller rating of 4.5 stars</li>
  <li>Process 95% of orders within 12 hours</li>
  <li>Respond to customer inquiries within 12 hours</li>
  <li>Maintain accurate inventory (99% accuracy)</li>
  <li>Provide detailed product information and high-quality images</li>
  <li>Comply with all Platform policies and Ethiopian regulations</li>
</ul>

<h2>4. COMMISSION AND FEES</h2>
<p>Commission Rate: <strong>{{commissionRate}}%</strong> (reduced from standard rate)</p>
<p>Payment Schedule: Weekly payments, processed every Monday</p>
<p>Minimum Performance: Must maintain monthly sales of ETB 10,000</p>

<h2>5. MARKETING AND PROMOTIONS</h2>
<p>The Platform will feature Premium Vendors in:</p>
<ul>
  <li>Homepage carousels and featured sections</li>
  <li>Email marketing campaigns</li>
  <li>Social media promotions</li>
  <li>Seasonal promotional events</li>
</ul>

<h2>6. PERFORMANCE METRICS</h2>
<p>Premium status requires maintaining:</p>
<ul>
  <li>Order fulfillment rate: ≥ 98%</li>
  <li>Customer satisfaction: ≥ 4.5 stars</li>
  <li>Response time: ≤ 12 hours average</li>
  <li>Monthly sales: ≥ ETB 10,000</li>
</ul>

<h2>7. TERMINATION</h2>
<p>The Platform may downgrade Premium status if performance metrics are not met for 2 consecutive months. Either party may terminate with 60 days notice.</p>

<h2>8. GOVERNING LAW</h2>
<p>Governed by Ethiopian law. Disputes resolved through mediation, then Ethiopian courts.</p>

<p><strong>Vendor Contact:</strong> {{vendorEmail}}</p>
`,
    variables: {
      contractNumber: 'Auto-generated contract number',
      vendorName: 'Vendor business name',
      vendorEmail: 'Vendor email address',
      tradeLicense: 'Trade license number',
      tinNumber: 'TIN number',
      startDate: 'Contract start date',
      endDate: 'Contract end date',
      commissionRate: 'Reduced commission rate',
      renewalPeriod: 'Auto-renewal period in months',
      currentDate: 'Current date',
    },
    isActive: true,
  },
  {
    name: 'Enterprise Vendor Agreement',
    contractType: 'enterprise' as ContractType,
    version: '1.0',
    content: `
<h1>ENTERPRISE VENDOR AGREEMENT</h1>

<p><strong>Contract Number:</strong> {{contractNumber}}</p>
<p><strong>Effective Date:</strong> {{currentDate}}</p>

<h2>PARTIES</h2>
<p>This Enterprise Vendor Agreement is between Minalesh Marketplace and <strong>{{vendorName}}</strong> (Enterprise Vendor).</p>

<h2>1. TERM</h2>
<p>Period: <strong>{{startDate}}</strong> to <strong>{{endDate}}</strong></p>
<p>Auto-renewal: {{renewalPeriod}} months with 90 days notice for termination</p>

<h2>2. ENTERPRISE BENEFITS</h2>
<ul>
  <li>Dedicated account manager</li>
  <li>Custom commission rate: {{commissionRate}}%</li>
  <li>API access for inventory management</li>
  <li>White-label storefront options</li>
  <li>Priority placement in all categories</li>
  <li>Advanced fraud protection</li>
  <li>Custom payment terms available</li>
  <li>Bulk upload and management tools</li>
  <li>Direct integration support</li>
</ul>

<h2>3. SERVICE LEVEL AGREEMENT (SLA)</h2>
<ul>
  <li>Platform uptime: 99.9% guaranteed</li>
  <li>Order processing: Real-time synchronization</li>
  <li>Support response: 2 hours for critical issues</li>
  <li>Payment processing: Within 5 business days</li>
</ul>

<h2>4. VENDOR REQUIREMENTS</h2>
<ul>
  <li>Minimum monthly sales: ETB 100,000</li>
  <li>Product catalog: Minimum 100 active SKUs</li>
  <li>Order fulfillment: 99% within 24 hours</li>
  <li>Customer rating: Maintain 4.7+ stars</li>
  <li>Return rate: Below 5%</li>
</ul>

<h2>5. FINANCIAL TERMS</h2>
<p>Commission: {{commissionRate}}%</p>
<p>Payment: Weekly via bank transfer</p>
<p>Currency: Ethiopian Birr (ETB)</p>

<h2>6. DATA AND ANALYTICS</h2>
<p>Enterprise vendors receive:</p>
<ul>
  <li>Real-time sales dashboards</li>
  <li>Customer analytics and insights</li>
  <li>Inventory forecasting</li>
  <li>Market trend analysis</li>
  <li>Custom reporting</li>
</ul>

<h2>7. INTELLECTUAL PROPERTY</h2>
<p>Vendor retains all IP rights. Platform receives marketing license. Enterprise vendors may use Platform logo in approved contexts.</p>

<h2>8. CONFIDENTIALITY</h2>
<p>Both parties agree to maintain confidentiality of business information, customer data, and trade secrets.</p>

<h2>9. LIABILITY AND INSURANCE</h2>
<p>Enterprise vendors required to maintain:</p>
<ul>
  <li>Product liability insurance</li>
  <li>General business insurance</li>
  <li>Professional indemnity coverage</li>
</ul>

<h2>10. TERMINATION</h2>
<p>90 days notice required. Immediate termination for breach, fraud, or legal violations.</p>

<h2>11. GOVERNING LAW</h2>
<p>Ethiopian law governs this agreement. Arbitration in Addis Ababa for disputes.</p>

<p><strong>Vendor Details:</strong></p>
<ul>
  <li>Trade License: {{tradeLicense}}</li>
  <li>TIN: {{tinNumber}}</li>
  <li>Email: {{vendorEmail}}</li>
</ul>
`,
    variables: {
      contractNumber: 'Auto-generated contract number',
      vendorName: 'Enterprise vendor name',
      vendorEmail: 'Vendor email',
      tradeLicense: 'Trade license number',
      tinNumber: 'TIN number',
      startDate: 'Contract start date',
      endDate: 'Contract end date',
      commissionRate: 'Negotiated commission rate',
      renewalPeriod: 'Auto-renewal period',
      currentDate: 'Current date',
    },
    isActive: true,
  },
];

async function main() {
  console.log('Seeding contract templates...');

  for (const template of templates) {
    const existing = await prisma.contractTemplate.findFirst({
      where: {
        name: template.name,
        contractType: template.contractType,
      },
    });

    if (existing) {
      console.log(`Template "${template.name}" already exists, updating...`);
      await prisma.contractTemplate.update({
        where: { id: existing.id },
        data: template,
      });
    } else {
      console.log(`Creating template "${template.name}"...`);
      await prisma.contractTemplate.create({
        data: template,
      });
    }
  }

  console.log('Contract templates seeded successfully!');
  console.log(`Total templates: ${templates.length}`);
}

main()
  .catch((error) => {
    console.error('Error seeding contract templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
