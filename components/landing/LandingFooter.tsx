import * as React from "react"
import Link from "next/link"
import { SchoolBrandMark } from "./SchoolBrandMark"

export interface LandingFooterProps {
  /** A school host signs the footer with its own name, logo and copyright. */
  brand?: { name: string; logoUrl?: string | null; tagline?: string; host?: string }
}

const COLUMNS = [
  {
    heading: "Platform",
    links: [
      { href: "/student", label: "For students" },
      { href: "/lecturer", label: "For lecturers" },
      { href: "/admin", label: "For administrators" },
      { href: "/student/live-classes", label: "Live classes" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/design-system", label: "Design system" },
      { href: "/docs/vui-lms-master-design-system", label: "Documentation" },
      { href: "/docs/component-library", label: "Component library" },
      { href: "/docs/live-class-design", label: "Live class guide" },
    ],
  },
  {
    heading: "Institution",
    links: [
      { href: "#security", label: "Security" },
      { href: "#contact", label: "Contact" },
      { href: "/docs/auth-onboarding-design", label: "Onboarding" },
      { href: "/login", label: "Sign in" },
    ],
  },
]

export function LandingFooter({ brand }: LandingFooterProps) {
  const tagline =
    brand?.tagline ??
    "One system for registration, teaching and results — owned by the institution that runs it."

  return (
    <footer id="resources" className="border-t border-line bg-canvas px-5 pt-20 pb-10 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <SchoolBrandMark name={brand?.name ?? "VUI LMS"} logoUrl={brand?.logoUrl} size={32} />
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              {brand?.name ?? "VUI LMS"}
            </span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">{tagline}</p>
          {brand?.host ? <p className="mt-3 text-sm text-ink-subtle">{brand.host}</p> : null}
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <h4 className="eyebrow">{column.heading}</h4>
            <ul className="mt-5 space-y-3 text-sm text-ink-muted">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-line pt-8 text-sm text-ink-subtle md:flex-row">
        <p>
          © {new Date().getFullYear()} {brand ? `${brand.name}.` : "VUI Software Inc."} All rights
          reserved.
          {brand ? <span> Powered by VUI LMS.</span> : null}
        </p>
        <div className="flex items-center gap-6">
          <Link href="/docs/security-section" className="transition-colors hover:text-ink">
            Security
          </Link>
          <Link href="/docs/auth-onboarding-design" className="transition-colors hover:text-ink">
            Access terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
