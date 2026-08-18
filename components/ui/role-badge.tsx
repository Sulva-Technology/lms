import * as React from "react"
import { cn } from "@/lib/utils"
import { labelsFor, type Vocabulary } from "@/lib/ui/labels"
import { Shield, BookOpen, Settings } from "lucide-react"

export interface RoleBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  role: "admin" | "student" | "lecturer" | "guest";
  vocabulary?: Vocabulary;
}

export function RoleBadge({ className, role, vocabulary = "academic", ...props }: RoleBadgeProps) {
  const labels = labelsFor(vocabulary);

  const getRoleConfig = () => {
    switch (role) {
      case "admin":
        return { icon: Shield, text: "Admin", classes: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" };
      case "lecturer":
        return { icon: BookOpen, text: labels.instructor, classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
      case "student":
        return { icon: null, text: labels.learner, classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      default:
        return { icon: Settings, text: "Guest", classes: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
    }
  };

  const config = getRoleConfig();
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium whitespace-nowrap",
        config.classes,
        className
      )}
      {...props}
    >
      {Icon && <Icon size={12} />}
      {config.text}
    </span>
  )
}
