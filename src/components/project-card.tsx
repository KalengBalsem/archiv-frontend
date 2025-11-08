"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, Eye, MapPin, User } from "lucide-react"
import ModelPreview from "@/components/ModelPreview"
import { Project } from "@/types/project"

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    })
  }

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0"
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  return (
    <Link href={`/projects/${project.slug || project.id}`}>
      <div className="group cursor-pointer">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
          {/* Thumbnail */}
          <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
            {project.gltf_url ? (
              // Use the preview (poster + hover-to-init viewer) as the main thumbnail when a model exists
              <div className="w-full h-full group-hover:scale-105 transition-transform duration-200">
                <ModelPreview src={project.gltf_url} poster={project.thumbnail_url} className="w-full h-full" />
              </div>
            ) : (
              <Image
                src={project.thumbnail_url || "/placeholder.svg"}
                alt={project.title}
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            )}
            {/* Status Badge */}
            {project.status && (
              <div className="absolute top-3 right-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === "ongoing"
                      ? "bg-blue-100 text-blue-800"
                      : project.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors line-clamp-2">
              {project.title}
            </h3>

            {/* Author + Location */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>
                  {project.user?.display_name || project.user?.username || "Unknown"}
                </span>
              </div>
              {project.location?.name && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{project.location.name}</span>
                </div>
              )}
            </div>

            {/* Building Type + Date */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span className="font-medium">
                {project.building_typology?.name || "—"}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(project.created_at)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{formatNumber(project.view_count)} views</span>
              </div>
              <span>{formatNumber(project.interaction_count)} interactions</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
