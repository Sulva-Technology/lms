import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "pulse" | "outline" | "solid" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "outline", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
          {
            "glass-button": variant === "outline" || variant === "ghost",
            "border-transparent hover:bg-white/10": variant === "ghost",
            "bg-blue-600 text-white hover:bg-blue-500 shadow-glow-blue border border-blue-500/50": variant === "solid",
            "h-9 px-4 text-sm": size === "sm",
            "h-11 px-6": size === "md",
            "h-14 px-8 text-lg": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
GlassButton.displayName = "GlassButton"
