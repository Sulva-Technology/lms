"use client"

import * as React from "react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { MobileNav } from "./MobileNav"
import { AuthRole } from "@/types/auth"

export interface AppShellUser {
  id: string
  name: string
  email: string
  role: AuthRole
  avatarUrl?: string | null
  unreadNotifications?: number
  university?: {
    id: string
    name: string
    logoUrl?: string | null
  } | null
}

export function AppShell({ children, user }: { children: React.ReactNode; user: AppShellUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar user={user} onMenuClick={() => setMobileMenuOpen(true)} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 pb-24 lg:pb-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>

      <MobileNav 
        user={user}
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
    </div>
  )
}
