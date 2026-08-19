"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Supabase's hosted verify endpoint hands the session back in the URL hash,
 * and browsers never send a hash to the server. Invite and recovery links
 * therefore landed on a page whose server action saw no cookie at all and
 * failed with "Auth session missing!". Reading the hash here and calling
 * setSession writes the cookies the rest of the app already expects, then
 * strips the tokens out of the address bar so they cannot be shared onward.
 */
export function AuthHashBridge() {
  const router = useRouter()

  React.useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes("access_token")) return

    const params = new URLSearchParams(hash.slice(1))
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")
    if (!accessToken || !refreshToken) return

    const type = params.get("type")
    let cancelled = false

    void (async () => {
      const { error } = await createClient().auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (cancelled) return

      window.history.replaceState(null, "", window.location.pathname + window.location.search)

      if (error) {
        router.replace("/login?error=auth_callback_failed")
        return
      }

      const destination = type === "recovery" ? "/reset-password" : "/onboarding/profile"

      if (window.location.pathname === destination) {
        router.refresh()
      } else {
        router.replace(destination)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  return null
}
