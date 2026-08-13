"use client";

import { Participant } from "@/types/live-class";
import { Mic, MicOff, Video, VideoOff, X, Hand, Shield } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  participants: Participant[];
  onClose: () => void;
}

export function ParticipantPanel({ participants, onClose }: Props) {
  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute top-4 bottom-24 right-4 w-80 glass-panel border border-white/10 rounded-2xl flex flex-col overflow-hidden bg-slate-900/80 backdrop-blur-xl z-40"
    >
       <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
         <h3 className="font-outfit font-semibold text-white">Participants ({participants.length})</h3>
         <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors">
            <X size={18} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
         {participants.map(p => (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] transition-colors group">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 relative flex items-center justify-center">
                    {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" /> : <span className="text-xs font-bold text-slate-400">{p.name[0]}</span>}
                    {p.isSpeaking && <div className="absolute -inset-1 border-2 border-blue-500 rounded-full animate-pulse"></div>}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-200">{p.name}</span>
                      {p.isHost && <span title="Host"><Shield size={12} className="text-blue-400" /></span>}
                    </div>
                  </div>
               </div>

               <div className="flex items-center gap-2 text-slate-400">
                  {p.isHandRaised && <Hand size={14} className="text-yellow-400" />}
                  {p.hasVideo ? <Video size={14} /> : <VideoOff size={14} className="text-slate-600" />}
                  {p.isMuted ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} className="text-emerald-400" />}
               </div>
            </div>
         ))}
      </div>
    </motion.div>
  );
}
