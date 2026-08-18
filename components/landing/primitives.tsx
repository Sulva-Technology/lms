"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

/**
 * The shared vocabulary of the public surfaces: one button, one section header,
 * one reveal. Everything below reads from the token layer, so a school's colours
 * reach every surface without any component knowing what those colours are.
 */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"

const BUTTON_SIZES = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
} as const

const BUTTON_VARIANTS = {
  primary: "bg-primary text-primary-contrast hover:bg-primary-hover shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--brand-primary,#690dab)_70%,transparent)]",
  outline: "border border-line-strong text-ink hover:bg-ink/[0.04]",
  ghost: "text-ink-muted hover:text-ink",
  // Fixed light values on purpose: this variant only ever sits on the dark
  // contrast block, where `surface` and `ink` have already inverted.
  onDark: "bg-[#f7f6f8] text-[#160d1b] hover:bg-white",
} as const

export interface CtaProps extends React.ComponentPropsWithoutRef<typeof Link> {
  variant?: keyof typeof BUTTON_VARIANTS
  size?: keyof typeof BUTTON_SIZES
}

export function Cta({ variant = "primary", size = "lg", className, ...props }: CtaProps) {
  return (
    <Link
      {...props}
      className={cn(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className)}
    />
  )
}

export interface CtaButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: keyof typeof BUTTON_VARIANTS
  size?: keyof typeof BUTTON_SIZES
}

export function CtaButton({
  variant = "primary",
  size = "lg",
  className,
  type = "button",
  ...props
}: CtaButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className)}
    />
  )
}

/** Staggered entrance. One orchestrated reveal per section beats per-element hover tricks. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "center" | "left"
  className?: string
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.12] text-ink sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-ink-muted sm:text-lg">{description}</p>
      ) : null}
    </div>
  )
}
