"use client"

import * as React from "react"
import { motion } from "motion/react"
import { BookOpen, GraduationCap, Video, Users } from "lucide-react"

export function ProductMockup() {
  return (
    <motion.div
      id="solutions"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-6xl mx-auto px-6 relative perspective-[1200px] mb-32 z-10"
    >
      <motion.div 
        animate={{ y: [-15, 15, -15] }} 
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative rounded-t-[32px] overflow-hidden border-t border-x border-white/10 shadow-[0_30px_100px_-20px_rgba(59,130,246,0.5)] bg-slate-900/80 backdrop-blur-2xl"
        style={{ transform: 'rotateX(8deg)', transformStyle: 'preserve-3d', transformOrigin: 'bottom' }}
      >
        {/* Mockup Top Bar */}
        <div className="h-14 border-b border-white/5 flex items-center px-6 gap-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="ml-4 h-6 w-64 bg-slate-800 rounded-md"></div>
        </div>
        
        <div className="relative z-10 w-full aspect-[16/10] sm:aspect-video flex">
          {/* Sidebar */}
          <div className="w-[200px] border-r border-white/5 hidden md:block p-6 space-y-8 bg-slate-950/30">
            <div className="space-y-3">
              <div className="h-8 w-24 bg-blue-500/20 rounded-lg"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-full bg-white/5 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-3 mt-12">
              <div className="h-4 w-16 bg-white/10 rounded"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-full bg-white/5 rounded-lg"></div>
              ))}
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 p-6 md:p-10 space-y-8 bg-gradient-to-br from-slate-900/50 to-slate-950/80">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-white/10 rounded-lg"></div>
                <div className="h-4 w-32 bg-white/5 rounded"></div>
              </div>
              <div className="hidden sm:flex gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5"></div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20"></div>
              </div>
            </div>
            
            {/* Widget Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="h-32 bg-slate-800/50 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                <BookOpen className="text-blue-400 w-8 h-8" />
                <div className="h-4 w-20 bg-white/10 rounded"></div>
              </div>
              <div className="h-32 bg-slate-800/50 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                <Video className="text-purple-400 w-8 h-8" />
                <div className="h-4 w-24 bg-white/10 rounded"></div>
              </div>
              <div className="h-32 bg-slate-800/50 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                <GraduationCap className="text-emerald-400 w-8 h-8" />
                <div className="h-4 w-16 bg-white/10 rounded"></div>
              </div>
              <div className="h-32 bg-slate-800/50 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                <Users className="text-orange-400 w-8 h-8" />
                <div className="h-4 w-20 bg-white/10 rounded"></div>
              </div>
            </div>
            
            {/* Main graph/content area */}
            <div className="h-48 md:h-64 bg-slate-800/30 rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="h-6 w-32 bg-white/10 rounded-lg"></div>
              <div className="h-full w-full flex items-end gap-2 pb-4">
                {[40, 70, 45, 90, 65, 85, 60, 100, 50, 75].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-blue-600/40 to-blue-400/80 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Fade out */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
      </motion.div>
    </motion.div>
  )
}
