# Per-school branding + public surface rebuild

Date: 2026-08-18
Status: implemented (phase 1 of 2)

## Problem

Two problems, one root cause. Schools on their own subdomains looked identical to
every other tenant, and the interface itself read as generic. Both came from the
same place: colour was hardcoded in ~855 call sites (303 `blue-*`, 231
`slate-800/900/950`, 321 `white/N`) across 183 components, with the `--primary`
and `--accent` variables in `globals.css` referenced by nothing.

## Decisions

| Question | Decision |
| --- | --- |
| Scope of customisation | Full skin: accents, surfaces, and light/dark |
| Mode selection | School picks two colours; both modes always available, palette derives per mode |
| What secondary drives | Supporting accent — badges, highlights, secondary surfaces. Not a neutral tint |
| Invalid/illegible colours | Auto-derive per mode in OKLCH: hue and chroma preserved, lightness clamped into a legible band |
| Branded surfaces | App + public subdomain pages. Emails and certificates excluded |
| Light mode treatment | Genuine light glass, not an inversion |
| Sequencing | UI rebuild first, theming as its foundation |
| Phase 1 scope | Public surfaces only: landing, school landing, auth, onboarding, status pages |

## Visual direction

Derived from sulvatech.com, structured on the narrative arc of mealdirectly.com.

- Canvas `#f7f6f8`, ink `#160d1b`, muted `#6b5e70`, platform primary `#690dab`.
- One radial brand wash per surface, anchored top-centre — not per element.
- Glass marks the elevated object only (hero panel, navbar once scrolled).
- Dark punctuation blocks (`#1a1022 → #2d1b36 → primary`) between light sections.
- Outfit display / Inter body, uppercase letterspaced eyebrow over every section.
- Three radii: 16px card, 24px panel, pill.

Explicitly removed: gradient text on headings, neon glow shadows, dark glass as
the default panel, `blue-600` buttons.

## Architecture

### Token layer (`app/globals.css`)

Components name roles, never colours. Modes are attribute-scoped
(`:root, [data-theme="light"]` / `[data-theme="dark"]`) so a single dark section
inside a light page flips every token within it, including the school's accent.

`--brand-*` is deliberately undefined in the stylesheet; every reference carries
the platform brand as a fallback, so the app renders correctly on the root domain
and before any school picks a colour.

Status colours (`info`, `success`, `warn`, `danger`) are excluded from theming: a
red that turns purple stops warning.

### Brand engine (`lib/branding/`)

Pure functions, no database, no React.

1. `normalizeHex` accepts shorthand, missing hash, uppercase; rejects everything else.
2. `hexToOklch` converts to a perceptually uniform space.
3. `fit` clamps lightness into a per-mode band (light `0.42–0.63`, dark `0.62–0.82`),
   then walks outward from the admin's own value until the colour both carries a
   readable label (AA 4.5:1) and separates from the canvas (3:1). The admin's
   lightness wins whenever it already works.
4. `buildBrandStyle` emits both modes in one inline `<style>`.

An admin is never blocked from saving; the colour is adjusted, and the picker
says so.

### Delivery

Middleware already reads and caches the school row per request, so branding costs
no extra query: `resolveTenant` selects the two columns, middleware forwards them
as `x-university-primary` / `x-university-secondary`, and the root layout runs the
engine server-side and inlines the result. No flash, no client theming pass.

The school name travels percent-encoded — free text cannot go in a header raw.

### Storage (`036_school_branding.sql`)

`universities.primary_color` / `secondary_color`, nullable, `CHECK` constrained to
`^#[0-9a-f]{6}$`. NULL means platform default. The format is enforced at the
database because the value reaches an inline `<style>`.

Writes go through `updateSchoolBrandingAction`, guarded by
`requireRole('department_admin')` and scoped to the caller's own university. RLS on
`universities` stays super-admin-only because row policies cannot restrict which
columns an update touches.

## Phase 2 (not built)

Dashboards. They remain on the old dark palette behind a `legacy-shell` wrapper
and the retained legacy utilities, so nothing regressed while the public surfaces
moved. Retiring a legacy class is what removes it.
