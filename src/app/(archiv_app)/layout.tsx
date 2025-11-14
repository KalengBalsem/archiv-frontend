import type React from "react"
import type { Metadata } from "next"
import "@/styles/globals.css"
import { Roboto_Mono } from 'next/font/google'
import { AuthProvider } from '@/providers/AuthProvider'

import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { cookies } from 'next/headers'

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300','400','500','700'],
  variable: '--font-roboto-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Archive 3D - Architectural Model Archive",
  description: "A clean, modern archive for 3D architectural models",
}

export default async function ArchivLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Persisting the sidebar state in the cookie
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar-collapsed')?.value === 'true';
  return (
      <div>
        <AuthProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <Sidebar />
            <SidebarInset>
              <Header />
              {children} {/* {children} adalah (page.tsx), sebuah Server Component */}
            </SidebarInset>
          </SidebarProvider>
        </AuthProvider>
      </div>
  )
}