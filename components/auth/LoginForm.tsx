"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginAction } from "@/app/actions/auth"

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
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center justify-center font-medium"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            name="email"
            type="email"
            required
            className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block pl-10 p-3.5 transition-all outline-none"
            placeholder="you@university.edu"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between ml-1">
          <label className="text-sm font-medium text-slate-300">Password</label>
          <Link href="/forgot-password" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
            Forgot password?
          </Link>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className="w-full bg-slate-900/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block pl-10 pr-10 p-3.5 transition-all outline-none"
            placeholder="••••••••"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex items-center ml-1">
        <input 
          id="remember" 
          type="checkbox" 
          className="w-4 h-4 bg-slate-900 border-slate-700 rounded text-blue-600 focus:ring-blue-600 focus:ring-2 focus:ring-offset-slate-900 cursor-pointer"
        />
        <label htmlFor="remember" className="ml-2 text-sm text-slate-400 cursor-pointer select-none">
          Remember me for 30 days
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 mt-4"
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Sign in to VUI LMS"}
      </button>

      <p className="text-center text-sm text-slate-400 mt-6">
        Don't have an account? <Link href="/onboarding" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Set up your profile</Link>
      </p>
    </form>
  )
}
