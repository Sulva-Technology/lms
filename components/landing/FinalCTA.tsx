"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section id="contact" className="py-32 px-6">
      <div className="max-w-4xl mx-auto relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[40px] blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
        <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[40px] p-12 md:p-20 text-center shadow-2xl overflow-hidden glass-panel">
          
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px]"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px]"></div>

          <div className="relative z-10">
            <h2 className="font-outfit text-4xl md:text-5xl font-semibold mb-6 text-white text-balance">Ready to upgrade your campus?</h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto text-balance">Join the world's most innovative universities using VUI LMS to deliver unparalleled learning experiences.</p>
            
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
               <input 
                 type="email" 
                 placeholder="Enter your university email" 
                 className="flex-1 bg-slate-950/50 border border-slate-700 rounded-full px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 shadow-inner"
                 required
               />
               <button type="submit" className="bg-white text-slate-900 hover:bg-slate-200 font-medium rounded-full px-8 py-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-95 transition-all outline-none text-lg flex items-center justify-center gap-2 flex-shrink-0">
                 Get Started <ArrowRight size={18} />
               </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
