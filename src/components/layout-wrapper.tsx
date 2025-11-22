"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Tambahkan "/" di sini. 
  // Artinya: Home, Login, Register TIDAK akan menampilkan Sidebar.
  const isLandingOrAuth = ["/", "/login", "/register", "/forgot-password"].includes(pathname)

  if (isLandingOrAuth) {
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