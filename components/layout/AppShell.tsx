"use client"

import * as React from "react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { MobileNav } from "./MobileNav"
import type { Vocabulary } from "@/lib/ui/labels"
import type { TenantMode } from "@/lib/tenant/mode"
import { AuthRole } from "@/types/auth"

export interface AppShellUser {
  id: string
  name: string
  email: string
  role: AuthRole
  avatarUrl?: string | null
  unreadNotifications?: number
  vocabulary?: Vocabulary
  mode?: TenantMode
  university?: {
    id: string
    name: string
    logoUrl?: string | null
  } | null
}

export function AppShell({ children, user }: { children: React.ReactNode; user: AppShellUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[80] focus:rounded-[10px] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-contrast"
      >
        Skip to content
      </a>

      <Sidebar user={user} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onMenuClick={() => setMobileMenuOpen(true)} />

        <main
          id="main"
          className="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-4 pt-6 pb-24 lg:px-8 lg:pt-8 lg:pb-10"
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <MobileNav user={user} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  )
}
