"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { usePathname } from "next/navigation"
import { AppShellUser } from "./AppShell"
import { LogoutButton } from "./LogoutButton"
import { NotificationBell } from "./NotificationBell"

export function Topbar({ user, onMenuClick }: { user: AppShellUser; onMenuClick: () => void }) {
  const pathname = usePathname()
  const avatarUrl = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e293b&color=fff`
  
  // Basic breadcrumb generation based on path
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumb = pathSegments.length > 0 
    ? pathSegments[pathSegments.length - 1].replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())
    : "Dashboard"

  return (
    <header className="h-16 shrink-0 bg-slate-900/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 lg:px-8 z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="font-outfit font-semibold text-lg text-white hidden sm:block">
          {breadcrumb}
        </h1>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="hidden md:flex relative group hidden">
           {/* Search temporarily disabled visually for simplicity, will add component later */}
        </div>
        
        {user.university && user.role !== "super_admin" && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
            {user.university.name}
          </div>
        )}

        <NotificationBell userId={user.id} initialUnread={user.unreadNotifications ?? 0} />

        <div className="flex items-center gap-2 cursor-pointer pl-2 lg:pl-4 lg:border-l border-white/10">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
            <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <LogoutButton collapsed className="hidden sm:inline-flex" />
      </div>
    </header>
  )
}
