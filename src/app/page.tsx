"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Project } from "@/types/project"
import ProjectCard from "@/components/project-card"
import LayoutWrapper from "@/components/layout-wrapper"

import { mockProjects } from "@/lib/mockProjects"
import { mock } from "node:test"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [buildingTypeFilter, setBuildingTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [softwareFilter, setSoftwareFilter] = useState("all")
  const [authorFilter, setAuthorFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [showFilters, setShowFilters] = useState(false)

  // Extract unique values for filter options
  const buildingTypes = [...new Set(mockProjects.map((p) => p.building_typology.name))].sort()
  const statuses = [...new Set(mockProjects.map((p) => p.status))].sort()
  const locations = [...new Set(mockProjects.map((p) => p.location.name))].sort()
  const allSoftware = [...new Set(mockProjects.flatMap((p) => p.software.map((s) => s.name)))].sort()
  const authors = [...new Set(mockProjects.map((p) => `${p.user.first_name} ${p.user.last_name}`))].sort()

  const filteredProjects = mockProjects
    .filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesBuildingType = buildingTypeFilter === "all" || project.building_typology.name === buildingTypeFilter
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      const matchesLocation = locationFilter === "all" || project.location.name === locationFilter
      const matchesSoftware = softwareFilter === "all" || project.software.some((s) => s.name === softwareFilter)
      const matchesAuthor =
        authorFilter === "all" || `${project.user.first_name} ${project.user.last_name}` === authorFilter

      return (
        matchesSearch && matchesBuildingType && matchesStatus && matchesLocation && matchesSoftware && matchesAuthor
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "most_viewed":
          return b.view_count - a.view_count
        case "most_interactions":
          return b.interaction_count - a.interaction_count
        case "title_az":
          return a.title.localeCompare(b.title)
        case "title_za":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

  return (
    <LayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center max-w-4xl mx-auto">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search projects, tags, or building types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg border-gray-300 focus:border-black focus:ring-black"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6 border-gray-300 hover:border-black hover:bg-gray-50"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Building Type</label>
                  <Select value={buildingTypeFilter} onValueChange={setBuildingTypeFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {buildingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Software</label>
                  <Select value={softwareFilter} onValueChange={setSoftwareFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Software</SelectItem>
                      {allSoftware.map((software) => (
                        <SelectItem key={software} value={software}>
                          {software}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                  <Select value={authorFilter} onValueChange={setAuthorFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Authors</SelectItem>
                      {authors.map((author) => (
                        <SelectItem key={author} value={author}>
                          {author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="most_viewed">Most Viewed</SelectItem>
                      <SelectItem value="most_interactions">Most Interactions</SelectItem>
                      <SelectItem value="title_az">Title A-Z</SelectItem>
                      <SelectItem value="title_za">Title Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setBuildingTypeFilter("all")
                    setStatusFilter("all")
                    setLocationFilter("all")
                    setSoftwareFilter("all")
                    setAuthorFilter("all")
                    setSortBy("newest")
                  }}
                  className="text-sm"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-8 text-center">
          <p className="text-gray-600">
            {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"} found
          </p>
        </div>

        {/* Project Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </LayoutWrapper>
  )
}