"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getNavigationForRole } from "@/lib/navigation"
import { roleLabels } from "@/lib/auth/roles"
import { Avatar } from "@/components/ui/avatar"
import { SchoolBrandMark } from "@/components/landing/SchoolBrandMark"
import { AppShellUser } from "./AppShell"
import { LogoutButton } from "./LogoutButton"
import { ThemeToggle } from "./ThemeToggle"

interface MobileNavProps {
  user: AppShellUser
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ user, isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const navItems = getNavigationForRole(user.role, user.vocabulary)
  const tabItems = navItems.slice(0, 4)
  const brandName = user.university?.name ?? "VUI LMS"

  // A drawer that leaves the page scrolling behind it feels broken on a phone.
  React.useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t border-line bg-canvas/95 px-2 backdrop-blur-xl lg:hidden"
      >
        {tabItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex w-16 flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-ink-subtle",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="mobile-tab-active"
                  aria-hidden
                  className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary"
                />
              ) : null}
              <item.icon size={19} />
              <span className="w-full truncate text-center text-[10px] font-medium">
                {item.label}
              </span>
              {item.badge ? (
                <span className="absolute top-2.5 right-3 size-1.5 rounded-full bg-primary" />
              ) : null}
            </Link>
          )
        })}
      </nav>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[60] bg-[#160d1b]/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.38 }}
              className="fixed inset-y-0 left-0 z-[70] flex w-[280px] flex-col border-r border-line bg-canvas-sunken lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
                <SchoolBrandMark name={brandName} logoUrl={user.university?.logoUrl} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-ink">{brandName}</p>
                  <p className="truncate text-xs text-ink-subtle">{roleLabels[user.role]}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="-mr-1 grid size-9 place-items-center rounded-[10px] text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
                <ul className="flex flex-col gap-0.5">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm transition-colors",
                            isActive
                              ? "bg-primary-soft font-medium text-primary-soft-contrast"
                              : "text-ink-muted active:bg-ink/[0.05]",
                          )}
                        >
                          <item.icon size={19} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge ? (
                            <span className="rounded-pill bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-contrast">
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="shrink-0 border-t border-line p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar name={user.name} src={user.avatarUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                    <p className="truncate text-xs text-ink-subtle">{user.email}</p>
                  </div>
                  <ThemeToggle />
                </div>
                <LogoutButton />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
