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
  const searchQuery = searchParams.get("q") 

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
            building_typologies ( name ),
            licenses ( name ),
            locations ( name ),
            project_tags ( tags ( name ) ),
            project_software ( software ( name ) )
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })

        if (searchQuery) {
          queryBuilder = queryBuilder.ilike("title", `%${searchQuery}%`)
        }

        const { data, error } = await queryBuilder

        if (error) {
          console.error("Supabase error:", error)
          setProjects([])
        } else if (data) {
          const normalized: Project[] = data.map((p: any) => ({
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
                name: (Array.isArray(p.users) ? p.users[0] : p.users)?.full_name || "Unknown Architect",
                avatar_url: (Array.isArray(p.users) ? p.users[0] : p.users)?.avatar_url
            },
            typology: p.building_typologies?.name || "Unknown Type",
            license: p.licenses?.name || "All Rights Reserved",
            location: p.locations?.name || "Indonesia",
            
            tags: p.project_tags?.map((pt: any) => pt.tags?.name) || [],
            software: p.project_software?.map((ps: any) => ps.software?.name) || []
          }))

          setProjects(normalized)
        }
      } catch (e) {
        console.error("Failed to fetch:", e)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [searchQuery])

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
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500">
            {searchQuery
              ? `No projects found for "${searchQuery}".`
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