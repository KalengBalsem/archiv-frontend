"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabaseClient } from "@/utils/supabaseClient" 
import { ArrowLeft, Loader2, FileText, Image as ImageIcon, Box, User, Users, ShieldAlert, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PageContainer from "@/components/layout/page-container"
import { convertPdfToImages } from "@/utils/pdf-converter"
// Import the FilePreview component above (or from separate file)
import { FilePreview } from "@/components/FilePreview" 

// --- HELPER FUNCTIONS ---
const generateSlug = (title: string) => {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now()
}

type OptionItem = { id: string; name: string; description?: string; vendor?: string; email?: string }

export default function AdminUploadPage() {
  const router = useRouter()
  
  // --- STATE ---
  const [formData, setFormData] = useState({
    title: "", description: "", buildingTypeId: "", locationId: "", completionDate: "", status: "published", licenseId: "", ownerId: "",
  })

  // Options
  const [options, setOptions] = useState<{
    users: OptionItem[], typologies: OptionItem[], licenses: OptionItem[], software: OptionItem[], tags: OptionItem[], locations: OptionItem[]
  }>({ users: [], typologies: [], licenses: [], software: [], tags: [], locations: [] })

  // UI State
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // Selections
  const [selections, setSelections] = useState<{ tags: string[], software: string[], contributors: string[] }>({ tags: [], software: [], contributors: [] })
  const [contributorSearch, setContributorSearch] = useState("")
  
  // Files
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("") 
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [pdfState, setPdfState] = useState({ processing: false, progress: "" })

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (!session) return router.push('/login')

        const { data: user } = await supabaseClient.from('users').select('is_admin').eq('id', session.user.id).single()
        if (!user?.is_admin) return setIsAuthorized(false)

        setIsAuthorized(true)

        // Fetch all options in parallel
        const [users, types, licenses, soft, tags, locs] = await Promise.all([
          supabaseClient.from('users').select('id, full_name, email'),
          supabaseClient.from('building_typologies').select('id, name'),
          supabaseClient.from('licenses').select('id, name'),
          supabaseClient.from('software').select('id, name, vendor'),
          supabaseClient.from('tags').select('id, name'),
          supabaseClient.from('locations').select('id, name')
        ])

        setOptions({
            users: (users.data || []).map((u: any) => ({ id: u.id, name: u.full_name || u.email, email: u.email })),
            typologies: types.data || [],
            licenses: licenses.data || [],
            software: soft.data || [],
            tags: tags.data || [],
            locations: locs.data || []
        })

      } catch (error) {
        console.error("Init failed:", error)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [router])

  // --- HANDLERS ---
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSelect = (name: string, value: string) => 
    setFormData(prev => ({ ...prev, [name]: value }))

  const toggleSelection = (key: keyof typeof selections, id: string) => {
    setSelections(prev => ({
        ...prev,
        [key]: prev[key].includes(id) ? prev[key].filter(i => i !== id) : [...prev[key], id]
    }))
  }

  // --- FILE HANDLING ---
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    const newFiles: File[] = []
    
    setPdfState({ processing: true, progress: "Analyzing..." })

    try {
      for (const file of files) {
        if (file.type === 'application/pdf') {
          // Convert PDF using helper
          const images = await convertPdfToImages(file, (curr, total) => {
             setPdfState(prev => ({ ...prev, progress: `Converting ${file.name}: Page ${curr}/${total}` }))
          })
          newFiles.push(...images)
        } else {
          newFiles.push(file)
        }
      }
      setAdditionalFiles(prev => [...prev, ...newFiles])
    } catch (err) {
      alert("Failed to process files.")
    } finally {
      setPdfState({ processing: false, progress: "" })
    }
  }

  // --- UPLOAD HELPER (ROBUST) ---
  const uploadFile = async (file: File | null, folder: string) => {
    if (!file) return null
    const { data: { session } } = await supabaseClient.auth.getSession()
    if (!session) throw new Error("No session")

    // 1. Detect/Fallback File Type
    let fileType = file.type
    if (!fileType) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        const map: Record<string, string> = { jpg:'image/jpeg', png:'image/png', webp:'image/webp', glb:'model/gltf-binary', pdf:'application/pdf' }
        fileType = map[ext || ''] || 'application/octet-stream'
    }

    // 2. Sanitize Filename
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')

    // 3. Get Presigned URL
    const initRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ filename: cleanName, filetype: fileType, folder })
    })
    
    if (!initRes.ok) throw new Error("Upload init failed")
    const { uploadUrl, publicUrl } = await initRes.json()

    // 4. Upload to R2
    const uploadRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': fileType } })
    if (!uploadRes.ok) throw new Error("Storage upload failed")

    return publicUrl
  }

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.ownerId || !modelFile || !thumbnailFile) return alert("Missing required fields")

    setIsSubmitting(true)
    setUploadStatus("Uploading assets...")

    try {
        // Upload everything in parallel
        const [modelUrl, thumbUrl, ...galleryUrls] = await Promise.all([
            uploadFile(modelFile, 'models'),
            uploadFile(thumbnailFile, 'images'),
            ...additionalFiles.map(f => uploadFile(f, 'documents'))
        ])

        setUploadStatus("Saving data...")
        
        // Create Project
        const { data: project, error } = await supabaseClient.from('projects').insert({
            title: formData.title,
            slug: generateSlug(formData.title),
            description: formData.description,
            user_id: formData.ownerId,
            building_typology_id: formData.buildingTypeId,
            location_id: formData.locationId,
            license_id: formData.licenseId,
            status: formData.status,
            gltf_url: modelUrl,
            thumbnail_url: thumbUrl,
            completion_date: formData.completionDate || null
        }).select().single()

        if (error) throw error

        // Create Relations
        const batchOps = [
            ...selections.contributors.map(uid => supabaseClient.from('project_contributors').insert({ project_id: project.id, user_id: uid, role: 'Team Member' })),
            ...selections.software.map(sid => supabaseClient.from('project_software').insert({ project_id: project.id, software_id: sid })),
            ...selections.tags.map(tid => supabaseClient.from('project_tags').insert({ project_id: project.id, tag_id: tid })),
            ...galleryUrls.filter(Boolean).map((url, i) => supabaseClient.from('project_images').insert({ project_id: project.id, image_url: url, caption: `Gallery ${i+1}`, position: i }))
        ]
        
        await Promise.all(batchOps)
        router.push(`/project/${project.id}`)

    } catch (err: any) {
        alert(err.message)
    } finally {
        setIsSubmitting(false)
    }
  }

  // --- RENDER ---
  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin mr-2"/> Verifying...</div>
  
  if (!isAuthorized) return (
    <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <ShieldAlert className="h-12 w-12 text-red-500 mb-4"/>
            <h1 className="text-xl font-bold">Access Denied</h1>
            <p className="text-gray-500 mb-6">Admins only.</p>
            <Link href="/"><Button variant="outline">Go Home</Button></Link>
        </div>
    </PageContainer>
  )

  return (
    <PageContainer>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/" className="flex items-center text-gray-500 hover:text-black mb-6"><ArrowLeft className="h-4 w-4 mr-2"/> Back</Link>
        
        <div className="mb-8">
            <h1 className="text-3xl font-light flex items-center gap-2 mb-2"><User className="h-8 w-8"/> Admin Upload</h1>
            <p className="text-gray-500">Upload on behalf of students.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            
            {/* OWNER */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <label className="text-sm font-bold text-blue-900 block mb-2">Project Owner *</label>
                <Select onValueChange={(v) => handleSelect("ownerId", v)}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Student" /></SelectTrigger>
                    <SelectContent>{options.users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
                
                <div className="mt-4">
                    <label className="text-sm font-medium text-blue-900 flex items-center gap-2 mb-2"><Users className="w-4 h-4"/> Contributors</label>
                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
                        <Input placeholder="Search..." className="pl-9 bg-white" value={contributorSearch} onChange={e => setContributorSearch(e.target.value)} />
                    </div>
                    <div className="h-32 overflow-y-auto border rounded bg-white p-2 grid grid-cols-2 gap-2">
                        {options.users.filter(u => u.id !== formData.ownerId && u.name.toLowerCase().includes(contributorSearch.toLowerCase())).map(u => (
                            <div key={u.id} onClick={() => toggleSelection('contributors', u.id)} 
                                 className={`cursor-pointer text-xs p-2 rounded border truncate ${selections.contributors.includes(u.id) ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>
                                {u.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* METADATA */}
            <div className="space-y-4">
                <h3 className="font-medium border-b pb-2">Metadata</h3>
                <Input name="title" placeholder="Project Title *" value={formData.title} onChange={handleInput} required />
                <Textarea name="description" placeholder="Description *" rows={4} value={formData.description} onChange={handleInput} required />
                
                <div className="grid md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleSelect("buildingTypeId", v)}><SelectTrigger><SelectValue placeholder="Typology *" /></SelectTrigger><SelectContent>{options.typologies.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                    <Select onValueChange={v => handleSelect("locationId", v)}><SelectTrigger><SelectValue placeholder="Location *" /></SelectTrigger><SelectContent>{options.locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
                    <Input type="date" name="completionDate" onChange={handleInput} />
                    <Select onValueChange={v => handleSelect("licenseId", v)}><SelectTrigger><SelectValue placeholder="License *" /></SelectTrigger><SelectContent>{options.licenses.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
                </div>
            </div>

            {/* TAGS/SOFTWARE */}
            <div className="space-y-4">
                <h3 className="font-medium border-b pb-2">Context</h3>
                <div>
                    <label className="text-sm font-medium block mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {options.tags.map(t => (
                            <button type="button" key={t.id} onClick={() => toggleSelection('tags', t.id)}
                                className={`px-3 py-1 text-xs rounded-full border ${selections.tags.includes(t.id) ? "bg-black text-white" : "hover:bg-gray-50"}`}>
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium block mb-2">Software</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {options.software.map(s => (
                            <button type="button" key={s.id} onClick={() => toggleSelection('software', s.id)}
                                className={`p-2 text-left border rounded text-xs ${selections.software.includes(s.id) ? "bg-black text-white" : "hover:bg-gray-50"}`}>
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ASSETS */}
            <div className="space-y-4">
                <h3 className="font-medium border-b pb-2">Assets</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50">
                        <Box className="mx-auto text-gray-400 mb-2"/>
                        <label className="cursor-pointer font-medium text-sm">Upload 3D Model *<input type="file" accept=".glb,.gltf" className="hidden" onChange={e => setModelFile(e.target.files?.[0] || null)}/></label>
                        {modelFile && <div className="text-xs bg-green-100 text-green-800 rounded px-2 py-1 mt-2 inline-block">{modelFile.name}</div>}
                    </div>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50">
                        <ImageIcon className="mx-auto text-gray-400 mb-2"/>
                        <label className="cursor-pointer font-medium text-sm">Upload Thumbnail *<input type="file" accept="image/*" className="hidden" onChange={e => setThumbnailFile(e.target.files?.[0] || null)}/></label>
                        {thumbnailFile && <div className="text-xs bg-green-100 text-green-800 rounded px-2 py-1 mt-2 inline-block">{thumbnailFile.name}</div>}
                    </div>
                </div>

                <div className="border rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2 items-center">
                            {pdfState.processing ? <Loader2 className="animate-spin text-blue-600 w-5 h-5"/> : <FileText className="text-gray-400 w-5 h-5"/>}
                            <div>
                                <p className="text-sm font-medium">Gallery & Documents</p>
                                <p className="text-xs text-gray-500">{pdfState.processing ? <span className="text-blue-600 animate-pulse">{pdfState.progress}</span> : "Supports PDF (Auto-Convert) & Images"}</p>
                            </div>
                        </div>
                        <label className={`cursor-pointer bg-black text-white px-3 py-1.5 rounded text-xs font-semibold ${pdfState.processing ? 'opacity-50 pointer-events-none' : ''}`}>
                            Add Files <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={handleFiles} disabled={pdfState.processing}/>
                        </label>
                    </div>

                    {/* LAG-FREE PREVIEW GRID */}
                    {additionalFiles.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {additionalFiles.map((file, i) => (
                                // This assumes you put FilePreview in the same file or imported it
                                <FilePreview key={`${file.name}-${i}`} file={file} onRemove={() => setAdditionalFiles(prev => prev.filter((_, idx) => idx !== i))}/>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Button type="submit" disabled={isSubmitting || pdfState.processing} className="w-full h-12 bg-black hover:bg-gray-800 text-white">
                {isSubmitting ? <><Loader2 className="mr-2 animate-spin"/> {uploadStatus}</> : "Create Project"}
            </Button>
        </form>
      </div>
    </PageContainer>
  )
}