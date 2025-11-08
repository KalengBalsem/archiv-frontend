"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/utils/supabaseClient"
import { Project } from "@/types/project"
import ProjectCard from "@/components/project-card"
import LayoutWrapper from "@/components/layout-wrapper"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { mockProjects } from "@/lib/mockProjects"

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // filters (for later)
  const [buildingTypeFilter, setBuildingTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)

      try {
        const { data, error } = await supabaseClient
          .from("projects")
          .select(`
            id,
            title,
            slug,
            description,
            thumbnail_url,
            gltf_url,
            status,
            views,
            created_at,
            user:users(username, display_name),
            building_typology:building_typologies(name),
            license:licenses(name),
            tags:project_tags(tag:tags(name)),
            software:project_software(software:software(name))
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Supabase error:", error)
          console.warn("⚠️ Using mock projects instead")
          setProjects(mockProjects)
        } else if (data && data.length > 0) {
          const normalized = data.map((p: any) => ({
            ...p,
            user: Array.isArray(p.user) ? p.user[0] : p.user,
            building_typology: Array.isArray(p.building_typology) ? p.building_typology[0] : p.building_typology,
            license: Array.isArray(p.license) ? p.license[0] : p.license,
          }))
          setProjects(normalized)
        } else {
          console.warn("⚠️ No Supabase projects found — using mock data")
          setProjects(mockProjects)
        }
      } catch (e) {
        console.error("⚠️ Failed to fetch from Supabase:", e)
        setProjects(mockProjects)
      }

      setLoading(false)
    }

    fetchProjects()
  }, [])

  // 🔍 Simple client-side search
  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <LayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* 🔎 Search + Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center max-w-4xl mx-auto mb-8">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg border-gray-300 focus:border-black focus:ring-black"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-12 px-6 border-gray-300 hover:border-black hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </Button>
        </div>

        {/* 📦 Project Grid */}
        {loading ? (
          <p className="text-center text-gray-500">Loading projects...</p>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">No projects found.</div>
        )}
      </div>
    </LayoutWrapper>
  )
}
