import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "shimmer" | "pulse"
}) {
  const shimmerClasses = [
    "before:absolute",
    "before:inset-0",
    "before:-translate-x-full",
    "before:animate-shimmer",
    "before:bg-gradient-to-r",
    "before:from-transparent",
    "before:via-white/20",
    "before:to-transparent"
  ].join(" ")
  const pulseClasses = "animate-pulse"
  
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        variant === "shimmer" && shimmerClasses,
        variant === "pulse" && pulseClasses,
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
