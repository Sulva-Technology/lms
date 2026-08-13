"use client";

import { motion } from "motion/react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, Hand, MessageSquare, Users, Settings, XCircle, PhoneOff } from "lucide-react";

interface Props {
  role: 'student' | 'lecturer';
  isMicOn: boolean;
  setIsMicOn: (v: boolean) => void;
  isCamOn: boolean;
  setIsCamOn: (v: boolean) => void;
  isHandRaised: boolean;
  setIsHandRaised: (v: boolean) => void;
  activePanel: string | null;
  setActivePanel: (p: string | null) => void;
  onLeave: () => void;
  isRecording: boolean;
  toggleRecording: () => void;
}

export function LiveControlBar({ 
  role, isMicOn, setIsMicOn, isCamOn, setIsCamOn, 
  isHandRaised, setIsHandRaised, 
  activePanel, setActivePanel,
  onLeave, isRecording, toggleRecording
}: Props) {

  const controls = [
    {
      id: 'mic',
      icon: isMicOn ? Mic : MicOff,
      label: isMicOn ? 'Mute' : 'Unmute',
      onClick: () => setIsMicOn(!isMicOn),
      activeColor: isMicOn ? 'text-slate-200 bg-white/10 hover:bg-white/20' : 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
    },
    {
      id: 'cam',
      icon: isCamOn ? Video : VideoOff,
      label: isCamOn ? 'Stop Cam' : 'Start Cam',
      onClick: () => setIsCamOn(!isCamOn),
      activeColor: isCamOn ? 'text-slate-200 bg-white/10 hover:bg-white/20' : 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
    },
    {
       id: 'share',
       icon: MonitorUp,
       label: 'Share',
       onClick: () => {},
       activeColor: 'text-slate-300 hover:text-white bg-transparent hover:bg-white/10'
    },
    {
        id: 'hand',
        icon: Hand,
        label: isHandRaised ? 'Lower Hand' : 'Raise Hand',
        onClick: () => setIsHandRaised(!isHandRaised),
        activeColor: isHandRaised ? 'text-yellow-400 bg-yellow-500/20' : 'text-slate-300 hover:text-white bg-transparent hover:bg-white/10'
    },
    {
        id: 'chat',
        icon: MessageSquare,
        label: 'Chat',
        onClick: () => setActivePanel(activePanel === 'chat' ? null : 'chat'),
        activeColor: activePanel === 'chat' ? 'text-blue-400 bg-blue-500/20' : 'text-slate-300 hover:text-white bg-transparent hover:bg-white/10'
    },
    {
        id: 'participants',
        icon: Users,
        label: 'People',
        onClick: () => setActivePanel(activePanel === 'participants' ? null : 'participants'),
        activeColor: activePanel === 'participants' ? 'text-blue-400 bg-blue-500/20' : 'text-slate-300 hover:text-white bg-transparent hover:bg-white/10'
    }
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel p-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-50 bg-slate-900/80 backdrop-blur-xl"
    >
        {controls.map(c => {
           const Icon = c.icon;
           return (
             <button 
               key={c.id} 
               onClick={c.onClick}
               className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors min-w-[64px] ${c.activeColor}`}
               title={c.label}
             >
                <Icon size={20} className="mb-1" />
                <span className="text-[10px] font-medium opacity-80">{c.label}</span>
             </button>
           )
        })}

        {role === 'lecturer' && (
           <button 
             onClick={toggleRecording}
             className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors min-w-[64px] bg-transparent hover:bg-white/10 ${isRecording ? 'text-red-400' : 'text-slate-300 hover:text-white'}`}
           >
              <div className="relative">
                <div className={`w-3 h-3 rounded-full mb-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'border-2 border-slate-300'}`}></div>
              </div>
              <span className="text-[10px] font-medium opacity-80">{isRecording ? 'Recording' : 'Record'}</span>
           </button>
        )}

        <div className="w-px h-10 bg-white/10 mx-2"></div>

        <button 
           onClick={onLeave}
           className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors min-w-[64px] px-6"
        >
           <PhoneOff size={20} className="mb-1" />
           <span className="text-[10px] font-medium">{role === 'lecturer' ? 'End Class' : 'Leave'}</span>
        </button>
    </motion.div>
  );
}
