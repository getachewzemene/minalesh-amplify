'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
  mobileCardView?: boolean
}

/**
 * ResponsiveTable Component
 * 
 * Wraps tables to make them mobile-friendly
 * - On desktop: Shows as normal table
 * - On mobile: Either shows horizontal scroll or converts to card view
 * 
 * @param children - Table content
 * @param className - Additional CSS classes
 * @param mobileCardView - If true, converts to card layout on mobile (recommended)
 */
export function ResponsiveTable({ 
  children, 
  className,
  mobileCardView = false 
}: ResponsiveTableProps) {
  if (mobileCardView) {
    return (
      <div className={cn("mobile-responsive-table", className)}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn(
      "w-full overflow-x-auto rounded-lg border border-border",
      "-mx-4 sm:mx-0", // Extend to screen edges on mobile
      className
    )}>
      <div className="min-w-full inline-block align-middle">
        {children}
      </div>
    </div>
  )
}

interface MobileTableCardProps {
  children: ReactNode
  label: string
  className?: string
}

/**
 * MobileTableCard Component
 * 
 * Helper component for creating mobile-friendly card layouts from table data
 * Use within ResponsiveTable when mobileCardView is true
 */
export function MobileTableCard({ children, label, className }: MobileTableCardProps) {
  return (
    <div className={cn("mobile-card p-4", className)}>
      <div className="mobile-card-label">{label}</div>
      {children}
    </div>
  )
}
