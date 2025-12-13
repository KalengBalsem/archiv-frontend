"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { useAuth } from "@/providers/AuthProvider"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  
  // Tambahkan "/" di sini. 
  // Artinya: Home, Login, Register TIDAK akan menampilkan Sidebar.
  const isLandingOrAuth = ["/login", "/register", "/forgot-password"].includes(pathname)

  const isGuestHome = pathname === "/" && !user

  if (isLandingOrAuth || isGuestHome) {
    return <>{children}</>
  }

  // Halaman lain (Profile, Projects, dll) akan pakai Sidebar
  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <React.Suspense fallback={<div />}>
          <Header />
        </React.Suspense>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}