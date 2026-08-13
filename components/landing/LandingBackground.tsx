"use client"

import * as React from "react"
import { motion } from "motion/react"

export function LandingBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
      <motion.div 
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }} 
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen" 
      />
      <motion.div 
        animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} 
        transition={{ duration: 25, repeat: Infinity, ease: 'linear', delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/15 blur-[150px] rounded-full mix-blend-screen" 
      />
      <motion.div 
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }} 
        transition={{ duration: 18, repeat: Infinity, ease: 'linear', delay: 5 }}
        className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-emerald-600/10 blur-[150px] rounded-full mix-blend-screen" 
      />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
    </div>
  )
}
