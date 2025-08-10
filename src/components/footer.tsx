import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react"
import { Container } from "./ui/container"
import { Button } from "./ui/button"

export function Footer() {
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
              <Button variant="outline" size="icon">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Sell on Minalesh</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Vendor Dashboard</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Electronics</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Fashion & Accessories</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Home & Garden</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Sports & Outdoors</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Books & Media</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">+251 11 XXX XXXX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">support@minalesh.et</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Addis Ababa, Ethiopia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Minalesh (ምናለሽ). All rights reserved. | Made with ❤️ in Ethiopia</p>
        </div>
      </Container>
    </footer>
  )
}