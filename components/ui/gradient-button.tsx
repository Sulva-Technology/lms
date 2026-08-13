import * as React from "react"
import { cn } from "@/lib/utils"

export interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "blue" | "purple" | "emerald" | "red";
  size?: "sm" | "md" | "lg";
}

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, color = "blue", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-glow-blue border border-blue-400/30": color === "blue",
            "bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 shadow-[0_0_20px_rgba(192,38,211,0.4)] border border-fuchsia-400/30": color === "purple",
            "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-glow-emerald border border-emerald-400/30": color === "emerald",
            "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-glow-red border border-red-400/30": color === "red",
            "h-9 px-4 text-sm": size === "sm",
            "h-11 px-6": size === "md",
            "h-14 px-8 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
GradientButton.displayName = "GradientButton"
