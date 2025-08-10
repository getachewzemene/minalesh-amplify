import { cn } from "@/lib/utils"

interface ContainerProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "hero" | "card"
}

export function Container({ children, className, variant = "default" }: ContainerProps) {
  const variants = {
    default: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    hero: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-hero text-white",
    card: "bg-gradient-card shadow-card rounded-lg p-6"
  }

  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  )
}