'use client'

import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Container } from "./ui/container"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { toast } from "sonner"

export function Footer() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Implement newsletter signup API
      // For now, just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Successfully subscribed to newsletter!')
      setEmail('')
    } catch (error) {
      console.error('Newsletter signup error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="bg-card border-t">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Minalesh
            </h3>
            <p className="text-sm text-muted-foreground">
              Ethiopia's premier marketplace for electronics and general goods. 
              Connecting buyers with trusted vendors nationwide.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" asChild>
                <a href="https://facebook.com/minalesh" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="https://twitter.com/minalesh" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="https://instagram.com/minalesh" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/auth/register-vendor" className="text-muted-foreground hover:text-primary transition-colors">Sell on Minalesh</Link></li>
              <li><Link href="/vendor/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Vendor Dashboard</Link></li>
              <li><Link href="/help/faq" className="text-muted-foreground hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/legal/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?category=electronics" className="text-muted-foreground hover:text-primary transition-colors">Electronics</Link></li>
              <li><Link href="/products?category=fashion-accessories" className="text-muted-foreground hover:text-primary transition-colors">Fashion & Accessories</Link></li>
              <li><Link href="/products?category=home-garden" className="text-muted-foreground hover:text-primary transition-colors">Home & Garden</Link></li>
              <li><Link href="/products?category=sports-outdoors" className="text-muted-foreground hover:text-primary transition-colors">Sports & Outdoors</Link></li>
              <li><Link href="/products?category=books-media" className="text-muted-foreground hover:text-primary transition-colors">Books & Media</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+251911234567" className="text-muted-foreground hover:text-primary transition-colors">+251 911 234 567</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:support@minalesh.et" className="text-muted-foreground hover:text-primary transition-colors">support@minalesh.et</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Addis Ababa, Ethiopia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t pt-8 mt-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="font-semibold mb-2">Stay Updated</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to our newsletter for exclusive deals and updates
            </p>
            <form onSubmit={handleNewsletterSignup} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                disabled={isSubmitting}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Minalesh (ምናለሽ). All rights reserved. | Made with ❤️ in Ethiopia</p>
        </div>
      </Container>
    </footer>
  )
}