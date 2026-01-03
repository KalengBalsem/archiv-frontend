"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabaseClient } from "@/utils/supabaseClient" 
import { ArrowLeft, Loader2, FileText, Image as ImageIcon, Box, User, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PageContainer from "@/components/layout/page-container"

// Helper: Membuat URL-friendly slug
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Hapus karakter aneh
    .replace(/[\s_-]+/g, '-')    // Ganti spasi dengan strip
    .replace(/^-+|-+$/g, '')     // Hapus strip di awal/akhir
    + '-' + Date.now();          // Tambah timestamp agar UNIK
}

// Tipe data opsi database
type OptionItem = { id: string; name: string; description?: string; vendor?: string; email?: string }

export default function AdminUploadPage() {
  const router = useRouter()
  
  // --- STATE ---
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    buildingTypeId: "",
    locationId: "",
    completionDate: "",
    status: "published", // Default aman
    licenseId: "",
    ownerId: "",         // [BARU] ID Pemilik Proyek
  })

  // State Opsi Database
  const [usersList, setUsersList] = useState<OptionItem[]>([]) // [BARU] Daftar User
  const [typologies, setTypologies] = useState<OptionItem[]>([])
  const [licenses, setLicenses] = useState<OptionItem[]>([])
  const [softwareOptions, setSoftwareOptions] = useState<OptionItem[]>([])
  const [tagsOptions, setTagsOptions] = useState<OptionItem[]>([])
  const [locations, setLocations] = useState<OptionItem[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  // State Pilihan User
  const [selectedTags, setSelectedTags] = useState<string[]>([]) 
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]) 
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]) // [BARU]
  
  // State File & Loading
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("") 
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<File[] | null>(null)

  // 1. FETCH DATA (Users & Options)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true)
        const results = await Promise.all([
          supabaseClient.from('users').select('id, full_name, email'), // [BARU] Ambil User
          supabaseClient.from('building_typologies').select('id, name'),
          supabaseClient.from('licenses').select('id, name'),
          supabaseClient.from('software').select('id, name, vendor'),
          supabaseClient.from('tags').select('id, name'),
          supabaseClient.from('locations').select('id, name')
        ])

        // Format User List
        const formattedUsers = (results[0].data || []).map((u: any) => ({
            id: u.id,
            name: u.full_name || u.email || "Unnamed User",
            email: u.email
        }))

        setUsersList(formattedUsers)
        setTypologies(results[1].data || [])
        setLicenses(results[2].data || [])
        setSoftwareOptions(results[3].data || [])
        setTagsOptions(results[4].data || [])
        setLocations(results[5].data || [])

      } catch (error) {
        console.error("Error fetching options:", error)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    fetchOptions()
  }, [])

  // 2. HANDLERS
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggle = (id: string, currentList: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  // Toggle Contributor logic (exclude Owner)
  const toggleContributor = (userId: string) => {
    if (userId === formData.ownerId) return; // Owner tidak bisa jadi contributor
    setSelectedContributors(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  // 3. LOGIKA SUBMIT ADMIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi Wajib: Owner harus dipilih
    if (!formData.title || !formData.ownerId || !formData.buildingTypeId || !formData.licenseId || !modelFile || !thumbnailFile) {
      alert("Please fill in all required fields (*)")
      return
    }

    setIsSubmitting(true)

    try {
      // A. Cek Sesi Admin
      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session) throw new Error("Admin must be logged in.")

      // B. Fungsi Helper Upload
      const uploadFile = async (file: File | null, folderName: string) => {
        if (!file) return null
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', folderName)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })

        if (!res.ok) {
          const errJson = await res.json()
          throw new Error(errJson.error || "Upload failed")
        }
        const json = await res.json()
        return json.url ?? null
      }

      setUploadStatus("Uploading assets...")

      // C. Eksekusi Upload
      const [modelUrl, thumbnailUrl, ...galleryUrls] = await Promise.all([
        uploadFile(modelFile, 'models'),
        uploadFile(thumbnailFile, 'images'),
        ...(additionalFiles || []).map(f => uploadFile(f, 'documents'))
      ])

      setUploadStatus("Saving project data...")

      // D. Generate Slug
      const generatedSlug = generateSlug(formData.title);

      // E. Insert Project (Sebagai Admin untuk User Lain)
      const { data: project, error: projectError } = await supabaseClient
        .from('projects')
        .insert({
          user_id: formData.ownerId, // <--- KUNCI: ID Owner Pilihan Admin
          title: formData.title,
          slug: generatedSlug,
          description: formData.description,
          building_typology_id: formData.buildingTypeId,
          license_id: formData.licenseId,
          location_id: formData.locationId,
          gltf_url: modelUrl,
          thumbnail_url: thumbnailUrl,
          status: formData.status,
        })
        .select()
        .single()

      if (projectError) throw projectError

      // F. Insert Relasi (Contributors, Tags, Software, Images)
      const relationsPromises = []

      // Contributors
      if (selectedContributors.length > 0) {
        const contribData = selectedContributors.map(uid => ({
          project_id: project.id,
          user_id: uid,
          role: 'Team Member'
        }))
        relationsPromises.push(supabaseClient.from('project_contributors').insert(contribData))
      }

      // Software
      if (selectedSoftware.length > 0) {
        const softInserts = selectedSoftware.map(sid => ({ project_id: project.id, software_id: sid }))
        relationsPromises.push(supabaseClient.from('project_software').insert(softInserts))
      }

      // Tags
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tid => ({ project_id: project.id, tag_id: tid }))
        relationsPromises.push(supabaseClient.from('project_tags').insert(tagInserts))
      }

      // Gallery Images
      const validGalleryUrls = galleryUrls.filter(u => u !== null)
      if (validGalleryUrls.length > 0) {
        const imgInserts = validGalleryUrls.map(url => ({
          project_id: project.id,
          image_url: url as string,
          caption: "Supporting Document"
        }))
        relationsPromises.push(supabaseClient.from('project_images').insert(imgInserts))
      }

      await Promise.all(relationsPromises)

      // Sukses
      router.push(`/project/${project.id}`)

    } catch (err: any) {
      console.error(err)
      alert(`Error: ${err.message}`)
      setUploadStatus("")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingOptions) {
    return <div className="h-screen flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2"/> Loading Knowledge Base...</div>
  }

  return (
    <PageContainer>
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-light tracking-tight text-gray-900 mb-2 flex items-center gap-2">
                <User className="h-8 w-8"/> Admin Upload Mode
            </h1>
            <p className="text-gray-500">Upload and manage projects on behalf of students.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            
            {/* 0. OWNER SELECTION */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 space-y-4">
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Project Ownership</h3>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-blue-900">Project Owner *</label>
                    <Select onValueChange={(val) => handleSelectChange("ownerId", val)}>
                        <SelectTrigger className="h-11 bg-white border-blue-200"><SelectValue placeholder="Select Student / Owner" /></SelectTrigger>
                        <SelectContent>
                            {usersList.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-blue-600">This user will have full access to manage this project.</p>
                </div>

                {/* Contributors */}
                <div className="pt-2">
                    <label className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Contributors</label>
                    <div className="h-32 overflow-y-auto border border-blue-200 rounded-md p-2 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {usersList.filter(u => u.id !== formData.ownerId).map(u => (
                            <div key={u.id} 
                                    onClick={() => toggleContributor(u.id)}
                                    className={`cursor-pointer text-xs p-2 rounded border flex justify-between items-center transition-all ${selectedContributors.includes(u.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 hover:bg-blue-50'}`}>
                                <span className="truncate mr-2">{u.name}</span>
                                {selectedContributors.includes(u.id) && <span className="text-[10px] bg-white/20 px-1 rounded">Member</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 1. METADATA */}
            <div className="space-y-5">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">1. Project Metadata</h3>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Project Title *</label>
                <Input name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Vertical Bamboo Housing" className="h-11"/>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea name="description" value={formData.description} onChange={handleInputChange} required rows={5} placeholder="Explain the design concept..." className="resize-none"/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="grid gap-2">
                   <label className="text-sm font-medium">Building Typology *</label>
                   <Select onValueChange={(val) => handleSelectChange("buildingTypeId", val)}>
                     <SelectTrigger className="h-11"><SelectValue placeholder="Select Type" /></SelectTrigger>
                     <SelectContent>{typologies.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                   </Select>
                </div>
                <div className="grid gap-2">
                   <label className="text-sm font-medium">Location *</label>
                   <Select onValueChange={(val) => handleSelectChange("locationId", val)}>
                     <SelectTrigger className="h-11"><SelectValue placeholder="Select Location" /></SelectTrigger>
                     <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                   </Select>
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="grid gap-2">
                   <label className="text-sm font-medium">Completion Date</label>
                   <Input type="date" name="completionDate" onChange={handleInputChange} className="h-11"/>
                 </div>
                 <div className="grid gap-2">
                   <label className="text-sm font-medium">License *</label>
                   <Select onValueChange={(val) => handleSelectChange("licenseId", val)}>
                     <SelectTrigger className="h-11"><SelectValue placeholder="Select License" /></SelectTrigger>
                     <SelectContent>{licenses.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                   </Select>
                 </div>
              </div>
            </div>

            {/* 2. TAGS & SOFTWARE */}
            <div className="space-y-5 pt-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">2. Context & Tools</h3>
              
              <div className="grid gap-3">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tagsOptions.map((tag) => (
                    <button key={tag.id} type="button" onClick={() => handleToggle(tag.id, selectedTags, setSelectedTags)}
                      className={`px-3 py-1.5 text-xs font-medium border rounded-full transition-all ${selectedTags.includes(tag.id) ? "bg-black text-white border-black" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium">Software Used</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {softwareOptions.map((sw) => (
                    <button key={sw.id} type="button" onClick={() => handleToggle(sw.id, selectedSoftware, setSelectedSoftware)}
                      className={`p-3 text-left border rounded-lg transition-all flex flex-col justify-center ${selectedSoftware.includes(sw.id) ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"}`}>
                      <span className="font-semibold text-sm">{sw.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">{sw.vendor}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. ASSETS */}
            <div className="space-y-5 pt-4">
               <h3 className="text-lg font-medium text-gray-900 border-b pb-2">3. Digital Assets</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Model Upload */}
                 <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-black transition-colors bg-gray-50/50">
                    <Box className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                    <label className="block text-sm font-semibold mb-1 cursor-pointer text-gray-900">
                      Upload 3D Model *
                      <input type="file" accept=".glb,.gltf" onChange={(e) => setModelFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-500">.GLB (Max 100MB)</p>
                    {modelFile && <div className="mt-3 text-xs bg-green-100 text-green-800 py-1 px-2 rounded inline-block truncate max-w-full">{modelFile.name}</div>}
                 </div>

                 {/* Thumbnail Upload */}
                 <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-black transition-colors bg-gray-50/50">
                    <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                    <label className="block text-sm font-semibold mb-1 cursor-pointer text-gray-900">
                      Upload Thumbnail *
                      <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-500">JPG/PNG (4:3)</p>
                    {thumbnailFile && <div className="mt-3 text-xs bg-green-100 text-green-800 py-1 px-2 rounded inline-block truncate max-w-full">{thumbnailFile.name}</div>}
                 </div>
               </div>

               {/* Additional Files */}
               <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white">
                 <div className="flex items-center gap-3">
                   <div className="bg-gray-100 p-2 rounded-lg"><FileText className="w-5 h-5 text-gray-600"/></div>
                   <div>
                     <p className="text-sm font-medium">Supporting Documents</p>
                     <p className="text-xs text-gray-500">Drawings, PDFs, Renders</p>
                   </div>
                 </div>
                 <label className="cursor-pointer">
                   <span className="text-xs font-semibold bg-black text-white px-3 py-2 rounded-md hover:bg-gray-800">Choose Files</span>
                   <input type="file" multiple accept=".pdf,image/*" onChange={(e) => setAdditionalFiles(e.target.files ? Array.from(e.target.files) : null)} className="hidden" />
                 </label>
               </div>
               {additionalFiles && additionalFiles.length > 0 && (
                 <div className="text-xs text-gray-500 pl-1">{additionalFiles.length} additional files selected</div>
               )}
            </div>

            {/* SUBMIT */}
            <div className="pt-6">
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-medium bg-black hover:bg-gray-900 text-white shadow-lg shadow-gray-200 transition-all">
                {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> {uploadStatus || "Processing..."}</> : "Upload & Create Project"}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </PageContainer>
  )
}