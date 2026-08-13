"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getNavigationForRole } from "@/lib/navigation"
import { motion, AnimatePresence } from "motion/react"
import { BookOpen, GraduationCap, Building, LayoutTemplate } from "lucide-react"
import { AppShellUser } from "./AppShell"
import { LogoutButton } from "./LogoutButton"

export function Sidebar({ user }: { user: AppShellUser }) {
  const pathname = usePathname()
  const navItems = getNavigationForRole(user.role)
  const [collapsed, setCollapsed] = React.useState(false)

  const BrandIcon = user.role === "super_admin" ? LayoutTemplate : 
                    user.role === "admin" ? Building : 
                    user.role === "lecturer" ? BookOpen : GraduationCap
  const avatarUrl = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e293b&color=fff`

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="hidden lg:flex flex-col bg-slate-900/40 backdrop-blur-3xl border-r border-white/10 shrink-0 z-50 transition-all duration-300 ease-spring"
    >
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0 cursor-pointer select-none" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-glow-blue">
            <BrandIcon className="text-white" size={18} />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-outfit font-bold text-lg text-white whitespace-nowrap"
              >
                VUI LMS
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link 
                key={item.id} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden",
                  isActive 
                    ? "bg-blue-500/15 text-blue-400" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full top-1/2 -translate-y-1/2"
                  />
                )}
                <item.icon size={20} className={cn("shrink-0", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                {!collapsed && (
                  <span className="font-medium text-sm whitespace-nowrap flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {!collapsed && (
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <img src={avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-white/10" />
            <div className="overflow-hidden">
               <p className="text-xs font-semibold text-white truncate">{user.name}</p>
               <p className="text-[10px] text-slate-400 truncate capitalize">{user.role.replace("_", " ")}</p>
            </div>
          </div>
          <LogoutButton className="mt-3" />
        </div>
      )}
      {collapsed && (
        <div className="p-4 border-t border-white/10 shrink-0 flex flex-col items-center gap-3">
          <img src={avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-white/10" title={user.name} />
          <LogoutButton collapsed />
        </div>
      )}
    </motion.aside>
  )
}
