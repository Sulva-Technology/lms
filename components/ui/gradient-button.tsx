import * as React from "react"
import { cn } from "@/lib/utils"

export interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `blue` is the historical name of the brand slot, kept so call sites work. */
  color?: "blue" | "purple" | "emerald" | "red"
  size?: "sm" | "md" | "lg"
}

// The gradients are gone: a solid brand fill reads as a button at a glance and
// stays legible whatever colour a school picks. Destructive and confirming
// actions keep their own colour, because those must not be brandable.
const TONE = {
  blue: "bg-primary text-primary-contrast hover:bg-primary-hover",
  purple: "bg-secondary text-secondary-contrast hover:bg-secondary-hover",
  emerald: "bg-success text-ink hover:opacity-90",
  red: "bg-danger text-ink hover:opacity-90",
} as const

const SIZE = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
} as const

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, color = "blue", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-[background-color,opacity,transform] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
          TONE[color],
          SIZE[size],
          className,
        )}
        {...props}
      />
    )
  },
)
GradientButton.displayName = "GradientButton"
