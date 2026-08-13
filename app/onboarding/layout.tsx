"use client"

import * as React from "react"
import { AuthBackground } from "@/components/auth/AuthBackground"
import { LayoutTemplate, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter, usePathname } from "next/navigation"

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = () => {
    router.back()
  }

  // Determine current step based on pathname
  let step = 0
  let maxStep = 3
  if (pathname.includes('/university')) step = 1
  else if (pathname.includes('/role')) step = 2
  else if (pathname.includes('/profile')) step = 3

  return (
    <div className="min-h-screen flex flex-col p-4 lg:p-8 relative">
      <AuthBackground />
      
      {/* Top Navigation */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 relative mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-glow-blue shrink-0">
            <LayoutTemplate className="text-white" size={16} />
          </div>
          <span className="font-outfit font-bold text-white text-lg hidden sm:block">VUI LMS</span>
        </div>

        {step > 0 && (
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors border border-white/5"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center w-full z-10">
        <div className="w-full max-w-4xl space-y-8">
          {/* Progress Indicators */}
          {step > 0 && (
            <div className="flex justify-center gap-3 mb-8">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= step ? 'bg-blue-500 w-12 shadow-glow-blue' : 'bg-slate-800 w-4'
                  }`}
                />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
