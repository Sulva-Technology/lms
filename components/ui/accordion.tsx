"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown } from "lucide-react"

interface AccordionContextType {
  openItems: string[];
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);

export function Accordion({ 
  children, 
  allowMultiple = false, 
  defaultOpen = [],
  className 
}: { 
  children: React.ReactNode; 
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}) {
  const [openItems, setOpenItems] = React.useState<string[]>(defaultOpen);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setOpenItems(prev => prev.includes(id) ? [] : [id]);
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, allowMultiple }}>
      <div className={cn("space-y-4", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({ id, title, children, className }: { id: string; title: React.ReactNode; children: React.ReactNode; className?: string; }) {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be inside Accordion");

  const isOpen = ctx.openItems.includes(id);

  return (
    <div className={cn("bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden glass-panel transition-colors", className)}>
      <button 
        onClick={() => ctx.toggleItem(id)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="font-outfit text-lg font-semibold text-slate-100">{title}</div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <motion.div 
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden bg-slate-950/50"
      >
        <div className="p-6 pt-2 border-t border-white/5">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
