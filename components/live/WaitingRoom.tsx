"use client";

import { motion } from "motion/react";
import { LiveSession } from "@/types/live-class";
import { Video, Mic, MicOff, VideoOff, Settings, Sparkles } from "lucide-react";
import { useState } from "react";

interface Props {
  session: LiveSession;
  onJoin: () => void;
  role: 'student' | 'lecturer';
}

export function WaitingRoom({ session, onJoin, role }: Props) {
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(true);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-8"
      >
         <div className="md:col-span-3 space-y-6">
           <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden relative border border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.15)] flex flex-col items-center justify-center">
              {camOn ? (
                <>
                <div className="absolute inset-0 bg-slate-800"></div>
                <div className="z-10 bg-slate-900/50 backdrop-blur border border-white/5 px-4 py-2 rounded-full flex gap-4 text-slate-300">
                   Camera Preview (Simulated)
                </div>
                </>
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
                   <VideoOff size={32} className="text-slate-500" />
                </div>
              )}

              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-20">
                 <button 
                   onClick={() => setMicOn(!micOn)} 
                   className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                 >
                    {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                 </button>
                 <button 
                   onClick={() => setCamOn(!camOn)} 
                   className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${camOn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                 >
                    {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                 </button>
              </div>
           </div>
         </div>

         <div className="md:col-span-2 flex flex-col justify-center space-y-6">
            <div>
               <h1 className="font-outfit text-3xl font-bold text-white mb-2">{session.topic}</h1>
               <div className="flex gap-2 items-center mb-4">
                 <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">{session.courseCode}</span>
                 <span className="text-slate-400 text-sm">{session.courseTitle}</span>
               </div>
               <p className="text-slate-400 text-sm">
                 {session.status === 'scheduled' 
                   ? `Class starts at ${session.startTime}. The host will let you in soon.` 
                   : 'Class is currently live. You can join the room.'}
               </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 space-y-4">
               {role === 'student' && (
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-slate-800 border border-white/5 overflow-hidden">
                      {session.lecturerAvatar ? <img src={session.lecturerAvatar} alt="Host" /> : session.lecturerName[0]}
                   </div>
                   <div>
                     <p className="text-sm font-medium text-slate-200">Host: {session.lecturerName}</p>
                     <p className="text-xs text-slate-500">Already in the meeting</p>
                   </div>
                 </div>
               )}
               {role === 'lecturer' && (
                 <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm font-medium">
                    <Sparkles size={16} /> You are the host of this session.
                 </div>
               )}
            </div>

            <button 
              onClick={onJoin}
              disabled={session.status === 'scheduled' && role === 'student'}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none"
            >
              Join Now
            </button>
         </div>
      </motion.div>
    </div>
  );
}
