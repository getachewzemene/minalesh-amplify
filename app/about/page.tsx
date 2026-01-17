import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingBag, Users, Zap, Shield, Heart, TrendingUp } from 'lucide-react'
import { LocalBusinessSchema, BreadcrumbSchema } from '@/components/seo'
import { createPageMetadata, BASE_URL, ORGANIZATION_INFO } from '@/lib/seo'

export const metadata: Metadata = createPageMetadata({
  title: 'About Minalesh',
  description: "Learn about Minalesh, Ethiopia's leading e-commerce platform connecting buyers and sellers across the nation. Discover our mission, values, and commitment to Ethiopian commerce.",
  path: '/about'
})

export default function AboutPage() {
  return (
    <>
      {/* Structured Data for About Page */}
      <LocalBusinessSchema
        name={ORGANIZATION_INFO.name}
        url={ORGANIZATION_INFO.url}
        logo={ORGANIZATION_INFO.logo}
        description="Ethiopia's intelligent e-commerce marketplace connecting buyers and sellers across the nation"
        address={ORGANIZATION_INFO.address}
        telephone={ORGANIZATION_INFO.contactPoint.telephone}
        email={ORGANIZATION_INFO.contactPoint.email}
        priceRange="$$"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: BASE_URL },
          { name: 'About', url: `${BASE_URL}/about` }
        ]}
      />
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About Minalesh</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Ethiopia's intelligent marketplace connecting buyers and sellers across the nation
        </p>
      </div>

      {/* Mission Statement */}
      <Card className="mb-12">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">Our Mission</h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
            To empower Ethiopian entrepreneurs and provide customers with a trusted, convenient, 
            and culturally relevant e-commerce experience. We're building a digital marketplace 
            that celebrates Ethiopian heritage while embracing modern technology.
          </p>
        </CardContent>
      </Card>

      {/* Our Story */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Our Story</h2>
        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground mb-4">
            Minalesh was founded with a vision to transform e-commerce in Ethiopia. Recognizing 
            the unique needs of Ethiopian consumers and businesses, we set out to create a platform 
            that bridges traditional commerce with digital innovation.
          </p>
          <p className="text-muted-foreground mb-4">
            Our name, "Minalesh" (ምን አለሽ), reflects our commitment to asking "What do you need?" 
            and delivering solutions that truly serve our community. From traditional Ethiopian 
            coffee and spices to modern electronics and fashion, we provide a comprehensive 
            marketplace for all.
          </p>
          <p className="text-muted-foreground">
            Today, Minalesh serves customers across Ethiopia, from Addis Ababa to remote regional 
            areas, connecting thousands of vendors with buyers seeking quality products at fair prices.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Our Core Values</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trust & Security</h3>
              <p className="text-muted-foreground">
                We prioritize the safety and security of our users through verified vendors, 
                secure payments, and buyer protection policies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Heart className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Community First</h3>
              <p className="text-muted-foreground">
                We're committed to supporting Ethiopian entrepreneurs and contributing to the 
                growth of local businesses and communities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                We leverage cutting-edge technology to provide intelligent product recommendations, 
                seamless user experiences, and efficient operations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Inclusivity</h3>
              <p className="text-muted-foreground">
                We serve all of Ethiopia, ensuring access to quality products regardless of 
                location, with shipping to both urban and rural areas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Quality</h3>
              <p className="text-muted-foreground">
                We maintain high standards for product listings, vendor verification, and 
                customer service to ensure the best marketplace experience.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ShoppingBag className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Transparency</h3>
              <p className="text-muted-foreground">
                Clear pricing with Ethiopian Birr (ETB), transparent fees, and honest 
                communication build trust with our users.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What We Offer */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">What We Offer</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">For Buyers</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Wide selection of authentic Ethiopian and international products</li>
              <li>✓ Secure payment options including TeleBirr, CBE Birr, and cards</li>
              <li>✓ Reliable delivery across all Ethiopian regions</li>
              <li>✓ Transparent pricing in Ethiopian Birr (ETB)</li>
              <li>✓ Customer reviews and ratings for informed decisions</li>
              <li>✓ Easy returns and refunds with buyer protection</li>
              <li>✓ 24/7 customer support</li>
              <li>✓ Personalized product recommendations</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">For Vendors</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Access to customers nationwide</li>
              <li>✓ Professional vendor dashboard with analytics</li>
              <li>✓ Inventory management and forecasting tools</li>
              <li>✓ Marketing and promotional features</li>
              <li>✓ Secure payment processing</li>
              <li>✓ Bulk product upload capabilities</li>
              <li>✓ Competitive commission rates</li>
              <li>✓ Dedicated vendor support team</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="mb-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-8 pb-8">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold mb-2">10,000+</p>
                <p className="text-sm opacity-90">Active Users</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">500+</p>
                <p className="text-sm opacity-90">Verified Vendors</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">50,000+</p>
                <p className="text-sm opacity-90">Products Listed</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">98%</p>
                <p className="text-sm opacity-90">Customer Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Ethiopian Focus */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Proudly Ethiopian</h2>
        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground mb-4">
            Minalesh is designed specifically for the Ethiopian market. We understand the unique 
            needs, preferences, and cultural context of Ethiopian commerce:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong>Ethiopian Birr (ETB) Pricing:</strong> All prices displayed in local currency 
              with automatic 15% VAT calculation
            </li>
            <li>
              <strong>Local Business Support:</strong> Vendor verification through Ethiopian Trade 
              License and TIN requirements
            </li>
            <li>
              <strong>Regional Delivery:</strong> Shipping to Addis Ababa, major cities (Dire Dawa, 
              Bahir Dar, Gondar, Mekelle), and regional areas
            </li>
            <li>
              <strong>Cultural Categories:</strong> Dedicated sections for Ethiopian coffee, 
              traditional clothing (Habesha Kemis), spices (Berbere, Mitmita), and more
            </li>
            <li>
              <strong>Local Payments:</strong> Integration with TeleBirr, CBE Birr, Awash Bank, 
              and other Ethiopian payment providers
            </li>
            <li>
              <strong>Ethiopian Holidays:</strong> Recognition of local holidays and special 
              occasions in our promotions
            </li>
          </ul>
        </div>
      </section>

      {/* Technology */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Built with Modern Technology</h2>
        <p className="text-muted-foreground mb-4">
          Minalesh leverages cutting-edge technology to provide a fast, secure, and intelligent 
          shopping experience:
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">AI-Powered Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Our intelligent recommendation system learns from your browsing and purchase 
                history to suggest products you'll love.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Advanced Search</h3>
              <p className="text-sm text-muted-foreground">
                Full-text search with autocomplete suggestions and faceted filtering to find 
                exactly what you need.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Secure Infrastructure</h3>
              <p className="text-sm text-muted-foreground">
                Bank-level encryption, PCI-DSS compliant payments, and robust security measures 
                protect your data.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Mobile-First Design</h3>
              <p className="text-sm text-muted-foreground">
                Fully responsive platform optimized for mobile devices, ensuring great experience 
                on any screen size.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="text-center">
        <Card>
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold mb-4">Join the Minalesh Community</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Whether you're looking to buy quality products or grow your business by selling, 
              Minalesh is here to serve you. Join thousands of satisfied customers and vendors today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2"
              >
                Start Shopping
              </a>
              <a
                href="/vendor/register"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6 py-2"
              >
                Become a Vendor
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
    </>
  )
}
