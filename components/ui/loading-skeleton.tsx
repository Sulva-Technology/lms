"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "motion/react"
import { pulseVariant } from "@/lib/motion"

export interface LoadingSkeletonProps extends HTMLMotionProps<"div"> {
  shape?: "circle" | "rect" | "text";
}

export function LoadingSkeleton({ shape = "rect", className, ...props }: LoadingSkeletonProps) {
  return (
    <motion.div
      variants={pulseVariant}
      initial="initial"
      animate="animate"
      className={cn(
        "bg-slate-800/80 border border-white/5",
        {
          "rounded-full": shape === "circle",
          "rounded-xl": shape === "rect",
          "rounded-md": shape === "text",
        },
        className
      )}
      {...props}
    />
  )
}
