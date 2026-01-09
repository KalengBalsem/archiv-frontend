import type React from "react"
import type { Metadata } from "next"
import "@/styles/globals.css"
import { Roboto_Mono } from 'next/font/google'
import { AuthProvider } from '@/providers/AuthProvider'
import { LayoutWrapper } from "@/components/layout-wrapper" // Import komponen baru tadi

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300','400','500','700'],
  variable: '--font-roboto-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "ARCH-IV - Architectural Archive",
  description: "A clean, modern archive for 3D architectural models",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={robotoMono.variable}>
      <body className="font-sans">
        
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>

      </body>
    </html>
  )
}