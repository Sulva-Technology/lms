"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "motion/react"
import { staggerContainer, fadeUp } from "@/lib/motion"

export interface AnimatedListProps extends HTMLMotionProps<"div"> {
  staggerDelay?: number;
}

export function AnimatedList({ children, staggerDelay = 0.05, className, ...props }: AnimatedListProps) {
  const childrenArray = React.Children.toArray(children as React.ReactNode);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      {childrenArray.map((child, index) => (
        <motion.div key={index} variants={fadeUp}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
