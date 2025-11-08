"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Archive, Info, Upload, LogOut, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabaseClient } from "@/utils/supabaseClient"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: Archive,
  },
  {
    name: "Upload",
    href: "/upload",
    icon: Upload,
  },
  {
    name: "About",
    href: "/about",
    icon: Info,
  },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    window.location.href = "/login" // redirect to login after logout
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-50 flex flex-col justify-between",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link
              href="/"
              className="text-xl font-bold text-black tracking-tight"
            >
              ARCH-IV
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 lg:hidden"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gray-100 text-black"
                          : "text-gray-700 hover:bg-gray-50 hover:text-black",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* Logout Button at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-black hover:bg-gray-50"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}
