"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react"

import { supabaseClient } from "@/utils/supabaseClient"
import ModelViewer from "@/components/model-viewer"
import { Button } from "@/components/ui/button"
import AttachmentModal from "@/components/attachment-modal"
import { mockProjects } from "@/lib/mockProjects"
import PageContainer from "@/components/layout/page-container"

// --- CRITICAL HELPER: Bypasses ISP blocking by forcing the custom domain ---
const getSafeUrl = (url: string) => {
  if (!url) return "/placeholder.svg";
  
  if (url.startsWith("/")) return url;
  if (url.includes("assets.archiv.tech")) return url;
  
  return url.replace(/https?:\/\/.*\.r2\.dev/, "https://assets.archiv.tech");
}

// Helper to format Supabase image data for the AttachmentModal
const mapToAttachment = (img: any) => ({
  file_url: getSafeUrl(img.image_url),
  title: img.caption || "Project Image",
  // Extra fields kept just in case you expand later, but only file_url and title are needed now
  id: img.id,
})

export default function ProjectDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null)

  useEffect(() => {
    if (!slug) return;

    const fetchProject = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabaseClient
          .from("projects")
          .select(`
            *,
            users:users!projects_user_id_fkey (full_name, username, avatar_url),
            licenses (name, url),
            building_typologies (name, description),
            project_images (id, image_url, caption, position, created_at),
            project_tags (
              tag: tags (name)
            )
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
          tags: data.project_tags?.map((item: any) => ({ tag: item.tag })) || []
        };

        // Sort images by 'position'
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
      {/* 1. Back Button Row */}
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
        </Link>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: 3D Viewer */}
        <div className="lg:col-span-2">
          {project.gltf_url ? (
            <div className="bg-gray-100 rounded-xl aspect-[4/3] overflow-hidden border shadow-sm">
              <ModelViewer 
                src={getSafeUrl(project.gltf_url)} 
                poster={getSafeUrl(project.thumbnail_url)} 
                className="w-full h-full" 
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl aspect-[4/3] flex items-center justify-center border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ExternalLink className="h-8 w-8" />
                </div>
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
                {project.building_typology && (
                    <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase">Typology</dt>
                        <dd className="mt-1 text-base font-medium text-gray-900">{project.building_typology.name}</dd>
                    </div>
                )}
                
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

                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Author</dt>
                  <dd className="mt-1 text-base font-medium text-gray-900">
                    {project.user?.full_name || "Unknown Architect"}
                  </dd>
                </div>

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

      {/* 3. Image Gallery Grid */}
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
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  quality={10} 
                  decoding="async" 
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                                
                {/* Optional: Add 'Document' Badge if it came from the 'documents' folder */}
                {img.image_url?.includes('documents/') && (
                   <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                      DOC
                   </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Full Screen Modal */}
      <AttachmentModal 
        attachment={selectedAttachment} 
        onClose={() => setSelectedAttachment(null)}
      />

    </PageContainer>
  )
}