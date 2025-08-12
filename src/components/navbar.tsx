import { Search, ShoppingCart, User, Menu, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSelector } from "./language-selector"
import { Container } from "./ui/container"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useShop } from "@/context/shop-context"
import { useAuth } from "@/context/auth-context"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const { cart, wishlist } = useShop()
  const { user, logout } = useAuth()

  const handleSearch = () => {
    const q = query.trim()
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`)
  }

  const goDashboard = () => {
    if (user?.role === 'admin') navigate('/admin')
    else if (user?.role === 'vendor') navigate('/dashboard')
    else navigate('/')
  }

  // Always show wishlist and cart for all users
  const showWishlistAndCart = true;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/') }>
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <LanguageSelector />
            
            {/* Desktop actions */}
            <div className="hidden md:flex items-center space-x-2">
              {showWishlistAndCart && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/wishlist')} className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">{wishlist.length}</span>
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/cart')} className="relative">
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
                    <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={goDashboard}>Dashboard</DropdownMenuItem>
                    {showWishlistAndCart && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/wishlist')}>Wishlist</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/cart')}>Cart</DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => { logout(); navigate('/auth/login'); }}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => navigate('/auth/login')}>
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
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 pr-4 w-full"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setIsMenuOpen(false), handleSearch())}
              />
            </div>
            <div className="flex justify-around">
              {showWishlistAndCart ? (
                <>
                  <Button variant="ghost" className="flex flex-col items-center p-2 relative" onClick={() => navigate('/wishlist')}>
                    <Heart className="h-5 w-5 mb-1" />
                    {wishlist.length > 0 && (
                      <span className="absolute top-0 right-4 min-w-[1rem] h-4 px-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">{wishlist.length}</span>
                    )}
                    <span className="text-xs">Wishlist</span>
                  </Button>
                  <Button variant="ghost" className="flex flex-col items-center p-2 relative" onClick={() => navigate('/cart')}>
                    <ShoppingCart className="h-5 w-5 mb-1" />
                    {cart.length > 0 && (
                      <span className="absolute top-0 right-4 min-w-[1rem] h-4 px-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">{cart.length}</span>
                    )}
                    <span className="text-xs">Cart</span>
                  </Button>
                </>
              ) : null}
              {user ? (
                <Button variant="ghost" className="flex flex-col items-center p-2" onClick={goDashboard}>
                  <User className="h-5 w-5 mb-1" />
                  <span className="text-xs">Account</span>
                </Button>
              ) : (
                <Button variant="ghost" className="flex flex-col items-center p-2" onClick={() => navigate('/auth/login')}>
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