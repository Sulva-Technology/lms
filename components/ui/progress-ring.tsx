"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

export interface ProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  trackColorClass?: string;
  showValue?: boolean;
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 4,
  colorClass = "text-primary",
  trackColorClass = "text-slate-800",
  showValue = true,
  className,
  ...props
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(100, Math.max(0, value));
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }} {...props}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={trackColorClass}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <motion.circle
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      {showValue && (
        <span className="absolute font-outfit font-bold text-sm text-ink">
          {percent}%
        </span>
      )}
    </div>
  )
}
