"use client"

import * as React from "react"
import { Loader2, RotateCcw } from "lucide-react"
import { updateSchoolBrandingAction } from "@/app/actions/settings"
import {
  buildPalette,
  DEFAULT_PRIMARY,
  DEFAULT_SECONDARY,
  normalizeHex,
  type ThemeMode,
} from "@/lib/branding"

export interface BrandingFormProps {
  schoolName: string
  initialPrimary: string | null
  initialSecondary: string | null
}

/**
 * Two colours, and an honest preview of what the app will do with them.
 *
 * The preview runs the same derivation the server runs, so an admin sees the
 * adjusted shade — not the raw hex — before saving, and the "adjusted for
 * contrast" note explains why the swatch may differ from the picker.
 */
export function BrandingForm({ schoolName, initialPrimary, initialSecondary }: BrandingFormProps) {
  const [primary, setPrimary] = React.useState(initialPrimary ?? DEFAULT_PRIMARY)
  const [secondary, setSecondary] = React.useState(initialSecondary ?? DEFAULT_SECONDARY)
  const [mode, setMode] = React.useState<ThemeMode>("light")
  const [pending, setPending] = React.useState(false)
  const [message, setMessage] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null)

  const palette = React.useMemo(() => buildPalette(primary, secondary, mode), [primary, secondary, mode])

  const adjusted =
    normalizeHex(primary) !== palette.primary.base || normalizeHex(secondary) !== palette.secondary.base

  const save = async () => {
    setPending(true)
    setMessage(null)
    const result = await updateSchoolBrandingAction({
      primaryColor: normalizeHex(primary),
      secondaryColor: normalizeHex(secondary),
    })
    setPending(false)
    setMessage(
      result?.error
        ? { tone: "error", text: result.error }
        : { tone: "ok", text: "Saved. Reload to see it everywhere." },
    )
  }

  const reset = () => {
    setPrimary(DEFAULT_PRIMARY)
    setSecondary(DEFAULT_SECONDARY)
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-2xl">
        <h2 className="font-outfit text-lg font-semibold text-white">Brand colours</h2>
        <p className="mt-2 text-sm text-slate-400">
          Used across {schoolName}&apos;s portal, sign-in page and public site.
        </p>

        <div className="mt-6 grid gap-5">
          <ColorField
            label="Primary"
            hint="Buttons, links, active states."
            value={primary}
            onChange={setPrimary}
          />
          <ColorField
            label="Secondary"
            hint="Supporting accents and highlights."
            value={secondary}
            onChange={setSecondary}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            Save colours
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
          >
            <RotateCcw size={15} />
            Platform default
          </button>
        </div>

        {message ? (
          <p
            className={
              message.tone === "ok"
                ? "mt-4 text-sm text-emerald-400"
                : "mt-4 text-sm text-rose-400"
            }
          >
            {message.text}
          </p>
        ) : null}

        {adjusted ? (
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            One of your colours was adjusted for legibility in {mode} mode. The hue you picked is
            kept; only its lightness moves, and only far enough to keep text on it readable.
          </p>
        ) : null}
      </div>

      <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-outfit text-lg font-semibold text-white">Preview</h2>
          <div className="flex rounded-full border border-white/10 p-1 text-xs font-medium">
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={
                  mode === option
                    ? "rounded-full bg-white px-3 py-1 text-slate-900"
                    : "rounded-full px-3 py-1 text-slate-400"
                }
              >
                {option === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </div>

        <BrandPreview mode={mode} palette={palette} schoolName={schoolName} />
      </div>
    </section>
  )
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}) {
  const id = React.useId()
  const valid = normalizeHex(value)

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={valid ?? "#690dab"}
          onChange={(event) => onChange(event.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-transparent"
          aria-label={`${label} colour picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-blue-400"
          aria-invalid={!valid}
        />
      </div>
      <p className="text-xs text-slate-500">{hint}</p>
      {!valid ? <p className="text-xs text-rose-400">Enter a hex colour like #690dab.</p> : null}
    </div>
  )
}

function BrandPreview({
  mode,
  palette,
  schoolName,
}: {
  mode: ThemeMode
  palette: ReturnType<typeof buildPalette>
  schoolName: string
}) {
  // The preview paints its own token values rather than inheriting the page's,
  // so an admin can see dark mode without switching the whole dashboard.
  const style = {
    "--brand-primary": palette.primary.base,
    "--brand-primary-hover": palette.primary.hover,
    "--brand-primary-contrast": palette.primary.contrast,
    "--brand-primary-soft": palette.primary.soft,
    "--brand-primary-soft-contrast": palette.primary.softContrast,
    "--brand-secondary": palette.secondary.base,
    "--brand-secondary-soft": palette.secondary.soft,
    "--brand-secondary-soft-contrast": palette.secondary.softContrast,
  } as React.CSSProperties

  return (
    <div
      data-theme={mode}
      style={style}
      className="mt-6 overflow-hidden rounded-[18px] border border-line bg-canvas p-6"
    >
      <p className="eyebrow">{schoolName}</p>
      <h3 className="mt-3 font-display text-2xl font-semibold text-ink">
        Welcome back to {schoolName}.
      </h3>
      <p className="mt-2 text-sm text-ink-muted">
        Sign in to reach your courses, live classes and results.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast">
          Sign in
        </span>
        <span className="rounded-pill border border-line-strong px-5 py-2.5 text-sm font-medium text-ink">
          Explore
        </span>
        <span className="rounded-pill bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-soft-contrast">
          3 classes today
        </span>
        <span className="rounded-pill bg-secondary-soft px-3 py-1.5 text-xs font-semibold text-secondary-soft-contrast">
          Attendance recorded
        </span>
      </div>

      <div className="mt-6 rounded-card border border-line bg-surface p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Term progress</span>
          <span className="font-semibold text-ink">68%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-status-soft">
          <div className="h-full w-[68%] rounded-pill bg-primary" />
        </div>
      </div>
    </div>
  )
}
