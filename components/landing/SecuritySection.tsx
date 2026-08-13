"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Shield } from "lucide-react"

export function SecuritySection() {
  return (
    <section id="security" className="py-24 px-6 border-y border-white/5 bg-slate-900/20 text-center relative overflow-hidden">
       {/* Decorative glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
       
       <div className="max-w-4xl mx-auto relative z-10">
         <Shield className="w-12 h-12 text-slate-400 mx-auto mb-6" />
         <h2 className="font-outfit text-3xl font-semibold mb-4 text-white">Enterprise-grade security, by default.</h2>
         <p className="text-lg text-slate-400 mb-12">VUI LMS is built on a Zero-Trust architecture. We support SSO integrations with Active Directory, Google Workspace, and Microsoft Azure.</p>
         
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-70">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 font-outfit">99.99%</div>
              <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 font-outfit">SOC 2</div>
              <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Type II</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 font-outfit">GDPR</div>
              <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 font-outfit">AES-256</div>
              <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Encryption</div>
            </div>
         </div>
       </div>
    </section>
  )
}
