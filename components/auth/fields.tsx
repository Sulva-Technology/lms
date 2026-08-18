"use client"

import * as React from "react"
import { motion } from "motion/react"
import { AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * The form vocabulary shared by every authentication screen. Written once so
 * the eight forms stay identical to each other and to the token layer.
 */

export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 rounded-card border border-danger/25 bg-danger/[0.07] px-4 py-3 text-sm text-danger"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </motion.p>
  )
}

export function FormNotice({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p className="flex items-start gap-2.5 rounded-card border border-success/25 bg-success/[0.07] px-4 py-3 text-sm text-success">
      {children}
    </p>
  )
}

export interface FieldProps {
  label: string
  htmlFor: string
  /** Rendered to the right of the label — a "forgot password?" link, usually. */
  action?: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
}

export function Field({ label, htmlFor, action, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  )
}

export const inputClass =
  "w-full rounded-card border border-line-strong bg-surface px-4 py-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-60"

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input"> & { icon?: React.ReactNode }
>(function TextInput({ className, icon, ...props }, ref) {
  if (!icon) {
    return <input ref={ref} {...props} className={cn(inputClass, className)} />
  }

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-subtle"
      >
        {icon}
      </span>
      <input ref={ref} {...props} className={cn(inputClass, "pl-11", className)} />
    </div>
  )
})

export const selectClass = inputClass

export function SubmitButton({
  loading,
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & { loading?: boolean }) {
  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={loading || props.disabled}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition-[background-color,transform] hover:bg-primary-hover active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      {loading ? <Loader2 size={17} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
}
