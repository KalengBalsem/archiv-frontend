"use client"

import type React from "react"

import { useState } from "react"
import { supabaseClient } from "@/utils/supabaseClient"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import PageContainer from "@/components/layout/page-container"

// Building typology options
const buildingTypes = [
  { id: "1", name: "Commercial", description: "Office and commercial buildings" },
  { id: "2", name: "Residential", description: "Housing and residential buildings" },
  { id: "3", name: "Cultural", description: "Museums, galleries, and cultural facilities" },
  { id: "4", name: "Educational", description: "Schools, universities, and educational facilities" },
  { id: "5", name: "Healthcare", description: "Hospitals, clinics, and medical facilities" },
  { id: "6", name: "Mixed-Use", description: "Buildings with multiple functions" },
]

// Software options
const softwareOptions = [
  { id: "1", name: "Revit", vendor: "Autodesk" },
  { id: "2", name: "ArchiCAD", vendor: "Graphisoft" },
  { id: "3", name: "SketchUp", vendor: "Trimble" },
  { id: "4", name: "Rhino", vendor: "Robert McNeel & Associates" },
  { id: "5", name: "AutoCAD", vendor: "Autodesk" },
  { id: "6", name: "Grasshopper", vendor: "Robert McNeel & Associates" },
  { id: "7", name: "3ds Max", vendor: "Autodesk" },
  { id: "8", name: "Cinema 4D", vendor: "Maxon" },
  { id: "9", name: "V-Ray", vendor: "Chaos Group" },
  { id: "10", name: "Lumion", vendor: "Act-3D" },
  { id: "11", name: "Enscape", vendor: "Enscape" },
]

// License options
const licenseOptions = [
  { id: "1", name: "CC-BY (Attribution)" },
  { id: "2", name: "CC-BY-SA (Attribution-ShareAlike)" },
  { id: "3", name: "CC-BY-NC (Attribution-NonCommercial)" },
  { id: "4", name: "CC-0 (Public Domain)" },
  { id: "5", name: "Proprietary" },
]

// Sample locations
const locations = [
  { id: "1", name: "San Francisco, CA" },
  { id: "2", name: "New York, NY" },
  { id: "3", name: "Chicago, IL" },
  { id: "4", name: "Boston, MA" },
  { id: "5", name: "Seattle, WA" },
  { id: "6", name: "Austin, TX" },
  { id: "7", name: "Los Angeles, CA" },
  { id: "8", name: "Miami, FL" },
]

// Sample tags
const suggestedTags = [
  "Modern",
  "Contemporary",
  "Sustainable",
  "Minimalist",
  "Industrial",
  "Art Deco",
  "Glass",
  "Stone",
  "Brick",
  "LEED",
  "Parametric",
  "BIM",
]

