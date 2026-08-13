import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "success" | "warning" | "error" | "info" | "neutral";
  pulse?: boolean;
}

export function StatusBadge({ className, status, pulse, children, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium whitespace-nowrap",
        {
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20": status === "success",
          "bg-amber-500/10 text-amber-400 border-amber-500/20": status === "warning",
          "bg-red-500/10 text-red-400 border-red-500/20": status === "error",
          "bg-blue-500/10 text-blue-400 border-blue-500/20": status === "info",
          "bg-slate-500/10 text-slate-400 border-slate-500/20": status === "neutral",
        },
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="flex h-2 w-2 relative">
          <span className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            {
              "bg-emerald-400": status === "success",
              "bg-amber-400": status === "warning",
              "bg-red-400": status === "error",
              "bg-blue-400": status === "info",
              "bg-slate-400": status === "neutral",
            }
          )} />
          <span className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            {
              "bg-emerald-500": status === "success",
              "bg-amber-500": status === "warning",
              "bg-red-500": status === "error",
              "bg-blue-500": status === "info",
              "bg-slate-500": status === "neutral",
            }
          )} />
        </span>
      )}
      {children}
    </span>
  )
}
