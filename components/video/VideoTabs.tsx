"use client";

import { VideoLessonData } from "@/types/video";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, MessageCircle, Info, Download } from "lucide-react";

interface Props {
  lesson: VideoLessonData;
}

export function VideoTabs({ lesson }: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'resources', label: 'Resources', icon: Download },
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'comments', label: 'Discussions', icon: MessageCircle },
  ];

  return (
    <div className="mt-4">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto custom-scrollbar border-b border-white/5 mb-6">
        <div className="flex gap-6 sm:gap-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 relative transition-colors focus:outline-none whitespace-nowrap ${
                  isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="videoTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
           {/* OVERVIEW TAB */}
           {activeTab === 'overview' && (
             <div className="space-y-8">
               <div>
                 <h2 className="text-2xl font-outfit font-semibold mb-3">About this lesson</h2>
                 <p className="text-slate-300 leading-relaxed max-w-3xl">
                   In this lesson, we will explore the core concepts that define microservices architectures, comparing them explicitly with legacy monolithic structures. You'll learn how to independently deploy services, manage loose coupling, and structure cross-service communication safely.
                 </p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                 <div className="glass-panel p-4 rounded-xl border border-white/5">
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Instructor</span>
                   <p className="mt-1 font-medium text-slate-200">Dr. Sarah Jenkins</p>
                 </div>
                 <div className="glass-panel p-4 rounded-xl border border-white/5">
                   <span className="text-xs text-slate-500 uppercase tracking-wider">Duration</span>
                   <p className="mt-1 font-medium text-slate-200">22:15</p>
                 </div>
               </div>
             </div>
           )}

           {/* RESOURCES TAB */}
           {activeTab === 'resources' && (
             <div className="space-y-4 max-w-3xl">
               {lesson.resources.map(res => (
                 <div key={res.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-white/5 hover:border-blue-500/30 transition-colors group">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                          <FileText size={20} />
                       </div>
                       <div>
                          <h4 className="font-medium text-slate-200 group-hover:text-blue-300 transition-colors">{res.title}</h4>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">{res.type}</span>
                       </div>
                    </div>
                    <button className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors border border-white/5">
                       <Download size={18} />
                    </button>
                 </div>
               ))}
             </div>
           )}

           {/* TRANSCRIPT TAB */}
           {activeTab === 'transcript' && (
             <div className="space-y-2 max-w-3xl font-inter text-slate-300 pb-10">
               {lesson.transcript.map((line, idx) => {
                 const isActive = idx === 2; // Mocking the active line
                 return (
                   <div key={line.id} className={`flex gap-4 p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-500/10 border-l-2 border-l-blue-500 pl-4 text-blue-100' : 'hover:bg-white/[0.02]'}`}>
                     <span className={`text-xs font-mono w-10 shrink-0 pt-1 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>0:{line.startTime.toString().padStart(2, '0')}</span>
                     <p className="leading-relaxed">{line.text}</p>
                   </div>
                 );
               })}
             </div>
           )}

           {/* COMMENTS TAB */}
           {activeTab === 'comments' && (
             <div className="space-y-6 max-w-3xl pb-10">
                <div className="flex gap-4">
                   <div className="w-10 h-10 bg-indigo-500 rounded-full flex shrink-0 items-center justify-center font-bold text-sm">
                     You
                   </div>
                   <div className="flex-1">
                     <textarea rows={3} placeholder="Add a comment or ask a question..." className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 resize-none mb-2" />
                     <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors border-none shadow-[0_4px_15px_rgba(37,99,235,0.3)]">
                       Post Comment
                     </button>
                   </div>
                </div>

                <div className="h-px bg-white/5 my-8"></div>

                <div className="space-y-6">
                   {lesson.comments.map(comment => (
                     <div key={comment.id} className="flex gap-4 text-sm">
                        <img src={comment.authorAvatar} alt={comment.author} className="w-10 h-10 rounded-full shrink-0" />
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className="font-medium text-slate-200">{comment.author}</span>
                             <span className="text-xs text-slate-500">{comment.timestamp}</span>
                           </div>
                           <p className="text-slate-300 leading-relaxed mb-2">{comment.text}</p>
                           <button className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
                             Reply
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
