'use client'

import { Home, ShoppingCart, Heart, User, Search } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useShop } from "@/context/shop-context"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

/**
 * Mobile Bottom Navigation Bar
 * Optimized for Ethiopian mobile users - provides quick access to key features
 * Only visible on mobile devices (< 768px)
 */
export function MobileBottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { cart, wishlist } = useShop()
  const { user } = useAuth()

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Calculate total cart quantity (sum of all item quantities)
  const cartTotalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const wishlistCount = wishlist.length

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      active: pathname === '/',
    },
    {
      icon: Search,
      label: 'Search',
      path: '/products',
      active: pathname === '/products',
    },
    {
      icon: ShoppingCart,
      label: 'Cart',
      path: '/cart',
      active: pathname === '/cart',
      badge: cartTotalQuantity,
      ariaLabel: `Cart with ${cartTotalQuantity} item${cartTotalQuantity !== 1 ? 's' : ''}`,
    },
    {
      icon: Heart,
      label: 'Wishlist',
      path: '/wishlist',
      active: pathname === '/wishlist',
      badge: wishlistCount,
      ariaLabel: `Wishlist with ${wishlistCount} item${wishlistCount !== 1 ? 's' : ''}`,
    },
    {
      icon: User,
      label: user ? 'Account' : 'Login',
      path: user ? '/dashboard' : '/login',
      active: pathname === '/dashboard' || pathname === '/profile',
    },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative",
                "transition-colors duration-200 active:bg-muted/50",
                item.active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.ariaLabel || item.label}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-6 w-6 transition-transform",
                  item.active && "scale-110"
                )} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span 
                    className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold"
                    aria-label={`${item.badge} items`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                item.active && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
