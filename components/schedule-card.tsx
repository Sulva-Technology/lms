'use client';

import { motion } from 'motion/react';
import { Video, MapPin, Clock } from 'lucide-react';
import Image from 'next/image';

interface ScheduleCardProps {
  title: string;
  time: string;
  duration: string;
  type: 'live' | 'in-person';
  location?: string;
  instructorUrl?: string;
  color?: string;
  delay?: number;
}

export function ScheduleCard({ title, time, duration, type, location, instructorUrl, color = 'blue', delay = 0 }: ScheduleCardProps) {
  const isLive = type === 'live';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass-panel p-4 rounded-2xl border-l-[3px] relative overflow-hidden group hover:bg-white/[0.05] transition-colors cursor-pointer
        ${color === 'blue' ? 'border-l-blue-500' : ''}
        ${color === 'purple' ? 'border-l-purple-500' : ''}
        ${color === 'emerald' ? 'border-l-emerald-500' : ''}
        ${color === 'orange' ? 'border-l-orange-500' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold tracking-wide text-slate-100">{time}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-xs text-slate-400 font-medium">{duration}</span>
          </div>
          <h4 className="font-outfit font-medium text-slate-200 group-hover:text-white transition-colors">{title}</h4>
        </div>
        
        <div className={`p-2 rounded-xl flex items-center justify-center
          ${isLive ? 'bg-red-500/10 text-red-400' : 'bg-slate-800/50 text-slate-400'}
        `}>
          {isLive ? (
            <div className="relative flex items-center justify-center">
              <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <Video size={16} className="relative" />
            </div>
          ) : (
            <MapPin size={16} />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          {instructorUrl && (
            <div className="h-6 w-6 rounded-full overflow-hidden relative border border-slate-600">
              <Image src={instructorUrl} alt="Instructor" fill className="object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          <span className="text-xs text-slate-400">Dr. Sarah Jenkins</span>
        </div>
        
        {location && (
          <div className="text-xs text-slate-500 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">
            {location}
          </div>
        )}
      </div>
    </motion.div>
  );
}
