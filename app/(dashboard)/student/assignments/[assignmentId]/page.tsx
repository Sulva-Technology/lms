"use client";
import { GenericList } from "@/components/academic/GenericList";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AssignmentDetailPage() {
  const params = useParams();
  
  return (
    <GenericList title="Assignment Details" icon={FileText}>
      <div className="mb-4">
        <Link href="/student/assignments" className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Assignments
        </Link>
      </div>
      <div className="glass-panel p-8 text-left border border-white/5 rounded-2xl space-y-6">
        <div>
           <h2 className="text-2xl font-outfit font-bold text-white mb-2">Assignment {params.assignmentId}</h2>
           <p className="text-slate-400">Complete the attached worksheet and submit via the portal.</p>
        </div>
        
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
           <div className="text-sm text-slate-400 mb-1">Status</div>
           <div className="font-medium text-white flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-blue-500"></span> Pending Submission
           </div>
        </div>

        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
           Submit Assignment
        </button>
      </div>
    </GenericList>
  );
}
