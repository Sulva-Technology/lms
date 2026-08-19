"use client"

import * as React from "react"
import { University } from "@/types/auth"
import { motion } from "motion/react"
import { Search, Building, ChevronRight, Check } from "lucide-react"
import { useRouter } from "next/navigation"

export function UniversitySelector({ universities }: { universities: University[] }) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const filteredUnis = universities.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.domain.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (id: string) => {
    setSelectedId(id)
    // Add small delay to show selected state before navigating
    setTimeout(() => {
      router.push("/onboarding/role")
    }, 400)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h1 className="font-outfit text-3xl md:text-4xl font-bold text-ink tracking-tight">Select your university</h1>
        <p className="text-ink-muted text-lg">Find your institution to join their learning platform.</p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-ink-subtle" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-line text-ink rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-primary/25 block pl-12 pr-4 py-4 transition-all outline-none font-medium shadow-inner"
            placeholder="Search by name or domain..."
          />
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {filteredUnis.length === 0 ? (
            <div className="text-center py-12 text-ink-subtle">
              <Building size={48} className="mx-auto mb-4 opacity-20" />
              <p>No universities found matching "{search}"</p>
            </div>
          ) : (
            filteredUnis.map((uni, idx) => {
              const isSelected = selectedId === uni.id;
              return (
                <motion.button
                  key={uni.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleSelect(uni.id)}
                  className={`w-full flex items-center p-4 rounded-2xl border transition-all text-left group ${
                    isSelected 
                      ? "bg-primary-soft border-primary/25" 
                      : "bg-status-soft border-line hover:bg-ink/[0.06] hover:border-line-strong"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 transition-colors ${
                    isSelected ? "bg-primary text-primary-contrast" : "bg-surface text-ink-muted group-hover:text-primary"
                  }`}>
                    <Building size={24} />
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <h3 className={`font-semibold truncate transition-colors ${isSelected ? "text-primary" : "text-ink group-hover:text-primary"}`}>
                      {uni.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-ink-subtle mt-0.5">
                      <span className="truncate">{uni.domain}</span>
                      {uni.location && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <span className="truncate">{uni.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? "bg-primary text-primary-contrast" : "text-ink-subtle group-hover:text-ink-muted"
                  }`}>
                    {isSelected ? <Check size={18} /> : <ChevronRight size={20} />}
                  </div>
                </motion.button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
