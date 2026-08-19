"use client";

import { StudentQuestion } from "@/types/lecturer";
import { MessageSquare, Reply } from "lucide-react";

interface Props {
  question: StudentQuestion;
}

export function StudentQuestionCard({ question }: Props) {
  return (
    <div className="panel p-4 rounded-xl border border-line hover:bg-ink/[0.06] transition-colors group">
      <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-surface overflow-hidden shrink-0 border border-line">
               {question.studentAvatar ? <img src={question.studentAvatar} alt={question.studentName} className="w-full h-full object-cover" /> : <span className="text-[10px] pl-1 font-bold">{question.studentName[0]}</span>}
            </div>
            <span className="text-xs font-medium text-ink-muted">{question.studentName}</span>
            <span className="text-[10px] text-ink-subtle px-1.5 py-0.5 rounded bg-surface">{question.course}</span>
         </div>
         <span className="text-[10px] text-ink-subtle">{question.timeAgo}</span>
      </div>
      
      <p className="text-sm text-ink-muted leading-relaxed mb-3 line-clamp-2">"{question.question}"</p>
      
      <div className="flex justify-end">
         <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-soft text-primary hover:bg-primary-soft transition-colors flex items-center gap-1.5 border border-primary/25">
            <Reply size={14} /> Answer
         </button>
      </div>
    </div>
  );
}
