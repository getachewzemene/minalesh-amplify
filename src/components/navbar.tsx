import { Search, ShoppingCart, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSelector } from "./language-selector"
import { Container } from "./ui/container"
import { useState } from "react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Minalesh
            </h1>
            <span className="ml-2 text-sm text-muted-foreground hidden sm:block">
              ምናለሽ
            </span>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search for electronics, fashion, and more..."
                className="pl-10 pr-4 w-full"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <LanguageSelector />
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile search and menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 pr-4 w-full"
              />
            </div>
            <div className="flex justify-around">
              <Button variant="ghost" className="flex flex-col items-center p-2">
                <ShoppingCart className="h-5 w-5 mb-1" />
                <span className="text-xs">Cart</span>
              </Button>
              <Button variant="ghost" className="flex flex-col items-center p-2">
                <User className="h-5 w-5 mb-1" />
                <span className="text-xs">Account</span>
              </Button>
            </div>
          </div>
        )}
      </Container>
    </nav>
  )
}