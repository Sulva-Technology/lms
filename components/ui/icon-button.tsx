import * as React from "react"
import { cn } from "@/lib/utils"

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "glass" | "solid";
  size?: "sm" | "md" | "lg";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
          {
            "hover:bg-ink/[0.06] text-ink-muted hover:text-ink": variant === "ghost",
            "border border-line bg-surface text-ink hover:border-line-strong": variant === "glass",
            "bg-surface text-ink hover:bg-slate-700 border border-line": variant === "solid",
            "h-8 w-8": size === "sm",
            "h-10 w-10": size === "md",
            "h-12 w-12": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
IconButton.displayName = "IconButton"
