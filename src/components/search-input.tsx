"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { IconSearch, IconFilter, IconX } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { supabaseClient } from "@/utils/supabaseClient"

// Types for filter options
interface FilterOption {
  id: string
  name: string
}

export default function SearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- FILTER OPTIONS STATE (Fetched from DB) ---
  const [typologies, setTypologies] = useState<FilterOption[]>([])
  const [locations, setLocations] = useState<FilterOption[]>([])
  const [tags, setTags] = useState<FilterOption[]>([])
  const [software, setSoftware] = useState<FilterOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch filter options from Supabase
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoading(true)
      try {
        const [typologyRes, locationRes, tagRes, softwareRes] = await Promise.all([
          supabaseClient.from("building_typologies").select("id, name").order("name"),
          supabaseClient.from("locations").select("id, name").order("name"),
          supabaseClient.from("tags").select("id, name").order("name"),
          supabaseClient.from("software").select("id, name").order("name"),
        ])

        if (typologyRes.data) setTypologies(typologyRes.data)
        if (locationRes.data) setLocations(locationRes.data)
        if (tagRes.data) setTags(tagRes.data)
        if (softwareRes.data) setSoftware(softwareRes.data)
      } catch (error) {
        console.error("Failed to fetch filter options:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFilterOptions()
  }, [])

  // --- 1. SEARCH LOGIC ---
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


  // --- 2. FILTER LOGIC ---
  
  // Get current filter values from URL
  const currentTypology = searchParams.get("typology") || "all"
  const currentLocation = searchParams.get("location") || "all"
  const currentSort = searchParams.get("sort") || "newest"
  
  // Multi-select values (comma-separated in URL)
  const currentTags = searchParams.get("tags")?.split(",").filter(Boolean) || []
  const currentSoftware = searchParams.get("software")?.split(",").filter(Boolean) || []

  // Count active filters
  const activeFilterCount = [
    currentTypology !== "all" ? 1 : 0,
    currentLocation !== "all" ? 1 : 0,
    currentTags.length,
    currentSoftware.length,
  ].reduce((a, b) => a + b, 0)

  // Helper to update single-select filters
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  // Helper to update multi-select filters (tags, software)
  const toggleMultiFilter = (key: string, value: string, currentValues: string[]) => {
    const params = new URLSearchParams(searchParams)
    
    let newValues: string[]
    if (currentValues.includes(value)) {
      newValues = currentValues.filter((v) => v !== value)
    } else {
      newValues = [...currentValues, value]
    }

    if (newValues.length > 0) {
      params.set(key, newValues.join(","))
    } else {
      params.delete(key)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  // Clear all filters
  const clearAllFilters = () => {
    const params = new URLSearchParams()
    // Keep search query if exists
    if (urlQuery) params.set("q", urlQuery)
    router.push(`${pathname}?${params.toString()}`)
  }

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
            {/* Badge showing active filter count */}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium leading-none">Filter Projects</h4>
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearAllFilters}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
          
          <Separator />

          <ScrollArea className="h-[360px]">
            <Accordion type="multiple" defaultValue={["typology", "sort"]} className="px-4">
              {/* Typology Filter */}
              <AccordionItem value="typology">
                <AccordionTrigger className="text-sm py-3">
                  Building Typology
                  {currentTypology !== "all" && (
                    <Badge variant="secondary" className="ml-auto mr-2 text-xs">1</Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <Select 
                    value={currentTypology} 
                    onValueChange={(val) => updateFilter("typology", val)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select typology" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Typologies</SelectItem>
                      {typologies.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              {/* Location Filter */}
              <AccordionItem value="location">
                <AccordionTrigger className="text-sm py-3">
                  Location
                  {currentLocation !== "all" && (
                    <Badge variant="secondary" className="ml-auto mr-2 text-xs">1</Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <Select 
                    value={currentLocation} 
                    onValueChange={(val) => updateFilter("location", val)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              {/* Tags Filter (Multi-select) */}
              <AccordionItem value="tags">
                <AccordionTrigger className="text-sm py-3">
                  Tags
                  {currentTags.length > 0 && (
                    <Badge variant="secondary" className="ml-auto mr-2 text-xs">{currentTags.length}</Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {isLoading ? (
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    ) : tags.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No tags available</p>
                    ) : (
                      tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={currentTags.includes(tag.id)}
                            onCheckedChange={() => toggleMultiFilter("tags", tag.id, currentTags)}
                          />
                          <Label 
                            htmlFor={`tag-${tag.id}`} 
                            className="text-xs font-normal cursor-pointer"
                          >
                            {tag.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Software Filter (Multi-select) */}
              <AccordionItem value="software">
                <AccordionTrigger className="text-sm py-3">
                  Software Used
                  {currentSoftware.length > 0 && (
                    <Badge variant="secondary" className="ml-auto mr-2 text-xs">{currentSoftware.length}</Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {isLoading ? (
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    ) : software.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No software available</p>
                    ) : (
                      software.map((sw) => (
                        <div key={sw.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sw-${sw.id}`}
                            checked={currentSoftware.includes(sw.id)}
                            onCheckedChange={() => toggleMultiFilter("software", sw.id, currentSoftware)}
                          />
                          <Label 
                            htmlFor={`sw-${sw.id}`} 
                            className="text-xs font-normal cursor-pointer"
                          >
                            {sw.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Sort Filter */}
              <AccordionItem value="sort" className="border-b-0">
                <AccordionTrigger className="text-sm py-3">
                  Sort By
                </AccordionTrigger>
                <AccordionContent>
                  <Select 
                    value={currentSort} 
                    onValueChange={(val) => updateFilter("sort", val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="views">Most Viewed</SelectItem>
                      <SelectItem value="az">A-Z (Title)</SelectItem>
                      <SelectItem value="za">Z-A (Title)</SelectItem>
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="hidden md:flex items-center gap-1 flex-wrap">
          {currentTypology !== "all" && (
            <Badge variant="outline" className="text-xs gap-1 pl-2 pr-1">
              {typologies.find(t => t.id === currentTypology)?.name || currentTypology}
              <button 
                onClick={() => updateFilter("typology", "all")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <IconX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentLocation !== "all" && (
            <Badge variant="outline" className="text-xs gap-1 pl-2 pr-1">
              {locations.find(l => l.id === currentLocation)?.name || currentLocation}
              <button 
                onClick={() => updateFilter("location", "all")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <IconX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentTags.slice(0, 2).map((tagId) => (
            <Badge key={tagId} variant="outline" className="text-xs gap-1 pl-2 pr-1">
              {tags.find(t => t.id === tagId)?.name || tagId}
              <button 
                onClick={() => toggleMultiFilter("tags", tagId, currentTags)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <IconX className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {currentTags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{currentTags.length - 2} more
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}