"use client"

import * as React from "react"
import { RoleOption } from "@/types/auth"
import { motion } from "motion/react"
import { GraduationCap, BookOpen, Building, ChevronRight, Check } from "lucide-react"
import { useRouter } from "next/navigation"

const iconMap = {
  GraduationCap,
  BookOpen,
  Building
}

export function RoleSelector({ roles }: { roles: RoleOption[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    // Add user role context or state here
    setTimeout(() => {
      // Pass role as query param for simple state management in prototype
      router.push(`/onboarding/profile?role=${id}`)
    }, 400)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h1 className="font-outfit text-3xl md:text-4xl font-bold text-ink tracking-tight">Choose your role</h1>
        <p className="text-ink-muted text-lg">Select how you'll be using the platform.</p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {roles.map((role, idx) => {
          const isSelected = selectedId === role.id;
          const IconComponent = iconMap[role.icon as keyof typeof iconMap] || Building
          
          return (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
              onClick={() => handleSelect(role.id)}
              className={`relative flex flex-col p-6 rounded-3xl border transition-all text-left overflow-hidden group ${
                isSelected 
                  ? "bg-primary-soft border-primary/25 ring-1 ring-blue-500/50" 
                  : "panel hover:-translate-y-1 hover:shadow-xl hover:border-line-strong"
              }`}
            >
              {isSelected && (
                <motion.div 
                  layoutId="role-active-bg"
                  className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/10 -z-10"
                />
              )}
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 mb-6 transition-colors shadow-lg ${
                isSelected 
                  ? "bg-primary text-primary-contrast" 
                  : "bg-surface text-ink-muted group-hover:bg-slate-700 group-hover:text-ink"
              }`}>
                <IconComponent size={28} />
              </div>
              
              <h3 className={`text-xl font-bold font-outfit mb-2 transition-colors ${isSelected ? "text-primary" : "text-ink"}`}>
                {role.title}
              </h3>
              
              <p className="text-ink-muted text-sm leading-relaxed mb-6 flex-1">
                {role.description}
              </p>

              <div className={`mt-auto w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isSelected ? "bg-primary text-primary-contrast ml-auto" : "bg-status-soft text-ink-subtle group-hover:bg-ink/[0.06] group-hover:text-ink-muted ml-auto"
              }`}>
                {isSelected ? <Check size={16} /> : <ChevronRight size={16} />}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
