import * as React from "react"
import { BookOpen, Settings, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { labelsFor, type Vocabulary } from "@/lib/ui/labels"

export interface RoleBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  role: "admin" | "student" | "lecturer" | "guest"
  vocabulary?: Vocabulary
}

export function RoleBadge({ className, role, vocabulary = "academic", ...props }: RoleBadgeProps) {
  const labels = labelsFor(vocabulary)

  const config = {
    admin: { icon: Shield, text: "Admin", tone: "bg-primary-soft text-primary-soft-contrast" },
    lecturer: { icon: BookOpen, text: labels.instructor, tone: "bg-secondary-soft text-secondary-soft-contrast" },
    student: { icon: null, text: labels.learner, tone: "bg-status-soft text-ink-muted" },
    guest: { icon: Settings, text: "Guest", tone: "bg-status-soft text-ink-subtle" },
  }[role]

  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        config.tone,
        className,
      )}
      {...props}
    >
      {Icon ? <Icon size={12} /> : null}
      {config.text}
    </span>
  )
}
