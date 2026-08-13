'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { PlayCircle, Clock, BookOpen } from 'lucide-react';

interface CourseCardProps {
  title: string;
  instructor: string;
  progress: number;
  imageSeed: string;
  totalChapters: number;
  completedChapters: number;
  timeRemaining?: string;
  delay?: number;
}

export function CourseCard({ title, instructor, progress, imageSeed, totalChapters, completedChapters, timeRemaining, delay = 0 }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="glass-panel group max-w-sm rounded-[24px] overflow-hidden flex flex-col cursor-pointer border border-white/5 hover:border-blue-500/40 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)] transition-all ease-out duration-300 relative"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors z-10" />
        <Image 
          src={`https://picsum.photos/seed/${imageSeed}/400/300`} 
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 z-20 glass-panel px-3 py-1.5 rounded-full text-xs font-medium border-white/20">
          Core Module
        </div>
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-blue-600 rounded-full p-4 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-[0_0_20px_rgba(37,99,235,0.8)]">
            <PlayCircle size={28} className="text-white ml-1" />
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="font-outfit text-xl font-semibold mb-1 line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-400">{instructor}</p>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-blue-400" /> {completedChapters}/{totalChapters} Chapters</span>
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-purple-400" /> {timeRemaining || '2h 15m left'}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400">Progress</span>
              <span className="text-blue-400">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full blur-[2px] right-0 translate-x-1/2"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
