"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { createAnnouncementAction } from "@/app/actions/announcements";

interface CourseOption {
  id: string;
  code: string;
  title: string;
}

export function AnnouncementComposer({ courses = [] }: { courses?: CourseOption[] }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetId, setTargetId] = useState("university");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!title.trim() || !content.trim()) return;

    setIsLoading(true);
    const result = await createAnnouncementAction({
      title,
      content,
      targetScope: targetId === "university" ? "university" : "course_section",
      targetId: targetId === "university" ? undefined : targetId,
      isPublished: true,
    });
    setIsLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setTitle("");
    setContent("");
    setSuccess("Announcement posted.");
  };

  return (
    <div className="bg-surface backdrop-blur-2xl p-6 rounded-2xl border border-line">
       <h3 className="font-outfit font-semibold text-lg text-ink mb-4">Post Announcement</h3>
       <form onSubmit={handleSubmit}>
          <div className="bg-surface rounded-xl border border-line overflow-hidden focus-within:border-primary/25 transition-colors mb-3">
             <input
               value={title}
               onChange={e => setTitle(e.target.value)}
               placeholder="Announcement title"
               className="w-full bg-transparent p-4 text-sm text-ink placeholder-slate-500 focus:outline-none border-b border-line"
             />
             <textarea
               value={content}
               onChange={e => setContent(e.target.value)}
               placeholder="Share an update with your students..."
               rows={4}
               className="w-full bg-transparent p-4 text-sm text-ink placeholder-slate-500 focus:outline-none resize-none"
             />
             <div className="px-3 py-2 border-t border-line bg-surface flex items-center justify-between gap-3">
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="bg-surface text-xs text-ink-muted border border-line rounded-lg p-2 outline-none max-w-[180px]"
                >
                  <option value="university">University</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.code}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!title.trim() || !content.trim() || isLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-surface disabled:text-ink-subtle text-ink text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                   {isLoading ? <Loader2 size={14} className="animate-spin" /> : <><span>Post</span><Send size={14} /></>}
                </button>
             </div>
          </div>
       </form>

       {(error || success) && (
         <motion.div
           initial={{ opacity: 0, y: -6 }}
           animate={{ opacity: 1, y: 0 }}
           className={`mt-3 rounded-xl border px-3 py-2 text-sm flex items-center gap-2 ${
             error ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
           }`}
         >
           {error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
           {error || success}
         </motion.div>
       )}
    </div>
  );
}
