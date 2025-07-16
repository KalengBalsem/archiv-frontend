import Link from "next/link"
import Image from "next/image"
import { Calendar, Eye, MapPin, User } from "lucide-react"

interface Project {
    id: string
    title: string
    slug: string
    description: string
    status: string
    is_public: boolean
    view_count: number
    interaction_count: number
    thumbnail_url: string
    created_at: string
    completion_date: string
    gltf_url: string
    user: {
        username: string
        first_name: string
        last_name: string
    }
    building_typology: {
        name: string
        description: string
    }
    location: {
        name: string
        latitude: number
        longitude: number
    }
    tags: Array<{ name: string }>
    software: Array<{ name: string; vendor: string }>
}

interface ProjectCardProps {
    project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
        })
    }

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "k"
        }
        return num.toString()
    }

    return (
        <Link href={`/projects/${project.id}`}>
            <div className="group cursor-pointer">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                        <Image
                            src={project.thumbnail_url || "/placeholder.svg"}
                            alt={project.title}
                            width={400}
                            height={300}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {/* Status Badge */}
                        {project.status === "ongoing" && (
                            <div className="absolute top-3 right-3">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">Ongoing</span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors line-clamp-2">
                            {project.title}
                        </h3>

                        {/* Author and Location */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>
                                    {project.user.first_name} {project.user.last_name}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{project.location.name}</span>
                            </div>
                        </div>

                        {/* Building Type and Date */}
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                            <span className="font-medium">{project.building_typology.name}</span>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(project.created_at)}</span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <div>
                                <Eye className="h-4 w-4" />
                                <span>{formatNumber(project.view_count)} views 
                                </span>
                            </div>
                            <span>{project.interaction_count} interactions</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}