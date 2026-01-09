"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ExternalLink, Loader2, Box, ImageIcon } from "lucide-react"

import { supabaseClient } from "@/utils/supabaseClient"
import ModelViewer from "@/components/project_page/model-viewer"
import { Button } from "@/components/ui/button"
import AttachmentModal from "@/components/project_page/attachment-modal"
import { mockProjects } from "@/lib/mockProjects"
import PageContainer from "@/components/layout/page-container"

// Helper to clean up URLs
const getSafeUrl = (url: string) => {
  if (!url) return "/placeholder.svg";
  if (url.startsWith("/")) return url;
  if (url.includes("assets.archiv.tech")) return url;
  return url.replace(/https?:\/\/.*\.r2\.dev/, "https://assets.archiv.tech");
}

const mapToAttachment = (img: any) => ({
  file_url: getSafeUrl(img.image_url),
  title: img.caption || "Project Image",
  id: img.id,
})

export default function ProjectDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'3d' | 'image'>('image') // Default to image for performance

  useEffect(() => {
    if (!slug) return;

    const fetchProject = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabaseClient
          .from("projects")
          .select(`
            *,
            users:user_id (full_name, username, avatar_url),
            licenses (name, url),
            building_typologies (name, description),
            locations (name, country),
            project_images (id, image_url, caption, position, created_at),
            
            project_tags (
              tag: tags (name)
            ),
            
            project_software (
              software: software (name, vendor)
            ),
            
            author_name
          `)
          .eq("slug", slug)
          .single();

        if (error) throw error;
        if (!data) throw new Error("No data returned");

        const formattedData = {
          ...data,
          user: data.users,
          license: data.licenses,
          building_typology: data.building_typologies,
          location_data: data.locations, // Map the relation, not just the ID
          
          // [FIX] Flatten Tags Relation
          tags: data.project_tags?.map((item: any) => ({ tag: item.tag })) || [],
          
          // [FIX] Flatten Software Relation
          software: data.project_software?.map((item: any) => item.software) || []
        };

        // Sort images
        if (formattedData.project_images) {
          formattedData.project_images = [...formattedData.project_images].sort((a: any, b: any) => {
            if (a.position == null && b.position == null) return a.id - b.id;
            if (a.position == null) return 1;
            if (b.position == null) return -1;
            return a.position - b.position;
          });
        }

        setProject(formattedData);
      } catch (err) {
        console.error("Error fetching project:", err);
        const mock = mockProjects.find((p) => p.slug === slug);
        setProject(mock || null);
      }
      setLoading(false);
    };

    fetchProject();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400"/>
      </div>
    )
  }
  
  if (!project) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-medium text-gray-900">Project not found</h1>
          <Link href="/projects">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back to Projects Archive</Button>
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: 3D Viewer / Image */}
        <div className="lg:col-span-2">
          {project.gltf_url ? (
            <div className="bg-gray-100 rounded-xl aspect-[4/3] overflow-hidden border shadow-sm relative">
              {/* View Mode Toggle */}
              <div className="absolute top-3 left-3 z-30 flex bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-1 shadow-md border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('image')}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'image' 
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  title="View Image"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Image</span>
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${viewMode === '3d' 
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  title="View 3D Model"
                >
                  <Box className="w-4 h-4" />
                  <span className="hidden sm:inline">3D</span>
                </button>
              </div>

              {/* Content based on view mode */}
              {viewMode === '3d' ? (
                <ModelViewer 
                  src={getSafeUrl(project.gltf_url)} 
                  poster={getSafeUrl(project.thumbnail_url)} 
                  className="w-full h-full" 
                />
              ) : (
                <div className="w-full h-full relative">
                  <Image
                    src={getSafeUrl(project.thumbnail_url) || "/placeholder.svg"}
                    alt={project.title || "Project thumbnail"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                    priority
                  />
                  {/* Click to load 3D hint */}
                  <button 
                    onClick={() => setViewMode('3d')}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group"
                  >
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 border border-gray-200 dark:border-gray-700">
                      <Box className="w-5 h-5 text-gray-900 dark:text-white" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to load 3D</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl aspect-[4/3] flex items-center justify-center border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-400">
                <ExternalLink className="h-8 w-8 mx-auto mb-4" />
                <p className="text-lg font-medium">No 3D Model</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Project Details */}
        <div className="lg:col-span-1 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{project.title}</h1>
              <p className="text-gray-600 leading-relaxed">{project.description}</p>
            </div>
            
            <div className="space-y-6 pt-6 border-t border-gray-100">
              
              <dl className="space-y-4">
                {/* 1. TYPOLOGY */}
                {project.building_typology && (
                    <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase">Typology</dt>
                        <dd className="mt-1 text-base font-medium text-gray-900">{project.building_typology.name}</dd>
                    </div>
                )}
                
                {/* 2. LOCATION (Relation) */}
                {project.location_data && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Location</dt>
                    <dd className="mt-1 text-base font-medium text-gray-900">{project.location_data.name}, {project.location_data.country}</dd>
                  </div>
                )}

                {/* 3. COMPLETED DATE */}
                {project.completion_date && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Completed</dt>
                    <dd className="mt-1 text-base font-medium text-gray-900">
                      {new Date(project.completion_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </dd>
                  </div>
                )}

                {/* 4. SOFTWARE USED (Updated for Relation) */}
                {project.software && project.software.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Software</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                       {project.software.map((s: any, idx: number) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-700 font-medium">
                             {s.name}
                          </span>
                       ))}
                    </dd>
                  </div>
                )}

                {/* 5. STATUS */}
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {project.status}
                    </span>
                  </dd>
                </div>

                {/* 6. AUTHOR */}
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Author</dt>
                  <dd className="mt-1 text-base font-medium text-gray-900">
                    {project.user?.full_name || project.author_name || "Unknown Architect"}
                  </dd>
                </div>

                {/* 7. LICENSE */}
                {project.license && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">License</dt>
                    <dd className="mt-1 text-sm text-gray-700">
                      {project.license.url ? (
                        <a href={project.license.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                          {project.license.name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        project.license.name
                      )}
                    </dd>
                  </div>
                )}

                {/* 8. TAGS (Updated for Relation) */}
                {project.tags && project.tags.length > 0 && (
                  <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</dt>
                      <dd className="flex flex-wrap gap-2">
                          {project.tags.map((t: any, index: number) => (
                              <span key={t.tag?.name || index} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                {t.tag?.name}
                              </span>
                          ))}
                      </dd>
                  </div>
                )}
              </dl>
            </div>
        </div>
      </div>

      {/* Image Gallery Grid */}
      {project.project_images?.length > 0 && (
        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {project.project_images.map((img: any) => (
              <div 
                key={img.id} 
                className="group aspect-[4/3] bg-gray-100 overflow-hidden rounded-lg cursor-pointer border hover:shadow-md transition-all duration-200 relative"
                onClick={() => setSelectedAttachment(mapToAttachment(img))}
              >
                <Image
                  src={getSafeUrl(img.image_url) || "/placeholder.svg"}
                  alt={img.caption || "Project Image"}
                  fill
                  quality={10}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {img.image_url?.includes('documents/') && (
                   <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">DOC</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AttachmentModal 
        attachment={selectedAttachment} 
        onClose={() => setSelectedAttachment(null)}
      />

    </PageContainer>
  )
}