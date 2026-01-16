'use client'

import * as React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface NavItem {
  value: string
  label: string
  icon?: React.ReactNode
}

interface MobileNavProps {
  items: NavItem[]
  activeItem: string
  onItemChange: (value: string) => void
  title?: string
  className?: string
}

export function MobileNav({
  items,
  activeItem,
  onItemChange,
  title = "Navigation",
  className,
}: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const handleItemClick = (value: string) => {
    onItemChange(value)
    setOpen(false)
  }

  const activeLabel = items.find((item) => item.value === activeItem)?.label || title

  // Desktop: Show horizontal tabs/buttons
  if (!isMobile) {
    return (
      <div className={cn("flex gap-2 flex-wrap", className)}>
        {items.map((item) => (
          <Button
            key={item.value}
            variant={activeItem === item.value ? "default" : "outline"}
            onClick={() => onItemChange(item.value)}
            className={cn(
              "text-xs sm:text-sm",
              activeItem === item.value && "bg-primary hover:bg-primary/90"
            )}
            size="sm"
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </Button>
        ))}
      </div>
    )
  }

  // Mobile: Show collapsible sidebar
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-between", className)}
        >
          <span className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            <span>{activeLabel}</span>
          </span>
          <span className="text-xs text-muted-foreground">Tap to change</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2">
          {items.map((item) => (
            <Button
              key={item.value}
              variant={activeItem === item.value ? "default" : "ghost"}
              onClick={() => handleItemClick(item.value)}
              className={cn(
                "w-full justify-start text-left",
                activeItem === item.value && "bg-primary hover:bg-primary/90"
              )}
            >
              {item.icon && <span className="mr-3">{item.icon}</span>}
              {item.label}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
