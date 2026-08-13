"use client";

import { motion } from "motion/react";
import { LiveSession } from "@/types/live-class";
import { Calendar, Clock, Users, Video, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";

interface Props {
  session: LiveSession;
  role: 'student' | 'lecturer';
}

export function LiveClassCard({ session, role }: Props) {
  const isLive = session.status === 'live';
  const isCompleted = session.status === 'completed';

  const href = role === 'student' ? `/student/live-classes/${session.id}` : `/lecturer/live-classes/${session.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glass-panel p-6 rounded-2xl border relative overflow-hidden group transition-all duration-300 ${isLive ? 'border-blue-500/30 bg-blue-900/10 shadow-[0_5px_30px_rgba(37,99,235,0.15)]' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
    >
      {isLive && (
         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[40px] -mt-10 -mr-10"></div>
      )}
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2 items-center">
            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg border ${
              isLive ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              isCompleted ? 'bg-slate-500/10 border-slate-500/30 text-slate-400' :
              'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              {isLive ? <span className="flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span> LIVE NOW</span> : session.status}
            </span>
            <span className="text-xs font-medium text-slate-400 px-2 py-1 bg-slate-900 rounded-lg">{session.courseCode}</span>
          </div>
          
          <div className="flex bg-slate-900/50 rounded-lg px-2 py-1 items-center gap-1.5 border border-white/5 text-xs text-slate-300">
             <Calendar size={12} className="text-blue-400" /> {session.startTime}
          </div>
        </div>

        <h3 className="font-outfit text-xl font-semibold mb-2 text-slate-100 group-hover:text-blue-300 transition-colors">{session.topic}</h3>
        <p className="text-sm text-slate-400 mb-6">{session.courseTitle}</p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Avatar name={session.lecturerName} src={session.lecturerAvatar} size={28} />
             <span className="text-sm text-slate-300">{session.lecturerName}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
             <span className="flex items-center gap-1"><Clock size={14}/> {session.duration}</span>
             <span className="flex items-center gap-1"><Users size={14}/> {session.participantsCount}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
          {isLive || session.status === 'scheduled' ? (
             <Link href={href} className={`flex-1 py-2.5 rounded-lg font-medium text-sm text-center transition-all flex items-center justify-center gap-2 ${isLive ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
               <Video size={16} /> {isLive ? 'Join Room' : 'Enter Waiting Room'}
             </Link>
          ) : (
             <button className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors flex items-center justify-center gap-2">
               Watch Recording <ExternalLink size={16} />
             </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
