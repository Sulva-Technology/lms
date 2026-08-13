"use client";

import { StudentQuestion } from "@/types/lecturer";
import { MessageSquare, Reply } from "lucide-react";

interface Props {
  question: StudentQuestion;
}

export function StudentQuestionCard({ question }: Props) {
  return (
    <div className="glass-panel p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-white/10">
               {question.studentAvatar ? <img src={question.studentAvatar} alt={question.studentName} className="w-full h-full object-cover" /> : <span className="text-[10px] pl-1 font-bold">{question.studentName[0]}</span>}
            </div>
            <span className="text-xs font-medium text-slate-300">{question.studentName}</span>
            <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">{question.course}</span>
         </div>
         <span className="text-[10px] text-slate-500">{question.timeAgo}</span>
      </div>
      
      <p className="text-sm text-slate-300 leading-relaxed mb-3 line-clamp-2">"{question.question}"</p>
      
      <div className="flex justify-end">
         <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors flex items-center gap-1.5 border border-blue-500/20">
            <Reply size={14} /> Answer
         </button>
      </div>
    </div>
  );
}
