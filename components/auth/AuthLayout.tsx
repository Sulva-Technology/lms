"use client"

import * as React from "react"
import { motion } from "motion/react"
import { AuthBackground } from "./AuthBackground"
import { LayoutTemplate } from "lucide-react"

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 lg:p-8 relative">
      <AuthBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-glow-blue mb-4">
            <LayoutTemplate className="text-white" size={24} />
          </div>
          <h1 className="font-outfit text-3xl font-bold text-white text-center">{title}</h1>
          {subtitle && (
            <p className="text-slate-400 text-center mt-2 font-inter">{subtitle}</p>
          )}
        </div>
        
        <div className="glass-panel p-6 sm:p-8 rounded-[24px]">
          {children}
        </div>
        
        <div className="mt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} VUI LMS. All rights reserved.
        </div>
      </motion.div>
    </div>
  )
}
