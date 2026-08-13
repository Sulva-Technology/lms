"use client"

import * as React from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { ArrowRight, Play, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 backdrop-blur-md">
          <Sparkles size={16} />
          <span>The next generation of VUI LMS is here</span>
        </div>
        
        <h1 className="font-outfit text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight mb-8 leading-[1.1] text-white">
          The Operating System for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Modern University.</span>
        </h1>
        
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          VUI LMS combines seamless course registration, immersive live classes, and powerful academic administration into one stunning, robust platform.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/onboarding" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-full px-8 py-4 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-2 border border-blue-400/20">
            Get Started Free <ArrowRight size={20} />
          </Link>
          <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-full px-8 py-4 transition-all focus:ring-2 focus:ring-white/20 active:scale-[0.98] text-lg flex items-center justify-center gap-2 backdrop-blur-sm">
            <Play size={20} /> See how it works
          </button>
        </div>
      </motion.div>
    </section>
  )
}
