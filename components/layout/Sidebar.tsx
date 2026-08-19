"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { getNavigationForRole } from "@/lib/navigation"
import { roleLabels } from "@/lib/auth/roles"
import { Avatar } from "@/components/ui/avatar"
import { SchoolBrandMark } from "@/components/landing/SchoolBrandMark"
import { AppShellUser } from "./AppShell"
import { LogoutButton } from "./LogoutButton"

const COLLAPSE_KEY = "vui-sidebar-collapsed"
const COLLAPSE_EVENT = "vui-sidebar-collapse"

// localStorage is an external store, so it is subscribed to rather than copied
// into state by an effect. The server snapshot is the expanded width, so the
// server and the first client paint still agree before the stored value applies.
const subscribeCollapsed = (onChange: () => void) => {
  window.addEventListener("storage", onChange)
  window.addEventListener(COLLAPSE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(COLLAPSE_EVENT, onChange)
  }
}

const getCollapsedSnapshot = () => window.localStorage.getItem(COLLAPSE_KEY) === "1"
const getCollapsedServerSnapshot = () => false

export function Sidebar({ user }: { user: AppShellUser }) {
  const pathname = usePathname()
  const navItems = getNavigationForRole(user.role, user.vocabulary)
  const collapsed = React.useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  )

  const toggle = () => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1")
    window.dispatchEvent(new Event(COLLAPSE_EVENT))
  }

  const brandName = user.university?.name ?? "Sulva LMS"

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 264 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="z-40 hidden shrink-0 flex-col border-r border-line bg-canvas-sunken lg:flex"
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
        <SchoolBrandMark name={brandName} logoUrl={user.university?.logoUrl} size={32} />
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-ink">{brandName}</p>
            <p className="truncate text-xs text-ink-subtle">{roleLabels[user.role]}</p>
          </div>
        ) : null}
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-5">
        {!collapsed ? <p className="eyebrow px-3 pb-3">Menu</p> : null}
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-primary-soft font-medium text-primary-soft-contrast"
                      : "text-ink-muted hover:bg-ink/[0.05] hover:text-ink",
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="sidebar-active"
                      aria-hidden
                      className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                    />
                  ) : null}
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                  {item.badge ? (
                    collapsed ? (
                      <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
                    ) : (
                      <span className="shrink-0 rounded-pill bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-contrast">
                        {item.badge}
                      </span>
                    )
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-[10px] px-2 py-2",
            collapsed && "justify-center px-0",
          )}
        >
          <Avatar name={user.name} src={user.avatarUrl} size={30} />
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink-subtle">{user.email}</p>
            </div>
          ) : null}
        </div>

        <div className={cn("mt-2 flex items-center gap-2", collapsed && "flex-col")}>
          <LogoutButton collapsed={collapsed} className={collapsed ? undefined : "flex-1"} />
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid size-9 shrink-0 place-items-center rounded-[10px] text-ink-subtle transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
