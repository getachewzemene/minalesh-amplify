'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Inbox, 
  ShoppingCart, 
  Package, 
  Search,
  FileText,
  LucideIcon 
} from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'search' | 'cart' | 'products' | 'orders'
  className?: string
}

const iconMap: Record<string, LucideIcon> = {
  default: Inbox,
  search: Search,
  cart: ShoppingCart,
  products: Package,
  orders: FileText,
}

/**
 * EmptyState component - displays when no data is available
 */
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  variant = 'default',
  className = '' 
}: EmptyStateProps) {
  const IconComponent = Icon || iconMap[variant]
  
  return (
    <div className={`flex items-center justify-center min-h-[300px] ${className}`}>
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-6">
              <IconComponent className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
          )}
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
