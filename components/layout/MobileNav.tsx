"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getNavigationForRole } from "@/lib/navigation"
import { motion, AnimatePresence } from "motion/react"
import { X, LayoutTemplate, Building, BookOpen, GraduationCap } from "lucide-react"
import { AppShellUser } from "./AppShell"
import { LogoutButton } from "./LogoutButton"
import { Avatar } from "@/components/ui/avatar"

interface MobileNavProps {
  user: AppShellUser
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ user, isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const navItems = getNavigationForRole(user.role)
  
  // We take the first 4 items for the bottom tab bar (mobile)
  const tabItems = navItems.slice(0, 4)

  const BrandIcon = user.role === "super_admin" ? LayoutTemplate : 
                    user.role === "admin" ? Building : 
                    user.role === "lecturer" ? BookOpen : GraduationCap

  return (
    <>
      {/* Bottom Tab Navigation (visible on mobile only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-3xl border-t border-white/10 z-40 flex items-center justify-around px-2 pb-safe">
        {tabItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link 
              key={item.id} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors relative",
                isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-300"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="mobile-tab-active"
                  className="absolute top-0 w-8 h-0.5 bg-blue-500 rounded-b-full"
                />
              )}
              <item.icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
              {item.badge && (
                <span className="absolute top-2 right-3 w-2 h-2 bg-blue-500 rounded-full border border-slate-900" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] bg-slate-900/95 backdrop-blur-3xl border-r border-white/10 z-[70] lg:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-glow-blue">
                    <BrandIcon className="text-white" size={18} />
                  </div>
                  <span className="font-outfit font-bold text-lg text-white">VUI LMS</span>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link 
                        key={item.id} 
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                          isActive 
                            ? "bg-blue-500/15 text-blue-400" 
                            : "text-slate-400 active:bg-white/5"
                        )}
                      >
                        <item.icon size={20} />
                        <span className="font-medium text-sm flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                           {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
              
              <div className="p-4 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <Avatar name={user.name} src={user.avatarUrl} size={40} />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <LogoutButton />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
