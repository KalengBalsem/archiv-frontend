"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabaseClient } from '@/utils/supabaseClient'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { KeyRound, Mail, ArrowLeft, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // FORM STATE
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  
  // OTP STATE (This controls the "Page Swap")
  const [otp, setOtp] = useState("") 
  const [pendingVerification, setPendingVerification] = useState(false)
  
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // --- ACTION 1: REGISTER USER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // 1. Basic Validation
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error("Please fill in all fields")
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }
      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters")
      }

      // 2. Register with Supabase
      const { data, error } = await supabaseClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Send Full Name to Postgres Trigger
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            avatar_url: "", 
          },
        },
      })

      if (error) throw error

      // 3. Check State: Did we get a session? 
      // If NO session, it means Email Confirmation is ON. Show OTP screen.
      if (data.user && !data.session) {
        setPendingVerification(true) 
      } else if (data.session) {
        // If Email Confirmation is OFF, just log them in.
        router.push("/") 
      }

    } catch (err: any) {
      setError(err.message || "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  // --- ACTION 2: VERIFY CODE ---
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error } = await supabaseClient.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: 'signup' // This tells Supabase we are verifying a new user
      })

      if (error) throw error

      // Success! User is verified and logged in.
      router.push("/")
      
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setIsLoading(true)
    try {
      const redirectTo = searchParams?.get('redirectTo') ?? '/'
      const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
      if (error) setError(error.message)
    } catch (err) {
      setError('Failed to start Google sign-up')
    } finally {
      setIsLoading(false)
    }
  }

  // --- VIEW 1: OTP VERIFICATION (Shown after submit) ---
  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-sm text-center">
           <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-black"/>
           </div>
           <h2 className="text-2xl font-bold mb-2">Check your email</h2>
           <p className="text-gray-500 mb-8 text-sm">
             We sent a 6-digit code to <br/><strong className="text-black">{formData.email}</strong>
           </p>
           <p className="text-gray-500 mb-8 text-sm">
             Kindly check your Inbox, Spam, or Junk Email.
           </p>

           <form onSubmit={handleVerify} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="123456"
                    className="pl-10 tracking-[0.5em] font-mono text-center h-12 text-lg border-gray-300 focus:border-black focus:ring-black"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-black text-white hover:bg-gray-800 font-medium">
                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Verify Account"}
              </Button>
           </form>

           <button 
             onClick={() => setPendingVerification(false)}
             className="mt-6 text-sm text-gray-500 hover:text-black flex items-center justify-center gap-2 w-full transition-colors"
           >
             <ArrowLeft className="w-4 h-4"/> Back to Sign Up
           </button>
        </div>
      </div>
    )
  }

  // --- VIEW 2: REGISTRATION FORM (Default) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-black">ARCH-IV</h1>
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
              <Input
                name="firstName"
                placeholder="Jane"
                value={formData.firstName}
                onChange={handleChange}
                className="h-11 border-gray-300 focus:border-black focus:ring-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
              <Input
                name="lastName"
                placeholder="Smith"
                value={formData.lastName}
                onChange={handleChange}
                className="h-11 border-gray-300 focus:border-black focus:ring-black"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="h-11 border-gray-300 focus:border-black focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="h-11 border-gray-300 focus:border-black focus:ring-black"
              required
            />
            <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Confirm Password</label>
            <Input
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="h-11 border-gray-300 focus:border-black focus:ring-black"
              required
            />
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <Button type="submit" disabled={isLoading} className="w-full h-11 bg-black hover:bg-gray-900 text-white font-medium mt-6">
            {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Create account"}
          </Button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <div className="mt-6">
          <Button onClick={handleGoogleSignIn} className="w-full h-11 border bg-white text-black hover:bg-gray-50" disabled={isLoading}>
            {isLoading ? 'Please wait...' : 'Continue with Google'}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account? <Link href="/login" className="text-black font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}