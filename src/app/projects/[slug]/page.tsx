"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { supabaseClient } from "@/utils/supabaseClient"
import ModelViewer from "@/components/ModelViewer"
import { Button } from "@/components/ui/button"
import LayoutWrapper from "@/components/layout-wrapper"
import AttachmentModal from "@/components/attachment-modal"
import { mockProjects } from "@/lib/mockProjects"

export default function ProjectDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null)

  useEffect(() => {
    if (!slug) return

    const fetchProject = async () => {
      setLoading(true)

      try {
        // Try fetching from Supabase
        const { data, error } = await supabaseClient
          .from("projects")
          .select(`
            *,
            users (username, display_name, avatar_url),
            licenses (name, url),
            building_typologies (name, description),
            project_images (id, image_url, caption, position)
          `)
          .eq("slug", slug)
          .single()
        
        if (error || !data || !data.users || !data.project_images?.length) {
          console.warn("Incomplete data, using mock for:", slug)
          const mock = mockProjects.find((p) => p.slug === slug)
          setProject(mock || data)
        } else {
          setProject(data)
        }
      } catch (err) {
        console.error("Error fetching project:", err)
        const mock = mockProjects.find((p) => p.slug === slug)
        setProject(mock || null)
      }

      setLoading(false)
    }

    fetchProject()
  }, [slug])

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="container mx-auto px-4 py-16 text-center text-gray-600">
          Loading project...
        </div>
      </LayoutWrapper>
    )
  }

  if (!project) {
    return (
      <LayoutWrapper>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-medium text-gray-900 mb-4">
            Project not found
          </h1>
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects Archive
            </Button>
          </Link>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-8">
          <Link href="/projects">
            <Button variant="outline" className="hover:bg-gray-50 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects Archive
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 3D Viewer placeholder */}
          <div className="lg:col-span-2">
            {project.gltf_url ? (
              <div className="bg-gray-100 rounded-lg aspect-[4/3] overflow-hidden border">
                <ModelViewer src={project.gltf_url} poster={project.thumbnail_url} className="w-full h-full" />
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg aspect-[4/3] flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ExternalLink className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-medium">3D Model Viewer</p>
                  <p className="text-sm">Interactive 3D model would be embedded here</p>
                </div>
              </div>
            )}
          </div>

          {/* Project Details */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Project Details
                </h2>

                {/* Ini adalah blok yang diperbarui */}
                <div className="space-y-4">
                  {/* Building Typology */}
                  {project.building_typology && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Building Typology
                      </dt>
                      <dd className="mt-1 text-lg text-gray-900">{project.building_typology.name}</dd>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {project.status}
                      </span>
                    </dd>
                  </div>

                  {/* Author */}
                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Author</dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      {project.user?.display_name || project.user?.username || "Unknown"}
                    </dd>
                  </div>

                  {/* License */}
                  {project.license && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">License</dt>
                      <dd className="mt-1 text-lg text-gray-900">
                        {project.license.name}
                      </dd>
                    </div>
                  )}

                  {/* --- BARU: Location --- */}
                  {project.location && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Location
                      </dt>
                      <dd className="mt-1 text-lg text-gray-900">
                        {project.location.name}
                      </dd>
                    </div>
                  )}

                  {/* --- BARU: Tags --- */}
                  {project.tags && project.tags.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Tags
                      </dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {/* DIUBAH: Tambahkan tipe di sini */}
                        {project.tags.map((t: { tag: { name: string } }) => (
                          <span
                            key={t.tag.name}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {t.tag.name}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}

                  {/* --- BARU: Software --- */}
                  {project.software && project.software.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Software
                      </dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {/* DIUBAH: Tambahkan tipe di sini */}
                        {project.software.map((s: { software: { name: string } }) => (
                          <span
                            key={s.software.name}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {s.software.name}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Images */}
        {/* Asumsi `project.project_images` adalah array (meski tidak ada di interface `Project`) */}
        {project.project_images?.length > 0 && (
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* DIUBAH: Menghapus `: any` untuk img */}
              {project.project_images.map((img: any) => (
                <div
                  key={img.id}
                  className="aspect-[4/3] bg-gray-100 overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  onClick={() => setSelectedAttachment(img)}
                >
                  <Image
                    src={img.image_url || "/placeholder.svg"}
                    alt={img.caption || "Project Image"}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attachment Modal */}
      {selectedAttachment && (
        <AttachmentModal
          attachment={selectedAttachment}
          attachments={project.project_images}
          onClose={() => setSelectedAttachment(null)}
          onNavigate={setSelectedAttachment}
        />
      )}
    </LayoutWrapper>
  )
}
