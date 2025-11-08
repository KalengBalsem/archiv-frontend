"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // TODO: Replace with actual authentication logic
      if (!email || !password) {
        setError("Please fill in all fields")
        return
      }
      console.log("[(auth)/login] Login attempt:", { email })
      // Simulate login delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      router.push("/")
    } catch (err) {
      setError("Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="block text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-black">ARCH-IV</h1>
        </Link>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 border-gray-300 focus:border-black focus:ring-black"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 border-gray-300 focus:border-black focus:ring-black"
              required
            />
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-black hover:bg-gray-900 text-white font-medium"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-black font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        {/* Forgot Password */}
        <div className="mt-4 text-center">
          <Link href="#" className="text-sm text-gray-500 hover:text-gray-700">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  )
}
