"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import ArchIvLanding from "@/components/landing-page" // Move your landing code here

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is logged in, send them to their main dashboard immediately
    if (!loading && user) {
      router.push("/projects") 
    }
  }, [user, loading, router])

  // While checking auth, or if not logged in, show the Landing Page.
  // The SidebarWrapper logic handles hiding the sidebar for "/" path + no user.
  return <ArchIvLanding />
}