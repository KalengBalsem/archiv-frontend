"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validation
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        setError("Please fill in all fields")
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters")
        return
      }

      console.log("[v0] Registration attempt:", {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      // TODO: Replace with actual registration logic
      await new Promise((resolve) => setTimeout(resolve, 500))
      router.push("/")
    } catch (err) {
      setError("Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="block text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-black">ARCH-IV</h1>
        </Link>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Jane"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full h-11 border-gray-300 focus:border-black focus:ring-black"
                required
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
                Last Name
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Smith"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full h-11 border-gray-300 focus:border-black focus:ring-black"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full h-11 border-gray-300 focus:border-black focus:ring-black"
              required
            />
            <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full h-11 border-gray-300 focus:border-black focus:ring-black"
              required
            />
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-black hover:bg-gray-900 text-white font-medium mt-6"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Sign In Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-black font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
