"use client"

import * as React from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { Sparkles, LayoutTemplate } from "lucide-react"

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-outfit font-bold text-xl shadow-glow-blue">
            <LayoutTemplate size={20} className="text-white" />
          </div>
          <span className="font-outfit font-bold text-2xl tracking-wide text-white">VUI LMS</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#platform" className="hover:text-white transition-colors">Platform</Link>
          <Link href="#solutions" className="hover:text-white transition-colors">Solutions</Link>
          <Link href="#resources" className="hover:text-white transition-colors">Resources</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/login" className="bg-white text-slate-900 hover:bg-slate-200 font-medium rounded-full px-6 py-2.5 shadow-lg active:scale-95 transition-all outline-none focus:ring-2 focus:ring-slate-300 text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600" />
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}
