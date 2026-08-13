"use client";

import { Participant } from "@/types/live-class";
import { MicOff, MoreHorizontal } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  participant: Participant;
  isMain?: boolean;
}

export function VideoTile({ participant, isMain }: Props) {
  // If sharing screen or active speaker, logic for main view differs, but visual remains similar
  return (
    <div className={`relative bg-slate-800 rounded-xl overflow-hidden group ${participant.isSpeaking ? 'ring-2 ring-blue-500' : ''} ${isMain ? 'w-full h-full' : 'aspect-video'}`}>
      
      {participant.hasVideo && participant.avatar ? (
         <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
      ) : (
         <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
           <div className={`rounded-full flex items-center justify-center bg-slate-800 text-slate-400 font-bold ${isMain ? 'w-32 h-32 text-4xl' : 'w-16 h-16 text-xl'}`}>
             {participant.name.charAt(0)}
           </div>
         </div>
      )}

      {/* Overlays */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
         <div className="glass-panel px-2 py-1 rounded-md text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-md bg-black/40 border-none">
            {participant.isMuted && <MicOff size={12} className="text-red-400" />}
            {participant.name} {participant.isHost && '(Host)'}
         </div>
         
         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button className="p-1 rounded bg-black/50 hover:bg-black/80 text-white backdrop-blur">
             <MoreHorizontal size={14} />
           </button>
         </div>
      </div>

      {participant.isHandRaised && (
         <motion.div 
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="absolute top-2 left-2 bg-yellow-500/20 border border-yellow-500/50 p-1.5 rounded-lg backdrop-blur-md"
         >
            ✋
         </motion.div>
      )}
    </div>
  );
}
