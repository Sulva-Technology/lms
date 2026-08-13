import * as React from "react"
import { cn } from "@/lib/utils"

export function GlassNavbar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn("glass-navbar flex items-center justify-between px-6 h-16 sticky top-0 z-50", className)}
      {...props}
    >
      {children}
    </header>
  )
}
