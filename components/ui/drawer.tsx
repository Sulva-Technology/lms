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
            className="fixed inset-0 z-[60] bg-status-soft backdrop-blur-sm"
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
              "bg-surface backdrop-blur-3xl border-line shadow-2xl",
              position === "right" ? "border-l" : "border-r",
              className
            )}
          >
            <div className="flex items-center justify-between p-6 border-b border-line">
              {title && <h2 className="text-xl font-outfit font-semibold text-ink">{title}</h2>}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-ink/[0.06] text-ink-muted hover:text-ink transition-colors ml-auto"
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
