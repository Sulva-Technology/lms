"use client"

import * as React from "react"
import { motion } from "motion/react"
import { MonitorPlay, CheckCircle2, LayoutDashboard, GraduationCap, Play } from "lucide-react"

export function FeatureGrid() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto" id="platform">
       <div className="text-center mb-20 max-w-3xl mx-auto">
         <h2 className="font-outfit text-4xl md:text-5xl font-semibold mb-6 text-white">Consumer delight. Enterprise power.</h2>
         <p className="text-lg text-slate-400">Everything you need to run a modern academic institution, beautifully designed and brilliantly engineered.</p>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             whileHover={{ y: -5, scale: 1.01 }}
             className="md:col-span-2 bg-slate-900/40 border border-white/10 rounded-[32px] p-8 md:p-12 relative overflow-hidden group glass-panel"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-colors"></div>
             <div className="relative z-10 flex flex-col h-full">
                <MonitorPlay className="w-10 h-10 text-blue-400 mb-6" />
                <h3 className="text-2xl font-semibold mb-3 text-white">Immersive Live Classes</h3>
                <p className="text-slate-400 mb-8 max-w-md">HD video streaming, real-time collaboration, and automatic transcriptions built right into the browser. No clunky Zoom links required.</p>
                <div className="mt-auto aspect-video bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                   <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center backdrop-blur-md border border-blue-500/30 group-hover:scale-110 transition-transform">
                     <Play className="text-blue-400 ml-1" />
                   </div>
                </div>
             </div>
          </motion.div>
          
          {/* Feature 2 */}
          <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             whileHover={{ y: -5, scale: 1.01 }}
             className="bg-slate-900/40 border border-white/10 rounded-[32px] p-8 md:p-12 relative overflow-hidden group glass-panel"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[80px] -mr-20 -mt-20 group-hover:bg-violet-500/20 transition-colors"></div>
             <div className="relative z-10 flex flex-col h-full">
                <CheckCircle2 className="w-10 h-10 text-violet-400 mb-6" />
                <h3 className="text-2xl font-semibold mb-3 text-white">Frictionless Registration</h3>
                <p className="text-slate-400 mb-8">Reduce enrollment day IT tickets by 90% with our drag-and-drop course builder and intuitive student stepper.</p>
                <div className="mt-auto space-y-3">
                   <div className="h-10 bg-white/5 rounded-lg w-full flex items-center px-4"><div className="w-4 h-4 rounded-full bg-emerald-500/50 mr-3"></div><div className="h-3 bg-white/20 rounded-full w-24"></div></div>
                   <div className="h-10 bg-white/5 rounded-lg w-full flex items-center px-4"><div className="w-4 h-4 rounded-full bg-emerald-500/50 mr-3"></div><div className="h-3 bg-white/20 rounded-full w-32"></div></div>
                   <div className="h-10 bg-white/5 rounded-lg w-3/4 flex items-center px-4"><div className="w-4 h-4 rounded-full border border-white/20 mr-3"></div><div className="h-3 bg-white/10 rounded-full w-20"></div></div>
                </div>
             </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             whileHover={{ y: -5, scale: 1.01 }}
             className="bg-slate-900/40 border border-white/10 rounded-[32px] p-8 md:p-12 relative overflow-hidden group glass-panel"
          >
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] -mr-20 -mb-20 group-hover:bg-teal-500/20 transition-colors"></div>
             <div className="relative z-10">
                <LayoutDashboard className="w-10 h-10 text-teal-400 mb-6" />
                <h3 className="text-2xl font-semibold mb-3 text-white">Admin Command Center</h3>
                <p className="text-slate-400">Complete visibility into university operations. Generate reports, manage scaling infrastructures, and oversee academic integrity.</p>
             </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.3 }}
             whileHover={{ y: -5, scale: 1.01 }}
             className="md:col-span-2 bg-slate-900/40 border border-white/10 rounded-[32px] p-8 md:p-12 relative overflow-hidden group glass-panel"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative z-10 flex flex-col md:flex-row h-full gap-8">
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <GraduationCap className="w-10 h-10 text-fuchsia-400 mb-6" />
                  <h3 className="text-2xl font-semibold mb-3 text-white">Powerful Grading & Analytics</h3>
                  <p className="text-slate-400">Identify at-risk students instantly. Our AI summary aggregates course performance, attendance, and assignment metrics to forecast academic trajectories.</p>
                </div>
                <div className="w-full md:w-1/2 flex items-center justify-center md:justify-end">
                  <div className="w-48 h-48 relative border-[12px] border-slate-800 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 border-[12px] border-fuchsia-500 rounded-full drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 50%, 0 50%)'}}></div>
                    <div className="text-center">
                      <span className="text-4xl font-bold font-outfit text-white">84%</span>
                      <span className="block text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Average</span>
                    </div>
                  </div>
                </div>
             </div>
          </motion.div>
       </div>
    </section>
  )
}
