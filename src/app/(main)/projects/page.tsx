"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation" 
import { supabaseClient } from "@/utils/supabaseClient"
import { Project } from "@/types/project"
import ProjectCard from "@/components/project_page/project-card"
import PageContainer from "@/components/layout/page-container"
import { Loader2 } from "lucide-react"

function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const searchParams = useSearchParams()
  
  // Get all filter params
  const searchQuery = searchParams.get("q")
  const typologyFilter = searchParams.get("typology")
  const locationFilter = searchParams.get("location")
  const tagsFilter = searchParams.get("tags")?.split(",").filter(Boolean) || []
  const softwareFilter = searchParams.get("software")?.split(",").filter(Boolean) || []
  const sortFilter = searchParams.get("sort") || "newest"

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)

      try {
        let queryBuilder = supabaseClient
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
            users!user_id ( full_name, avatar_url ),
            building_typologies!inner ( id, name ),
            licenses ( name ),
            locations!inner ( id, name ),
            project_tags!left ( tags ( id, name ) ),
            project_software!left ( software ( id, name ) ),
            author_name
          `)
          .eq("status", "published")

        // Apply search query
        if (searchQuery) {
          queryBuilder = queryBuilder.ilike("title", `%${searchQuery}%`)
        }

        // Apply typology filter
        if (typologyFilter && typologyFilter !== "all") {
          queryBuilder = queryBuilder.eq("building_typology_id", typologyFilter)
        }

        // Apply location filter
        if (locationFilter && locationFilter !== "all") {
          queryBuilder = queryBuilder.eq("location_id", locationFilter)
        }

        // Apply sorting
        switch (sortFilter) {
          case "oldest":
            queryBuilder = queryBuilder.order("created_at", { ascending: true })
            break
          case "views":
            queryBuilder = queryBuilder.order("views", { ascending: false })
            break
          case "az":
            queryBuilder = queryBuilder.order("title", { ascending: true })
            break
          case "za":
            queryBuilder = queryBuilder.order("title", { ascending: false })
            break
          case "newest":
          default:
            queryBuilder = queryBuilder.order("created_at", { ascending: false })
            break
        }

        const { data, error } = await queryBuilder

        if (error) {
          console.error("Supabase error:", error)
          setProjects([])
        } else if (data) {
          let normalized: Project[] = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            description: p.description,
            thumbnail_url: p.thumbnail_url,
            gltf_url: p.gltf_url,
            status: p.status,
            views: p.views || 0,
            created_at: p.created_at,
            
            author: {
                name: (Array.isArray(p.users) ? p.users[0] : p.users)?.full_name || p.author_name || "Unknown Architect",
                avatar_url: (Array.isArray(p.users) ? p.users[0] : p.users)?.avatar_url
            },
            typology: p.building_typologies?.name || "Unknown Type",
            license: p.licenses?.name || "All Rights Reserved",
            location: p.locations?.name || "Indonesia",
            
            tags: p.project_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [],
            tagIds: p.project_tags?.map((pt: any) => pt.tags?.id).filter(Boolean) || [],
            software: p.project_software?.map((ps: any) => ps.software?.name).filter(Boolean) || [],
            softwareIds: p.project_software?.map((ps: any) => ps.software?.id).filter(Boolean) || []
          }))

          // Client-side filtering for tags (many-to-many)
          if (tagsFilter.length > 0) {
            normalized = normalized.filter((project: any) =>
              tagsFilter.some((tagId) => project.tagIds?.includes(tagId))
            )
          }

          // Client-side filtering for software (many-to-many)
          if (softwareFilter.length > 0) {
            normalized = normalized.filter((project: any) =>
              softwareFilter.some((swId) => project.softwareIds?.includes(swId))
            )
          }

          setProjects(normalized)
        }
      } catch (e) {
        console.error("Failed to fetch:", e)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [searchQuery, typologyFilter, locationFilter, tagsFilter.join(","), softwareFilter.join(","), sortFilter])

  // Build description of active filters for empty state
  const getFilterDescription = () => {
    const parts: string[] = []
    if (searchQuery) parts.push(`"${searchQuery}"`)
    if (typologyFilter && typologyFilter !== "all") parts.push("selected typology")
    if (locationFilter && locationFilter !== "all") parts.push("selected location")
    if (tagsFilter.length > 0) parts.push(`${tagsFilter.length} tag(s)`)
    if (softwareFilter.length > 0) parts.push(`${softwareFilter.length} software`)
    return parts.length > 0 ? parts.join(", ") : null
  }

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
             <Loader2 className="w-8 h-8 animate-spin text-gray-400"/>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed">
          <p className="text-gray-500">
            {getFilterDescription()
              ? `No projects found matching ${getFilterDescription()}.`
              : "No projects uploaded yet."}
          </p>
        </div>
      )}
    </>
  )
}

export default function HomePage() {
  return (
    <PageContainer scrollable={true}>
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<p>Loading projects...</p>}>
           <ProjectGrid />
        </Suspense>
      </div>
    </PageContainer>
  )
}