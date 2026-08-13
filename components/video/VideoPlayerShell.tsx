"use client";

import { useState, useRef, useEffect } from "react";
import { VideoLessonData } from "@/types/video";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  lesson: VideoLessonData;
}

export function VideoPlayerShell({ lesson }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const handleMouseMove = () => {
    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isPlaying) {
      timeoutRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  useEffect(() => {
    // Simulate progress if playing
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            return 100;
          }
           // assuming it takes ~ 60s total in demo context
          return p + (100 / lesson.durationSeconds);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, lesson.durationSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = (progress / 100) * lesson.durationSeconds;

  return (
    <div 
      className="absolute inset-0 bg-slate-900 group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={togglePlay}
    >
      {/* Simulated Video Feed Map to something neat, e.g. a static image if no video */}
      <img src="https://picsum.photos/seed/video/1920/1080" alt="Video Placeholder" className={`w-full h-full object-cover transition-opacity duration-700 ${isPlaying ? 'opacity-80' : 'opacity-40'}`} />
      
      {/* Watermark Overlay */}
      <div className="absolute top-4 right-4 text-white/20 font-bold text-lg select-none pointer-events-none mix-blend-overlay">
         STUDENT_1032
      </div>

      {/* Play/Pause Center Indicator (Animates on click) */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
             <div className="w-20 h-20 rounded-full bg-blue-600/80 backdrop-blur-md flex items-center justify-center pl-1 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
                <Play size={36} className="text-white fill-white" />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls Area */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 px-4 pb-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onClick={e => e.stopPropagation()} // Prevent toggling play/pause when clicking controls
      >
         {/* Progress Bar Container */}
         <div className="relative h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer hover:h-2 transition-all group/bar">
            {/* Scrubber Area */}
            <div className="absolute left-0 h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}>
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full scale-0 group-hover/bar:scale-100 transition-transform shadow-md"></div>
            </div>
         </div>

         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
               <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                 {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current" />}
               </button>
               
               <div className="flex items-center gap-2 group/vol">
                 <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-blue-400 transition-colors">
                   {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                 </button>
                 <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 h-1.5 bg-white/20 rounded-full">
                    <div className="h-full bg-white rounded-full w-2/3"></div>
                 </div>
               </div>

               <div className="text-xs text-slate-300 font-medium hidden sm:block">
                  {formatTime(currentTime)} / {formatTime(lesson.durationSeconds)}
               </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
               <button className="text-xs font-semibold px-2 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-colors hidden sm:block">
                 1x
               </button>
               <button className="text-white hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <CheckCircle size={18} className="hidden sm:block text-slate-400" />
                  <span className="text-xs font-medium hidden sm:block hover:underline">Mark Complete</span>
               </button>
               <button className="text-white hover:text-blue-400 transition-colors">
                 <Settings size={20} />
               </button>
               <button className="text-white hover:text-blue-400 transition-colors">
                 <Maximize size={20} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
