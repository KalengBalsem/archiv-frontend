"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import LayoutWrapper from "@/components/layout-wrapper"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'

  if (loading) {
    return (
        <div className="p-8">Loading...</div>
    )
  }

  if (!user) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-2xl px-6">
          <h1 className="text-4xl font-extrabold mb-4">Welcome to ARCH-IV</h1>
          <p className="text-gray-600 mb-8">
            Archive and explore projects. Sign in to create, view, and manage your projects.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button onClick={() => router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`)} className="h-11 px-6">
              Sign in
            </Button>

            <Button variant="outline" onClick={() => router.push(`/register?redirectTo=${encodeURIComponent(currentPath)}`)} className="h-11 px-6">
              Create account
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">Or continue with Google on the login/register page.</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <LayoutWrapper>{ <p>ARCH-IV home page</p> }</LayoutWrapper>
    </>
  )
}
