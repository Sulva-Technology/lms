import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  colorClass?: string;
  heightClass?: string;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  colorClass = "bg-primary", 
  heightClass = "h-2",
  className, 
  ...props 
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={cn("w-full bg-surface rounded-full overflow-hidden border border-line", heightClass, className)} {...props}>
      <div 
        className={cn("h-full rounded-full transition-all duration-1000 ease-out", colorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
