import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "shimmer" | "pulse"
}) {
  const shimmerClasses = "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]"
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
