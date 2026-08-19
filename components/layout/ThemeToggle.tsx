"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, type ThemeChoice } from "@/lib/ui/theme"

const THEME_EVENT = "vui-theme-change"

// The document attribute is the source of truth, so it is subscribed to rather
// than mirrored into state by an effect. Light is the server snapshot, which is
// what the document renders with before the cookie is read.
const subscribeTheme = (onChange: () => void) => {
  window.addEventListener(THEME_EVENT, onChange)
  return () => window.removeEventListener(THEME_EVENT, onChange)
}

const getThemeSnapshot = (): ThemeChoice =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light"

const getThemeServerSnapshot = (): ThemeChoice => "light"

/**
 * Light and dark are both designed modes, so this is a real preference rather
 * than an accessibility escape hatch.
 *
 * The attribute is set on the document immediately and the cookie is written
 * alongside it, so the switch is instant and the next server render already
 * knows the answer — there is no flash of the other theme on navigation.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = React.useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot)

  const apply = () => {
    // Read the live attribute rather than the rendered value: two clicks in the
    // same tick would otherwise both compute their target from the same stale one.
    const current = getThemeSnapshot()
    const next: ThemeChoice = current === "dark" ? "light" : "dark"
    document.documentElement.dataset.theme = next
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  const next = theme === "dark" ? "light" : "dark"

  return (
    <button
      type="button"
      onClick={apply}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn(
        "grid size-9 place-items-center rounded-[10px] text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink",
        className,
      )}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
