"use client"

import { useState } from "react"
import { ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import LayoutWrapper from "@/components/layout-wrapper"
import AttachmentModal from "@/components/attachment-modal"

// Mock data - in a real app, this would come from an API or database
const projectData = {
  "1": {
    title: "Modern Office Complex",
    slug: "modern-office-complex",
    description:
      "A contemporary office building featuring sustainable design principles and innovative workspace solutions. The structure incorporates natural lighting, energy-efficient systems, and flexible floor plans to accommodate modern work environments.",
    status: "completed",
    is_public: true,
    view_count: 1247,
    interaction_count: 89,
    thumbnail_url: "/placeholder.svg?height=600&width=800",
    created_at: "2023-01-15T10:30:00Z",
    completion_date: "2023-06-30",
    gltf_url: "/models/office-complex.gltf",
    user: {
      username: "jane_architect",
      first_name: "Jane",
      last_name: "Smith",
    },
    building_typology: {
      name: "Commercial",
      description: "Office and commercial buildings",
    },
    location: {
      name: "San Francisco, CA",
      latitude: 37.7749,
      longitude: -122.4194,
    },
    tags: [{ name: "Office" }, { name: "Modern" }, { name: "Glass" }, { name: "Sustainable" }, { name: "LEED" }],
    software: [
      { name: "Revit", vendor: "Autodesk" },
      { name: "3ds Max", vendor: "Autodesk" },
      { name: "V-Ray", vendor: "Chaos Group" },
    ],
    attachments: [
      {
        id: "1",
        title: "Site Plan",
        type: "drawing",
        category: "Site Documentation",
        file_url: "/placeholder.svg?height=400&width=600",
        thumbnail_url: "/placeholder.svg?height=200&width=300",
        file_size: "2.4 MB",
        file_format: "PDF",
        uploaded_at: "2023-01-20T14:30:00Z",
        description: "Comprehensive site plan showing building placement and landscape design",
      },
      {
        id: "2",
        title: "Floor Plans - Level 1",
        type: "drawing",
        category: "Architectural Drawings",
        file_url: "/placeholder.svg?height=400&width=800",
        thumbnail_url: "/placeholder.svg?height=200&width=400",
        file_size: "3.1 MB",
        file_format: "PDF",
        uploaded_at: "2023-01-22T09:15:00Z",
        description: "Detailed floor plan for ground level including dimensions and room layouts",
      },
      {
        id: "3",
        title: "Building Sections",
        type: "drawing",
        category: "Architectural Drawings",
        file_url: "/placeholder.svg?height=600&width=400",
        thumbnail_url: "/placeholder.svg?height=300&width=200",
        file_size: "1.8 MB",
        file_format: "PDF",
        uploaded_at: "2023-01-25T11:45:00Z",
        description: "Cross-sectional views showing interior spatial relationships",
      },
      {
        id: "4",
        title: "Construction Details",
        type: "documentation",
        category: "Technical Documentation",
        file_url: "/placeholder.svg?height=400&width=600",
        thumbnail_url: "/placeholder.svg?height=200&width=300",
        file_size: "4.2 MB",
        file_format: "PDF",
        uploaded_at: "2023-02-01T16:20:00Z",
        description: "Detailed construction drawings and specifications",
      },
      {
        id: "5",
        title: "Design Process Sketches",
        type: "image",
        category: "Design Process",
        file_url: "/placeholder.svg?height=600&width=800",
        thumbnail_url: "/placeholder.svg?height=300&width=400",
        file_size: "1.2 MB",
        file_format: "JPG",
        uploaded_at: "2023-01-18T13:10:00Z",
        description: "Early conceptual sketches and design development process",
      },
      {
        id: "6",
        title: "Material Board",
        type: "image",
        category: "Design Process",
        file_url: "/placeholder.svg?height=800&width=600",
        thumbnail_url: "/placeholder.svg?height=400&width=300",
        file_size: "2.8 MB",
        file_format: "JPG",
        uploaded_at: "2023-01-30T10:30:00Z",
        description: "Material selection and color palette documentation",
      },
    ],
  },
  "2": {
    title: "Residential Tower",
    slug: "residential-tower",
    description:
      "A 40-story residential tower designed with sustainability and community in mind. Features include green rooftops, energy-efficient systems, and shared community spaces that foster resident interaction.",
    status: "completed",
    is_public: true,
    view_count: 892,
    interaction_count: 67,
    thumbnail_url: "/placeholder.svg?height=600&width=800",
    created_at: "2022-08-20T14:15:00Z",
    completion_date: "2022-12-15",
    gltf_url: "/models/residential-tower.gltf",
    user: {
      username: "david_designer",
      first_name: "David",
      last_name: "Park",
    },
    building_typology: {
      name: "Residential",
      description: "Housing and residential buildings",
    },
    location: {
      name: "New York, NY",
      latitude: 40.7128,
      longitude: -74.006,
    },
    tags: [{ name: "Residential" }, { name: "High-rise" }, { name: "Sustainable" }, { name: "Community" }],
    software: [
      { name: "ArchiCAD", vendor: "Graphisoft" },
      { name: "Lumion", vendor: "Act-3D" },
      { name: "AutoCAD", vendor: "Autodesk" },
    ],
    attachments: [
      {
        id: "1",
        title: "Site Plan",
        type: "drawing",
        category: "Site Documentation",
        file_url: "/placeholder.svg?height=400&width=600",
        thumbnail_url: "/placeholder.svg?height=200&width=300",
        file_size: "2.4 MB",
        file_format: "PDF",
        uploaded_at: "2023-01-20T14:30:00Z",
        description: "Comprehensive site plan showing building placement and landscape design",
      },
      {
        id: "2",
        title: "Floor Plans - Level 1",
        type: "drawing",
        category: "Architectural Drawings",
        file_url: "/placeholder.svg?height=400&width=800",
        thumbnail_url: "/placeholder.svg?height=200&width=400",
        file_size: "3.1 MB",
        file_format: "PDF",
        uploaded_at: "2023-01-22T09:15:00Z",
        description: "Detailed floor plan for ground level including dimensions and room layouts",
      },
      {
        id: "3",
        title: "Building Sections",
        type: "drawing",
        category: "Architectural Drawings",
        file_url: "/placeholder.svg?height=600&width=400",
        thumbnail_url: "/placeholder.svg?height=300&width=200",
        file_size: "1.8 MB",
        file_format: "PDF",
        uploaded_at: "2023-01-25T11:45:00Z",
        description: "Cross-sectional views showing interior spatial relationships",
      },
      {
        id: "4",
        title: "Construction Details",
        type: "documentation",
        category: "Technical Documentation",
        file_url: "/placeholder.svg?height=400&width=600",
        thumbnail_url: "/placeholder.svg?height=200&width=300",
        file_size: "4.2 MB",
        file_format: "PDF",
        uploaded_at: "2023-02-01T16:20:00Z",
        description: "Detailed construction drawings and specifications",
      },
      {
        id: "5",
        title: "Design Process Sketches",
        type: "image",
        category: "Design Process",
        file_url: "/placeholder.svg?height=600&width=800",
        thumbnail_url: "/placeholder.svg?height=300&width=400",
        file_size: "1.2 MB",
        file_format: "JPG",
        uploaded_at: "2023-01-18T13:10:00Z",
        description: "Early conceptual sketches and design development process",
      },
      {
        id: "6",
        title: "Material Board",
        type: "image",
        category: "Design Process",
        file_url: "/placeholder.svg?height=800&width=600",
        thumbnail_url: "/placeholder.svg?height=400&width=300",
        file_size: "2.8 MB",
        file_format: "JPG",
        uploaded_at: "2023-01-30T10:30:00Z",
        description: "Material selection and color palette documentation",
      },
    ],
  },
}

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const project = projectData[params.id as keyof typeof projectData]

  const [selectedAttachment, setSelectedAttachment] = useState<null | typeof project.attachments[0]>(null)

  if (!project) {
    return (
      <LayoutWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-medium text-gray-900 mb-4">Project not found</h1>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Archive
              </Button>
            </Link>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="hover:bg-gray-50 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Archive
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 3D Model Viewer Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 rounded-lg aspect-[4/3] flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                  <ExternalLink className="h-8 w-8" />
                </div>
                <p className="text-lg font-medium">3D Model Viewer</p>
                <p className="text-sm">Interactive 3D model would be embedded here</p>
              </div>
            </div>
          </div>

          {/* Project Metadata */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              {/* Title and Description */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </div>

              {/* Key Facts */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Project Details</h2>

                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Building Typology</dt>
                    <dd className="mt-1 text-lg text-gray-900">{project.building_typology.name}</dd>
                    <dd className="text-sm text-gray-600">{project.building_typology.description}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Completion Date</dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      {new Date(project.completion_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Location</dt>
                    <dd className="mt-1 text-lg text-gray-900">{project.location.name}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Author</dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      {project.user.first_name} {project.user.last_name}
                    </dd>
                    <dd className="text-sm text-gray-600">@{project.user.username}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Software Used</dt>
                    <dd className="mt-1">
                      <div className="flex flex-wrap gap-2">
                        {project.software.map((software) => (
                          <Badge
                            key={software.name}
                            variant="secondary"
                            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                            title={`by ${software.vendor}`}
                          >
                            {software.name}
                          </Badge>
                        ))}
                      </div>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Project Stats</dt>
                    <dd className="mt-1">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Views:</span>
                          <span className="ml-2 font-medium">{project.view_count.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Interactions:</span>
                          <span className="ml-2 font-medium">{project.interaction_count}</span>
                        </div>
                      </div>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tags</dt>
                    <dd className="mt-1">
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Link key={tag.name} href={`/?search=${encodeURIComponent(tag.name)}`}>
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-gray-50 border-gray-300 text-gray-700"
                            >
                              {tag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2D Images and Documentation */}
        <div className="mt-16">
          {project.attachments && project.attachments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="aspect-[4/3] bg-gray-100 overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  onClick={() => setSelectedAttachment(attachment)}
                >
                  <Image
                    src={attachment.file_url || "/placeholder.svg"}
                    alt={attachment.title}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {/* Attachment Modal */}
      {selectedAttachment && (
        <AttachmentModal
          attachment={selectedAttachment}
          attachments={project.attachments}
          onClose={() => setSelectedAttachment(null)}
          onNavigate={setSelectedAttachment}
        />
      )}
    </LayoutWrapper>
  )
}
