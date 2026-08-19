"use client"

import * as React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = "Something went wrong",
  message = "We could not load this content.",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-danger/25 bg-danger/[0.05] p-8 text-center",
        className,
      )}
      {...props}
    >
      <span className="grid size-11 place-items-center rounded-full bg-danger/10 text-danger">
        <AlertCircle size={22} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{message}</p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-[10px] border border-danger/25 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      ) : null}
    </div>
  )
}
