"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { IconSearch, IconFilter } from "@tabler/icons-react" // Atau lucide-react
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- 1. SEARCH LOGIC (Sama seperti sebelumnya) ---
  const urlQuery = searchParams.get("q") || ""
  const [inputValue, setInputValue] = useState(urlQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue === urlQuery) return

      const params = new URLSearchParams(searchParams)
      if (inputValue) params.set("q", inputValue)
      else params.delete("q")

      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, urlQuery, pathname, router, searchParams])

  useEffect(() => {
    setInputValue(urlQuery)
  }, [urlQuery])


  // --- 2. FILTER LOGIC (BARU) ---
  
  // Ambil nilai filter saat ini dari URL
  const currentType = searchParams.get("type") || "all"
  const currentSort = searchParams.get("sort") || "newest"

  // Fungsi helper untuk update URL tanpa menghapus search query
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  // Opsi Mockup (Nanti bisa diambil dari DB/Props)
  const typologies = [
    { id: "residential", name: "Residential" },
    { id: "commercial", name: "Commercial" },
    { id: "public", name: "Public / Cultural" },
    { id: "landscape", name: "Landscape" },
  ]

  return (
    <div className="flex items-center gap-2">
      {/* Search Input */}
      <div className="relative w-full md:w-40 lg:w-64">
        <IconSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder="Search projects..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-9 w-full rounded-md pl-8 text-sm bg-background"
        />
      </div>

      {/* Filter Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 gap-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <IconFilter className="h-3.5 w-3.5" />
            Filter
            {/* Indikator jika ada filter aktif */}
            {(currentType !== "all" || currentSort !== "newest") && (
              <span className="ml-1 flex h-2 w-2 rounded-full bg-blue-600" />
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-4" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filter Projects</h4>
              <p className="text-sm text-muted-foreground">
                Refine the project list by typology or sorting.
              </p>
            </div>
            
            <div className="grid gap-2">
              {/* Filter 1: Typology */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="type">Typology</Label>
                <Select 
                  value={currentType} 
                  onValueChange={(val) => updateFilter("type", val)}
                >
                  <SelectTrigger className="col-span-2 h-8">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Typologies</SelectItem>
                    {typologies.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter 2: Sorting */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="sort">Sort By</Label>
                <Select 
                  value={currentSort} 
                  onValueChange={(val) => updateFilter("sort", val)}
                >
                  <SelectTrigger className="col-span-2 h-8">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="az">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reset Button */}
            <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => router.push(pathname)} // Reset semua (search + filter)
            >
                Clear all filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}