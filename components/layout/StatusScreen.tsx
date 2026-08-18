import * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

export interface StatusScreenAction {
  href: string
  label: string
  variant?: "primary" | "outline"
}

/**
 * The shared shape of every "this went wrong" page: not found, unavailable,
 * unauthorized. One component so the three cannot drift apart.
 */
export function StatusScreen({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions = [],
  tone = "neutral",
}: {
  icon?: LucideIcon
  eyebrow: string
  title: string
  description: React.ReactNode
  actions?: StatusScreenAction[]
  tone?: "neutral" | "danger"
}) {
  return (
    <main className="surface-wash flex min-h-screen items-center justify-center px-5 py-16">
      <section className="panel w-full max-w-lg rounded-panel p-8 text-center sm:p-12">
        {Icon ? (
          <span
            className={
              tone === "danger"
                ? "mx-auto grid size-14 place-items-center rounded-card bg-danger/10 text-danger"
                : "mx-auto grid size-14 place-items-center rounded-card bg-primary-soft text-primary-soft-contrast"
            }
          >
            <Icon size={26} />
          </span>
        ) : null}

        <p className="eyebrow mt-7">{eyebrow}</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>

        {actions.length > 0 ? (
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            {actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={
                  action.variant === "outline"
                    ? "rounded-pill border border-line-strong px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink/[0.04]"
                    : "rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-hover"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  )
}
