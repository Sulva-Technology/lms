"use client"

import * as React from "react"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginAction } from "@/app/actions/auth"
import { Field, FormError, SubmitButton, TextInput } from "./fields"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      if (result?.success && result.redirectTo) {
        router.replace(result.redirectTo)
        router.refresh()
        return
      }

      setError("We could not confirm your destination. Please try again.")
      setIsLoading(false)
    } catch (err: any) {
      console.error("Login client error:", err)
      setError("An unexpected error occurred. Please refresh and try again.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError>{error}</FormError>

      <Field label="Email" htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@institution.edu"
          icon={<Mail size={17} />}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        action={
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
          >
            Forgot password?
          </Link>
        }
      >
        <div className="relative">
          <TextInput
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Your password"
            icon={<Lock size={17} />}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-subtle transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </Field>

      <SubmitButton loading={isLoading}>
        {isLoading ? "Signing in" : "Sign in"}
      </SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        Setting up a new institution?{" "}
        <Link href="/onboarding" className="font-medium text-primary hover:opacity-80">
          Start here
        </Link>
      </p>
    </form>
  )
}
