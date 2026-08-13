"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "motion/react"
import { fadeUp } from "@/lib/motion"

export interface EmptyStateProps extends HTMLMotionProps<"div"> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <motion.div 
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col items-center justify-center py-16 px-6 text-center glass-panel rounded-2xl", className)} 
      {...props}
    >
      {icon && (
        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 mb-6 border border-white/5">
          {icon}
        </div>
      )}
      <h3 className="font-outfit text-xl font-semibold text-slate-200 mb-2">{title}</h3>
      {description && <p className="text-slate-400 text-sm max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </motion.div>
  )
}
