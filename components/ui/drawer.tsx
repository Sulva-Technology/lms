"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: "left" | "right";
  className?: string;
}

export function Drawer({ isOpen, onClose, title, children, position = "right", className }: DrawerProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const slideVariants = {
    hidden: { x: position === "right" ? "100%" : "-100%", opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: position === "right" ? "100%" : "-100%", opacity: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 bottom-0 z-[70] w-full max-w-sm flex flex-col",
              position === "right" ? "right-0" : "left-0",
              "bg-slate-900/95 backdrop-blur-3xl border-white/10 shadow-2xl",
              position === "right" ? "border-l" : "border-r",
              className
            )}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              {title && <h2 className="text-xl font-outfit font-semibold text-white">{title}</h2>}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-auto"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  )
}
