import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "shimmer" | "pulse"
}) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        variant === "shimmer" && "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
        variant === "pulse" && "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
