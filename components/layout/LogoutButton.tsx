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
        "flex items-center justify-center gap-2 rounded-[10px] border border-line px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-danger/30 hover:bg-danger/[0.07] hover:text-danger disabled:opacity-60",
        collapsed ? "size-9 px-0" : "w-full",
        className
      )}
      aria-label="Log out"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      {!collapsed && <span>Log out</span>}
    </button>
  )
}
