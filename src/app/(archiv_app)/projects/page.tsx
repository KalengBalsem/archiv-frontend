"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation" // <- Impor baru
import { supabaseClient } from "@/utils/supabaseClient"
import { Project } from "@/types/project"
import ProjectCard from "@/components/project-card"
import { mockProjects } from "@/lib/mockProjects" // <- Perbaiki impor (tanpa
import PageContainer from "@/components/layout/page-container"

// 1. Logika pemanggilan data dipindahkan ke komponennya sendiri
//    agar <Suspense> dapat menangkap hook useSearchParams()
function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // 2. Dapatkan parameter pencarian dari URL
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") // <- Mendapat "?q=..."

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
            user:users(username, display_name),
            building_typology:building_typologies(name),
            license:licenses(name),
            tags:project_tags(tag:tags(name)),
            software:project_software(software:software(name))
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })

        // 3. Terapkan filter pencarian di sisi server!
        if (searchQuery) {
          queryBuilder = queryBuilder.ilike("title", `%${searchQuery}%`)
        }

        const { data, error } = await queryBuilder

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
          setProjects([]) // Tidak ada data
          if (!searchQuery) {
             console.warn("⚠️ No Supabase projects found — using mock data")
             setProjects(mockProjects)
          }
        }
      } catch (e) {
        console.error("⚠️ Failed to fetch from Supabase:", e)
        setProjects(mockProjects)
      }

      setLoading(false)
    }

    fetchProjects()
  // 4. Jalankan ulang efek ini setiap kali `searchQuery` dari URL berubah
  }, [searchQuery])

  // 5. Logika 'filteredProjects' tidak lagi diperlukan.
  //    Supabase telah melakukan pemfilteran untuk kita.
  return (
    <>
      {loading ? (
        <p className="text-center text-gray-500">Loading projects...</p>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          {searchQuery
            ? `No projects found for "${searchQuery}".`
            : "No projects found."}
        </div>
      )}
    </>
  )
}


// --- Komponen Halaman Utama Anda ---
export default function HomePage() {
  // Semua state (searchQuery, showFilters, dll.) telah dihapus.
  // Semua 'useEffect' telah dipindahkan ke ProjectGrid.

  return (
    <PageContainer scrollable={true}>
      <Suspense fallback={<p className="text-center text-gray-500">Loading...</p>}>
        <ProjectGrid />
      </Suspense>
    </PageContainer>
  )
}