"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Menu } from "lucide-react"
import { usePathname } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { AppShellUser } from "./AppShell"
import { NotificationBell } from "./NotificationBell"
import { ThemeToggle } from "./ThemeToggle"

const titleCase = (segment: string) =>
  segment.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())

/** A UUID in a breadcrumb tells nobody anything. */
const isIdSegment = (segment: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment) || /^\d+$/.test(segment)

export function Topbar({ user, onMenuClick }: { user: AppShellUser; onMenuClick: () => void }) {
  const pathname = usePathname()

  const crumbs = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    return segments.map((segment, index) => ({
      label: isIdSegment(segment) ? "Detail" : titleCase(segment),
      href: "/" + segments.slice(0, index + 1).join("/"),
      last: index === segments.length - 1,
    }))
  }, [pathname])

  const current = crumbs[crumbs.length - 1]?.label ?? "Dashboard"

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-canvas/85 px-4 backdrop-blur-md lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="-ml-2 grid size-10 place-items-center rounded-[10px] text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink lg:hidden"
        >
          <Menu size={20} />
        </button>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
          <ol className="flex items-center gap-1.5 text-sm">
            {crumbs.map((crumb) => (
              <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
                {crumb.last ? (
                  <span className="truncate font-display font-semibold text-ink">{crumb.label}</span>
                ) : (
                  <>
                    <Link
                      href={crumb.href}
                      className="truncate text-ink-subtle transition-colors hover:text-ink"
                    >
                      {crumb.label}
                    </Link>
                    <ChevronRight size={14} className="shrink-0 text-ink-subtle" aria-hidden />
                  </>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <h1 className="truncate font-display font-semibold text-ink md:hidden">{current}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        {user.university && user.role !== "super_admin" ? (
          <span className="mr-1 hidden items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink-muted xl:inline-flex">
            <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden />
            {user.university.name}
          </span>
        ) : null}

        <ThemeToggle />
        <NotificationBell userId={user.id} initialUnread={user.unreadNotifications ?? 0} />

        <Link
          href={`/${user.role === "super_admin" ? "superadmin" : user.role}/settings`}
          className="ml-1 rounded-full"
          aria-label="Your settings"
        >
          <Avatar name={user.name} src={user.avatarUrl} size={32} />
        </Link>
      </div>
    </header>
  )
}
