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
      className={`panel p-6 rounded-2xl border relative overflow-hidden group transition-all duration-300 ${isLive ? 'border-primary/25 bg-primary-soft shadow-[0_5px_30px_rgba(37,99,235,0.15)]' : 'border-line hover:border-line hover:bg-ink/[0.06]'}`}
    >
      {isLive && (
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary-soft blur-[40px] -mt-10 -mr-10"></div>
      )}
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2 items-center">
            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg border ${
              isLive ? 'bg-red-500/10 border-red-500/30 text-danger' :
              isCompleted ? 'bg-slate-500/10 border-slate-500/30 text-ink-muted' :
              'bg-primary-soft border-primary/25 text-primary'
            }`}>
              {isLive ? <span className="flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span> LIVE NOW</span> : session.status}
            </span>
            <span className="text-xs font-medium text-ink-muted px-2 py-1 bg-surface rounded-lg">{session.courseCode}</span>
          </div>
          
          <div className="flex bg-surface rounded-lg px-2 py-1 items-center gap-1.5 border border-line text-xs text-ink-muted">
             <Calendar size={12} className="text-primary" /> {session.startTime}
          </div>
        </div>

        <h3 className="font-outfit text-xl font-semibold mb-2 text-ink group-hover:text-primary transition-colors">{session.topic}</h3>
        <p className="text-sm text-ink-muted mb-6">{session.courseTitle}</p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Avatar name={session.lecturerName} src={session.lecturerAvatar} size={28} />
             <span className="text-sm text-ink-muted">{session.lecturerName}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-ink-muted">
             <span className="flex items-center gap-1"><Clock size={14}/> {session.duration}</span>
             <span className="flex items-center gap-1"><Users size={14}/> {session.participantsCount}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-line flex gap-3">
          {isLive || session.status === 'scheduled' ? (
             <Link href={href} className={`flex-1 py-2.5 rounded-lg font-medium text-sm text-center transition-all flex items-center justify-center gap-2 ${isLive ? 'bg-primary hover:bg-primary-hover text-primary-contrast shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-status-soft hover:bg-ink/[0.06] text-ink'}`}>
               <Video size={16} /> {isLive ? 'Join Room' : 'Enter Waiting Room'}
             </Link>
          ) : (
             <button className="flex-1 py-2.5 rounded-lg bg-surface hover:bg-slate-700 text-ink-muted font-medium text-sm transition-colors flex items-center justify-center gap-2">
               Watch Recording <ExternalLink size={16} />
             </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
