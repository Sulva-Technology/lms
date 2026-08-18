"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Cta } from "./primitives"
import { SchoolBrandMark } from "./SchoolBrandMark"

export interface LandingNavbarProps {
  /** A school host brands the bar with its own name and logo. */
  brand?: { name: string; logoUrl?: string | null }
  links?: Array<{ href: string; label: string }>
  ctaLabel?: string
  /** Hidden when the primary call to action is already "sign in". */
  showSignInLink?: boolean
}

const PLATFORM_LINKS = [
  { href: "#problem", label: "Why" },
  { href: "#how", label: "How it works" },
  { href: "#platform", label: "Platform" },
  { href: "#security", label: "Security" },
]

export function LandingNavbar({
  brand,
  links = PLATFORM_LINKS,
  ctaLabel = "Get started",
  showSignInLink = true,
}: LandingNavbarProps) {
  // The bar is transparent over the hero and only becomes glass once the page
  // has moved, so the first screen stays uninterrupted.
  const [lifted, setLifted] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        lifted ? "glass border-b" : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <SchoolBrandMark name={brand?.name ?? "VUI LMS"} logoUrl={brand?.logoUrl} size={36} />
          <span className="truncate font-display text-lg font-semibold tracking-tight text-ink">
            {brand?.name ?? "VUI LMS"}
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showSignInLink ? (
            <Cta href="/login" variant="ghost" size="md" className="hidden sm:inline-flex">
              Sign in
            </Cta>
          ) : null}
          <Cta href="/login" size="md">
            {ctaLabel}
          </Cta>
        </div>
      </nav>
    </header>
  )
}
