"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  tags?: string[];
  className?: string;
}

export function PageHeader({ title, description, action, tags, className }: PageHeaderProps) {
  return (
    <div className={cn("relative rounded-b-[40px] overflow-hidden mb-8 shadow-2xl", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/20 to-slate-950 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent z-0"></div>
      
      <div className="relative z-10 bg-slate-950/40 backdrop-blur-3xl border-b border-white/10 p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="max-w-3xl">
          {tags && tags.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              {tags.map((tag, i) => (
                <span 
                  key={i} 
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full border",
                    i === 0 
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/20" 
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-outfit font-semibold text-white tracking-tight mb-4"
          >
            {title}
          </motion.h1>
          
          {description && (
            <p className="text-slate-400 text-lg max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="w-full lg:w-auto shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
