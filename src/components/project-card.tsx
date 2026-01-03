"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, Eye, MapPin, User, Box } from "lucide-react"
import { Project } from "@/types/project"
import { Badge } from "@/components/ui/badge"

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  
  // Helper: Format Date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
  }

  // Helper: Format Numbers (1.2k views)
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0"
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  return (
    <Link href={`/projects/${project.slug}`} className="group block h-full">
      <div className="group cursor-pointer flex flex-col h-full">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
          
          {/* --- THUMBNAIL AREA --- */}
          <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
            {project.thumbnail_url ? (
              <Image
                src={project.thumbnail_url}
                alt={project.title}
                width={600}
                height={450}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Box className="w-12 h-12" />
              </div>
            )}

            {/* Overlay Status Badge */}
            <div className="absolute top-3 right-3 flex gap-2">
               {project.status !== 'published' && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    {project.status}
                  </Badge>
               )}
            </div>

            {/* Typology Badge (Bottom Left) */}
            <div className="absolute bottom-3 left-3">
                 <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm hover:bg-white">
                    {project.typology}
                 </Badge>
            </div>
          </div>

          {/* --- CONTENT AREA --- */}
          <div className="p-5 flex flex-col flex-grow">
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
              {project.title}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{project.location}</span>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    
                    {/* Author */}
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                            {project.author.avatar_url ? (
                                <Image src={project.author.avatar_url} width={24} height={24} alt="Avatar" />
                            ) : (
                                <User className="h-3 w-3 text-gray-400" />
                            )}
                        </div>
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
                            {project.author.name}
                        </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(project.created_at)}</span>
                    </div>

                </div>
            </div>

          </div>
        </div>
      </div>
    </Link>
  )
}