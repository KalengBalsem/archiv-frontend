"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/providers/AuthProvider"
import { supabaseClient } from "@/utils/supabaseClient"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  social_links: {
    website?: string
    twitter?: string
    github?: string
    linkedin?: string
  } | null
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  
  // State
  const [profile, setProfile] = useState<Profile | null>(null)
  const [socials, setSocials] = useState({ website: "", twitter: "", github: "", linkedin: "" })
  
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  // 1. Fetch Profile Data
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
        setLoadingData(false)
        return
    }

    const loadProfile = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        if (error && error.code !== "PGRST116") throw error

        const existingData = data || {}
        const dbSocials = existingData.social_links || {}

        // Fallback: Use Google/Outlook picture if DB is empty
        const fallbackAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

        // Populate State
        setProfile({
          id: user.id,
          username: existingData.username || "",
          full_name: existingData.full_name || user.user_metadata?.full_name || "",
          avatar_url: existingData.avatar_url || fallbackAvatar,
          bio: existingData.bio || "",
          social_links: dbSocials
        })

        setSocials({
          website: dbSocials.website || "",
          twitter: dbSocials.twitter || "",
          github: dbSocials.github || "",
          linkedin: dbSocials.linkedin || "",
        })

      } catch (err: any) {
        setMessage({ type: 'error', text: err.message })
      } finally {
        setLoadingData(false)
      }
    }

    loadProfile()
  }, [user, authLoading])

  // 2. Handlers
  const handleProfileChange = (field: keyof Profile, value: string) => {
    if (!profile) return
    setProfile(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSocialChange = (field: string, value: string) => {
    setSocials(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!profile || !user) return
    setSaving(true)
    setMessage(null)

    // Validation
    if (!profile.username || profile.username.trim().length < 3) {
        setMessage({ type: 'error', text: "Username must be at least 3 characters." })
        setSaving(false)
        return
    }

    const payload = {
      id: user.id,
      username: profile.username.trim(),
      full_name: profile.full_name?.trim(),
      bio: profile.bio?.trim(),
      avatar_url: profile.avatar_url, // Saves the auto-detected URL to DB
      social_links: socials,
    }

    try {
        const { error: upsertError } = await supabaseClient
            .from("users")
            .upsert(payload)

        if (upsertError) {
            if (upsertError.code === '23505') {
                throw new Error("This username is already taken.")
            }
            throw upsertError
        }

        setMessage({ type: 'success', text: "Profile saved successfully!" })
        setTimeout(() => setMessage(null), 3000)

    } catch (err: any) {
        setMessage({ type: 'error', text: err.message })
    } finally {
        setSaving(false)
    }
  }

  // 3. Render
  if (authLoading || loadingData) {
    return (
        <div className="flex h-[50vh] items-center justify-center">
             <Loader2 className="animate-spin text-muted-foreground" />
        </div>
    )
  }

  if (!user) {
    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">Please sign in to view this page.</p>
        </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="space-y-8">
        
        {/* Header */}
        <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your profile and public information.</p>
        </div>

        {/* Feedback Messages */}
        {message && (
            <div className={`p-4 rounded flex items-center gap-3 ${
                message.type === 'error' ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-green-50 text-green-900 border border-green-200'
            }`}>
                {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                <span className="text-sm font-medium">{message.text}</span>
            </div>
        )}

        {profile && (
            <div className="grid gap-8">
                
                {/* 1. Avatar Section (Read Only) */}
                <div className="flex items-center gap-6 pb-6 border-b">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden border bg-muted flex-shrink-0">
                        {profile.avatar_url ? (
                            <img 
                                src={profile.avatar_url} 
                                alt="Avatar" 
                                className="h-full w-full object-cover" 
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 text-2xl font-bold">
                                {profile.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium">Profile Picture</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            This is managed by your login provider (Google/Microsoft).
                        </p>
                    </div>
                </div>

                {/* 2. Basic Info */}
                <div className="grid gap-5 pb-6 border-b">
                     <h3 className="text-lg font-medium">Public Profile</h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input 
                                id="username"
                                value={profile.username ?? ""}
                                onChange={(e) => handleProfileChange("username", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input 
                                id="full_name"
                                value={profile.full_name ?? ""}
                                onChange={(e) => handleProfileChange("full_name", e.target.value)}
                            />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                            id="bio"
                            value={profile.bio ?? ""}
                            onChange={(e) => handleProfileChange("bio", e.target.value)}
                            className="min-h-[100px]"
                        />
                     </div>
                </div>

                {/* 3. Social Links */}
                <div className="grid gap-5">
                    <h3 className="text-lg font-medium">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input placeholder="https://..." value={socials.website} onChange={(e) => handleSocialChange('website', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Twitter / X</Label>
                            <Input placeholder="@username" value={socials.twitter} onChange={(e) => handleSocialChange('twitter', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>GitHub</Label>
                            <Input placeholder="username" value={socials.github} onChange={(e) => handleSocialChange('github', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>LinkedIn</Label>
                            <Input placeholder="Profile URL" value={socials.linkedin} onChange={(e) => handleSocialChange('linkedin', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={() => window.location.reload()} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

            </div>
        )}
      </div>
    </div>
  )
}