export default function UploadPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    buildingType: "",
    location: "",
    completionDate: "",
    status: "completed",
    tags: [] as string[],
    software: [] as string[],
    license: "",
  })

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<File[] | null>(null)

  // Handle basic input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle tag selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // Handle custom tag
  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags((prev) => [...prev, customTag.trim()])
      setCustomTag("")
    }
  }

  // Handle software selection
  const handleSoftwareToggle = (softwareId: string, softwareName: string) => {
    setSelectedSoftware((prev) =>
      prev.includes(softwareId) ? prev.filter((s) => s !== softwareId) : [...prev, softwareId],
    )
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate required fields
    if (!formData.title || !formData.description || !formData.buildingType || !formData.location || !formData.license) {
      alert("Please fill in all required fields")
      setIsSubmitting(false)
      return
    }

    try {
      // Upload files to Cloudflare R2 via server route
      const uploadFile = async (file: File | null) => {
        if (!file) return null
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        return json.url ?? null
      }

      const modelUrl = await uploadFile(modelFile)
      const thumbnailUrl = await uploadFile(thumbnailFile)

      const additionalUrls: string[] = []
      if (additionalFiles && additionalFiles.length > 0) {
        for (const f of additionalFiles) {
          const u = await uploadFile(f)
          if (u) additionalUrls.push(u)
        }
      }

      console.log('Uploaded files:', { modelUrl, thumbnailUrl, additionalUrls })

      // Optionally: create project record in Supabase (requires auth/valid session)
      // Example (you may need to add more fields and handle user_id via auth):
      // await supabaseClient.from('projects').insert({ title: formData.title, slug: formData.title.toLowerCase().replace(/\s+/g,'-'), description: formData.description, thumbnail_url: thumbnailUrl, gltf_url: modelUrl, status: formData.status })

      alert('Project uploaded (files stored). Check console for uploaded URLs.')
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed. See console for details.')
    }

    setIsSubmitting(false)
  }

  return (
    <PageContainer>
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Page header */}
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-4">Upload Project</h1>
          <p className="text-gray-600">Share your architectural work with the community. Fill in the details below.</p>
        </div>

        {/* Upload form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="space-y-8">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="title"
                placeholder="e.g., Modern Office Complex"
                value={formData.title}
                onChange={handleInputChange}
                className="h-11 border-gray-300 focus:border-black focus:ring-black"
                required
              />
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                name="description"
                placeholder="Describe your project, design approach, and key features..."
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className="border-gray-300 focus:border-black focus:ring-black resize-none"
                required
              />
            </div>

            {/* Building Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Building Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.buildingType}
                onValueChange={(value) => handleSelectChange("buildingType", value)}
              >
                <SelectTrigger className="h-11 border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue placeholder="Select a building type" />
                </SelectTrigger>
                <SelectContent>
                  {buildingTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <Select value={formData.location} onValueChange={(value) => handleSelectChange("location", value)}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue placeholder="Select or type a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Completion Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Completion Date</label>
              <Input
                type="date"
                name="completionDate"
                value={formData.completionDate}
                onChange={handleInputChange}
                className="h-11 border-gray-300 focus:border-black focus:ring-black"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Project Status</label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Tags</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 text-sm border rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-900 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add custom tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomTag())}
                  className="h-10 border-gray-300 focus:border-black focus:ring-black"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomTag}
                  className="border-gray-300 hover:border-black bg-transparent"
                >
                  Add
                </Button>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-2 bg-gray-100 px-2 py-1 rounded text-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Software Used */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Software Used</label>
              <div className="grid grid-cols-2 gap-2">
                {softwareOptions.map((software) => (
                  <button
                    key={software.id}
                    type="button"
                    onClick={() => handleSoftwareToggle(software.id, software.name)}
                    className={`p-3 text-left border rounded transition-colors ${
                      selectedSoftware.includes(software.id)
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-900 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="font-medium text-sm">{software.name}</div>
                    <div
                      className={`text-xs ${selectedSoftware.includes(software.id) ? "text-gray-300" : "text-gray-500"}`}
                    >
                      {software.vendor}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* License */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                License <span className="text-red-500">*</span>
              </label>
              <Select value={formData.license} onValueChange={(value) => handleSelectChange("license", value)}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue placeholder="Select a license" />
                </SelectTrigger>
                <SelectContent>
                  {licenseOptions.map((license) => (
                    <SelectItem key={license.id} value={license.name}>
                      {license.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Uploads Section */}
            <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">3D Model File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Drag and drop your GLTF/GLB file or click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">Maximum file size: 100MB</p>
                  <input
                    type="file"
                    accept=".gltf,.glb"
                    className="hidden"
                    onChange={(e) => setModelFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Thumbnail Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Drag and drop your thumbnail image or click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">Recommended: 800x600px, JPG/PNG</p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Additional Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Upload working drawings, documentation, or process images</p>
                  <p className="text-xs text-gray-500 mt-1">Multiple files allowed, up to 50MB total</p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => setAdditionalFiles(e.target.files ? Array.from(e.target.files) : null)}
                  />
                </div>
              </div>
            </div>

            {/* Checkbox for public */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                defaultChecked={true}
                className="h-4 w-4 border-gray-300 rounded text-black focus:ring-black"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                Make this project public
              </label>
            </div>

            {/* Submit and Cancel buttons */}
            <div className="flex gap-4 pt-8">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-black text-white hover:bg-gray-900 disabled:opacity-50"
              >
                {isSubmitting ? "Uploading..." : "Upload Project"}
              </Button>
              <Link href="/" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-gray-300 hover:border-black hover:bg-gray-50 bg-transparent"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
