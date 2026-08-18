"use client"

import * as React from "react"
import { animate, useInView, useReducedMotion } from "motion/react"

export interface Stat {
  value: number
  label: string
  suffix?: string
}

/**
 * Counts up once, when the band is actually on screen. Respects the reduced
 * motion setting by rendering the final figure immediately.
 */
function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const reduceMotion = useReducedMotion()

  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    if (!inView) return

    if (reduceMotion) {
      node.textContent = String(value)
      return
    }

    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = String(Math.round(latest))
      },
    })
    return () => controls.stop()
  }, [inView, reduceMotion, value])

  return (
    <span className="font-display text-4xl font-semibold text-ink sm:text-5xl">
      <span ref={ref}>0</span>
      {suffix ? <span className="text-primary">{suffix}</span> : null}
    </span>
  )
}

export function StatsBand({
  stats,
  caption,
}: {
  stats: Stat[]
  caption?: string
}) {
  if (stats.length === 0) return null

  return (
    <section className="border-y border-line bg-canvas px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {caption ? <p className="eyebrow text-center">{caption}</p> : null}
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <Counter value={stat.value} suffix={stat.suffix} />
                <span className="mt-3 block text-xs font-medium tracking-[0.16em] text-ink-subtle uppercase">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
