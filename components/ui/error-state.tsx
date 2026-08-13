"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, RefreshCw } from "lucide-react"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message = "We encountered an error loading this content.", onRetry, className, ...props }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 bg-red-500/5 border border-red-500/20 rounded-2xl text-center glass-panel", className)} {...props}>
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4 border border-red-500/20">
        <AlertCircle size={24} />
      </div>
      <h3 className="font-outfit text-lg font-semibold text-red-200 mb-2">{title}</h3>
      <p className="text-red-400/70 text-sm max-w-sm mb-6">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  )
}
