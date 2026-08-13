"use client"

import { useTransition } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { logoutAction } from "@/app/actions/auth"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
  collapsed?: boolean
  className?: string
}

export function LogoutButton({ collapsed = false, className }: LogoutButtonProps) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => {
        await logoutAction()
      })}
      disabled={pending}
      title={collapsed ? "Log out" : undefined}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-60 active:scale-[0.98]",
        collapsed ? "h-10 w-10 px-0" : "w-full",
        className
      )}
      aria-label="Log out"
    >
      {pending ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
      {!collapsed && <span>Log out</span>}
    </button>
  )
}
