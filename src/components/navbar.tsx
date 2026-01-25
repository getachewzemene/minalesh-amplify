'use client'

import { ShoppingCart, User, Menu, Heart, ShieldCheck, Users, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSelector } from "./language-selector"
import { NotificationCenter } from "./notifications/NotificationCenter"
import { Container } from "./ui/container"
import { OfflineBadge } from "./ui/offline-indicator"
import { SearchWithAutocomplete } from "./search/SearchWithAutocomplete"
import { LoyaltyBadge } from "./user/LoyaltyBadge"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useShop } from "@/context/shop-context"
import { useAuth } from "@/context/auth-context"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { cart, wishlist } = useShop()
  const { user, profile, logout } = useAuth()

  const handleSearch = (query: string) => {
    const q = query.trim()
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`)
    } else {
      router.push('/products')
    }
    setIsMenuOpen(false)
  }

  const goDashboard = () => {
    // Role-based routing using profile
    if (profile?.isAdmin) router.push('/admin/dashboard')
    else if (profile?.isVendor) router.push('/vendor/dashboard')
    else router.push('/')
  }

  // Always show wishlist and cart for all users
  const showWishlistAndCart = true;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center cursor-pointer" onClick={() => router.push('/') }>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Minalesh
              </h1>
              <span className="ml-2 text-sm text-muted-foreground hidden sm:block">
                ምናለሽ
              </span>
            </div>
            <OfflineBadge />
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchWithAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              onSuggestionSelect={handleSearch}
              placeholder="Search for electronics, fashion, and more..."
              className="w-full"
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <LanguageSelector />
            
            {/* Desktop actions */}
            <div className="hidden md:flex items-center space-x-2">
              <NotificationCenter />
              <LoyaltyBadge />
              {showWishlistAndCart && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/group-buy')} title="Group Buying">
                    <Users className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/wishlist')} className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">{wishlist.length}</span>
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/cart')} className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">{cart.length}</span>
                    )}
                  </Button>
                </>
              )}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/addresses')}>Addresses</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/orders')}>Orders</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/gift-cards')}>Gift Cards</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/group-buy')}>Group Buying</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/equb')}>Equb - እኩብ</DropdownMenuItem>
                    <DropdownMenuItem onClick={goDashboard}>Dashboard</DropdownMenuItem>
                    {profile?.isAdmin && (
                      <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>Admin Dashboard</DropdownMenuItem>
                    )}
                    {showWishlistAndCart && (
                      <>
                        <DropdownMenuItem onClick={() => router.push('/wishlist')}>Wishlist</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/cart')}>Cart</DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => { logout(); router.push('/auth/login'); }}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => router.push('/auth/login')}>
                  <User className="h-5 w-5" />
                </Button>
              )}
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
            <div className="mb-4">
              <SearchWithAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                onSuggestionSelect={handleSearch}
                placeholder="Search products..."
                className="w-full"
              />
            </div>
            <div className="flex justify-around">
              {showWishlistAndCart ? (
                <>
                  <Button variant="ghost" className="flex flex-col items-center p-2" onClick={() => router.push('/group-buy')}>
                    <Users className="h-5 w-5 mb-1" />
                    <span className="text-xs">Group Buy</span>
                  </Button>
                  <Button variant="ghost" className="flex flex-col items-center p-2" onClick={() => router.push('/equb')}>
                    <Coins className="h-5 w-5 mb-1" />
                    <span className="text-xs">Equb</span>
                  </Button>
                  <Button variant="ghost" className="flex flex-col items-center p-2 relative" onClick={() => router.push('/wishlist')}>
                    <Heart className="h-5 w-5 mb-1" />
                    {wishlist.length > 0 && (
                      <span className="absolute top-0 right-4 min-w-[1rem] h-4 px-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">{wishlist.length}</span>
                    )}
                    <span className="text-xs">Wishlist</span>
                  </Button>
                  <Button variant="ghost" className="flex flex-col items-center p-2 relative" onClick={() => router.push('/cart')}>
                    <ShoppingCart className="h-5 w-5 mb-1" />
                    {cart.length > 0 && (
                      <span className="absolute top-0 right-4 min-w-[1rem] h-4 px-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">{cart.length}</span>
                    )}
                    <span className="text-xs">Cart</span>
                  </Button>
                </>
              ) : null}
              {user ? (
                <>
                  <Button variant="ghost" className="flex flex-col items-center p-2" onClick={goDashboard}>
                    <User className="h-5 w-5 mb-1" />
                    <span className="text-xs">Account</span>
                  </Button>
                  {profile?.isAdmin && (
                    <Button variant="ghost" className="flex flex-col items-center p-2" onClick={() => router.push('/admin/dashboard')}>
                      <ShieldCheck className="h-5 w-5 mb-1" />
                      <span className="text-xs">Admin</span>
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="ghost" className="flex flex-col items-center p-2" onClick={() => router.push('/auth/login')}>
                  <User className="h-5 w-5 mb-1" />
                  <span className="text-xs">Account</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Container>
    </nav>
  )
}