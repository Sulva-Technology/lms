import * as React from "react"
import { cn } from "@/lib/utils"
import { GlassCard } from "./glass-card"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    label?: string;
    direction: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  colorClass?: string;
}

export function StatCard({ title, value, trend, icon, colorClass = "text-blue-400 bg-blue-500/10", className, ...props }: StatCardProps) {
  return (
    <GlassCard className={cn("flex flex-col gap-4", className)} hover {...props}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        {icon && (
          <div className={cn("p-2 rounded-lg border border-white/5", colorClass)}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-outfit font-semibold text-white">
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded",
              trend.direction === "up" ? "text-emerald-400 bg-emerald-500/10" : 
              trend.direction === "down" ? "text-red-400 bg-red-500/10" : 
              "text-slate-400 bg-slate-500/10"
            )}>
              {trend.direction === "up" ? "+" : ""}{trend.value}%
            </span>
            {trend.label && <span className="text-slate-500 text-xs">{trend.label}</span>}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
