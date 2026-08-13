"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"

export interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex overflow-x-auto no-scrollbar border-b border-slate-800", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors",
              isActive ? "text-white" : "text-slate-400 hover:text-slate-300"
            )}
          >
            {tab.label}
            {isActive && (
              <motion.div 
                layoutId="vui-tabs-indicator"
                className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-lg"
              />
            )}
          </button>
        );
      })}
    </div>
  )
}
