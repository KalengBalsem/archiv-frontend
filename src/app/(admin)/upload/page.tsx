"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabaseClient } from "@/utils/supabaseClient" 
import { ArrowLeft, Loader2, FileText, Image as ImageIcon, Box, User, Users, ShieldAlert, Search, RefreshCw, PenTool, Plus, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PageContainer from "@/components/layout/page-container"
import { convertPdfToImages } from "@/utils/pdf-converter"
import { FilePreview } from "@/components/file-preview" 

// --- HELPER FUNCTIONS ---
const generateSlug = (title: string) => {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now()
}

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
    status: "published", 
    licenseId: "", 
    ownerId: "", 
    manualAuthor: "" 
  })

  // Toggle state for Author Mode
  const [isManualAuthorMode, setIsManualAuthorMode] = useState(false)

  // [NEW] State for Manual Contributors
  const [manualContributors, setManualContributors] = useState<{name: string, role: string}[]>([])
  const [tempContributorName, setTempContributorName] = useState("")
  const [tempContributorRole, setTempContributorRole] = useState("Team Member")

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

  // [NEW] Manual Contributor Handlers
  const addManualContributor = () => {
    if (!tempContributorName.trim()) return
    setManualContributors([...manualContributors, { 
        name: tempContributorName, 
        role: tempContributorRole 
    }])
    setTempContributorName("") 
    setTempContributorRole("Team Member")
  }

  const removeManualContributor = (index: number) => {
    setManualContributors(prev => prev.filter((_, i) => i !== index))
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

  // --- UPLOAD HELPER ---
  const uploadFile = async (file: File | null, folder: string) => {
    if (!file) return null
    const { data: { session } } = await supabaseClient.auth.getSession()
    if (!session) throw new Error("No session")

    let fileType = file.type
    if (!fileType) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        const map: Record<string, string> = { jpg:'image/jpeg', png:'image/png', webp:'image/webp', glb:'model/gltf-binary', pdf:'application/pdf' }
        fileType = map[ext || ''] || 'application/octet-stream'
    }

    const initRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ filename: file.name, filetype: fileType, folder, filesize: file.size })
    })
    
    if (!initRes.ok) throw new Error("Upload init failed")
    const { uploadUrl, publicUrl } = await initRes.json()

    const uploadRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': fileType } })
    if (!uploadRes.ok) throw new Error("Storage upload failed")

    return publicUrl
  }

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasOwner = isManualAuthorMode ? !!formData.manualAuthor : !!formData.ownerId;
    
    if (!formData.title || !hasOwner || !modelFile || !thumbnailFile) return alert("Missing required fields (Title, Owner, Model, or Thumbnail)")

    setIsSubmitting(true)
    setUploadStatus("Uploading assets...")

    try {
        const [modelUrl, thumbUrl, ...galleryUrls] = await Promise.all([
            uploadFile(modelFile, 'models'),
            uploadFile(thumbnailFile, 'images'),
            ...additionalFiles.map(f => uploadFile(f, 'documents'))
        ])

        setUploadStatus("Saving data...")
        
        const finalUserId = isManualAuthorMode ? null : formData.ownerId; 
        const finalAuthorName = isManualAuthorMode ? formData.manualAuthor : null; 
        
        const { data: project, error } = await supabaseClient.from('projects').insert({
            title: formData.title,
            slug: generateSlug(formData.title),
            description: formData.description,
            
            user_id: finalUserId,
            author_name: finalAuthorName,

            building_typology_id: formData.buildingTypeId,
            location_id: formData.locationId,
            license_id: formData.licenseId,
            status: formData.status,
            gltf_url: modelUrl,
            thumbnail_url: thumbUrl,
            completion_date: formData.completionDate || null
        }).select().single()

        if (error) throw error

        const batchOps = [
            // 1. Registered Contributors
            ...selections.contributors.map(uid => 
                supabaseClient.from('project_contributors').insert({ 
                    project_id: project.id, 
                    user_id: uid, 
                    role: 'Team Member' 
                })
            ),
            
            // 2. [NEW] Manual Contributors
            ...manualContributors.map(c => 
                supabaseClient.from('project_contributors').insert({ 
                    project_id: project.id, 
                    user_id: null,
                    name: c.name,
                    role: c.role 
                })
            ),

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

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin mr-2"/> Verifying...</div>
  if (!isAuthorized) return <PageContainer>Access Denied</PageContainer>

  return (
    <PageContainer>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/projects" className="flex items-center text-gray-500 hover:text-black mb-6"><ArrowLeft className="h-4 w-4 mr-2"/> Back</Link>
        
        <div className="mb-8">
            <h1 className="text-3xl flex items-center gap-2 mb-2"><User className="h-8 w-8"/> Admin Upload</h1>
            <p className="text-gray-500">Upload on behalf of students.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            
            {/* OWNER SELECTION */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-blue-900 block">Project Owner / Author *</label>
                    
                    <button 
                        type="button"
                        onClick={() => setIsManualAuthorMode(!isManualAuthorMode)}
                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 underline transition-colors"
                    >
                        {isManualAuthorMode ? <><RefreshCw className="w-3 h-3"/> Switch to Registered User</> : <><PenTool className="w-3 h-3"/> Input Manual Name (Unregistered)</>}
                    </button>
                </div>

                {isManualAuthorMode ? (
                    <div className="animate-in fade-in zoom-in duration-200">
                        <Input 
                            name="manualAuthor"
                            placeholder="e.g. Sarah Senior (Alumni 2023)"
                            value={formData.manualAuthor}
                            onChange={handleInput}
                            className="bg-white border-blue-300 focus-visible:ring-blue-400"
                        />
                        <p className="text-xs text-blue-600 mt-2">
                            This creates a project without linking to a specific user account. 
                            The name entered here will be displayed publicly.
                        </p>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in duration-200">
                        <Select onValueChange={(v) => handleSelect("ownerId", v)}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Select Registered Student" /></SelectTrigger>
                            <SelectContent>
                                {options.users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-blue-600 mt-2">The selected user will be able to edit this project later.</p>
                    </div>
                )}
                
                {/* [UPDATED] CONTRIBUTORS SECTION (Mixed Manual & Registered) */}
                <div className="mt-6 pt-4 border-t border-blue-200">
                    <h3 className="text-sm font-bold text-blue-900 mb-4 uppercase tracking-wider">Project Team</h3>
                    
                    {/* A. REGISTERED USERS (Search) */}
                    <div className="mb-6">
                        <label className="text-sm font-medium text-blue-900 flex items-center gap-2 mb-2"><Users className="w-4 h-4"/> Registered Members (With Account)</label>
                        <div className="relative mb-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
                            <Input placeholder="Search students..." className="pl-9 bg-white" value={contributorSearch} onChange={e => setContributorSearch(e.target.value)} />
                        </div>
                        {/* Selected Registered List */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selections.contributors.map(uid => {
                                const user = options.users.find(u => u.id === uid)
                                return (
                                    <div key={uid} className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {user?.name}
                                        <button type="button" onClick={() => toggleSelection('contributors', uid)}><X className="w-3 h-3"/></button>
                                    </div>
                                )
                            })}
                        </div>
                        {/* Search Results */}
                        {contributorSearch && (
                            <div className="h-24 overflow-y-auto border rounded bg-white p-2 grid grid-cols-2 gap-2">
                                {options.users
                                    .filter(u => u.id !== formData.ownerId && u.name.toLowerCase().includes(contributorSearch.toLowerCase()))
                                    .map(u => (
                                    <div key={u.id} onClick={() => toggleSelection('contributors', u.id)} 
                                            className={`cursor-pointer text-xs p-2 rounded border truncate hover:bg-gray-50`}>
                                        {u.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* B. MANUAL CONTRIBUTORS (Input) */}
                    <div className="pt-4 border-t border-blue-200">
                        <label className="text-sm font-medium text-blue-900 flex items-center gap-2 mb-2"><PenTool className="w-4 h-4"/> Manual Contributors (No Account)</label>
                        
                        <div className="flex gap-2 mb-3">
                            <Input 
                                placeholder="Name (e.g. Mr. Budi)" 
                                className="bg-white flex-1"
                                value={tempContributorName}
                                onChange={(e) => setTempContributorName(e.target.value)}
                            />
                            <Input 
                                placeholder="Role (e.g. Structural)" 
                                className="bg-white w-1/3" 
                                value={tempContributorRole}
                                onChange={(e) => setTempContributorRole(e.target.value)}
                            />
                            <Button type="button" onClick={addManualContributor} size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Manual List */}
                        <div className="space-y-2">
                            {manualContributors.map((c, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white border border-blue-200 px-3 py-2 rounded text-sm">
                                    <div>
                                        <span className="font-medium text-gray-900">{c.name}</span>
                                        <span className="text-gray-400 mx-2">|</span>
                                        <span className="text-gray-500 text-xs uppercase">{c.role}</span>
                                    </div>
                                    <button type="button" onClick={() => removeManualContributor(idx)} className="text-red-400 hover:text-red-600">
                                        <X className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                            {manualContributors.length === 0 && <p className="text-xs text-gray-400 italic">No manual contributors added.</p>}
                        </div>
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
                    {additionalFiles.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {additionalFiles.map((file, i) => (
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