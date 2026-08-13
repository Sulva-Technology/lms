"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Filter, ChevronDown } from "lucide-react"

export interface FilterDropdownProps {
  label?: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterDropdown({ label = "Filter", options, value, onChange, className }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
      >
        <Filter size={16} className="text-slate-400" />
        <span>{label}: {selectedOption?.label || "All"}</span>
        <ChevronDown size={14} className="text-slate-500 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-48 right-0 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 glass-panel">
          <div className="p-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                  value === option.value 
                    ? "bg-blue-500/20 text-blue-300" 
                    : "text-slate-300 hover:bg-white/5"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
