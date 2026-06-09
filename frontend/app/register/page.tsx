"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/services/auth"

// Beautiful, premium Register page with glassmorphism, animated floating orbs,
// and smooth gradients matching the gorgeous styling of the Login page.
export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Handle registering a new user when form is submitted
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // 1. Send register request to backend
      await authService.register({ name, email, password })
      // 2. Redirect to dashboard on success
      router.push("/")
    } catch (err: any) {
      // 3. Show error message on failure
      setError(err.response?.data?.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-bg flex min-h-screen items-center justify-center p-4">
      {/* Dynamic floating background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="relative z-10 w-full max-w-md">
        {/* Branding header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
            <span className="text-3xl font-black text-white">T</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            TaskFlow
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Manage your workflow like never before
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Create an account</h2>
            <p className="mt-1 text-sm text-white/60">
              Get started with TaskFlow today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-white/90">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/90">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white/90">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                "Creating account..."
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white hover:decoration-white/60 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
