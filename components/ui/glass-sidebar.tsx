import * as React from "react"
import { cn } from "@/lib/utils"

export function GlassSidebar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <aside
      className={cn("bg-surface backdrop-blur-2xl border-r border-line flex flex-col hidden lg:flex h-screen sticky top-0", className)}
      {...props}
    >
      {children}
    </aside>
  )
}
