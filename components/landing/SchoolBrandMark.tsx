import * as React from "react"

/**
 * A school's mark. Falls back to its initials on the brand colour, so a school
 * that has not uploaded a logo still gets something that looks deliberate
 * rather than a broken image.
 */
export function SchoolBrandMark({
  name,
  logoUrl,
  size = 40,
  className,
}: {
  name: string
  logoUrl?: string | null
  size?: number
  className?: string
}) {
  const initials = React.useMemo(() => {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return "?"
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
  }, [name])

  if (logoUrl) {
    return (
      // Schools upload arbitrary remote logos, so this stays a plain <img>: the
      // Next image loader would need every school's host allow-listed.
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={`shrink-0 rounded-[10px] object-contain ${className ?? ""}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-[10px] bg-primary font-display font-semibold text-primary-contrast ${className ?? ""}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials}
    </span>
  )
}
