"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/providers/AuthProvider"
import { supabaseClient } from "@/utils/supabaseClient"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  social_links: Record<string, string> | null
}

export default function ProfilePage() {
  const { user, loading } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [socialText, setSocialText] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // -----------------------------------------------------
  // Load profile
  // -----------------------------------------------------
  useEffect(() => {
    if (!user) return

    const loadProfile = async () => {
      setError(null)

      const { data, error: fetchError } = await supabaseClient
        .from("users")
        .select(`id, username, full_name, avatar_url, bio, social_links`)
        .eq("id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        setError(fetchError.message)
        return
      }

      const existing = data ?? {
        id: user.id,
        username: null,
        full_name: null,
        avatar_url: null,
        bio: null,
        social_links: null,
      }

      setProfile(existing)
      setSocialText(existing.social_links ? JSON.stringify(existing.social_links, null, 2) : "")
    }

    loadProfile()
  }, [user])

  // -----------------------------------------------------
  // Handlers
  // -----------------------------------------------------
  const handleChange = (field: keyof Profile, value: string) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  const handleSave = async () => {
    if (!profile || !user) return
    setSaving(true)
    setError(null)

    // Username must exist (DB requires it)
    const finalUsername =
      profile.username?.trim() ||
      user.email?.split("@")[0] ||
      `user-${user.id.slice(0, 8)}`

    // Parse social JSON
    let parsedSocial: Record<string, string> | null = null
    if (socialText.trim() !== "") {
      try {
        const parsed = JSON.parse(socialText)
        if (typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Social links must be an object")
        }
        parsedSocial = parsed
      } catch (e) {
        setError("Invalid JSON in social links")
        setSaving(false)
        return
      }
    }

    const payload = {
      id: user.id,
      username: finalUsername,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      social_links: parsedSocial,
    }

    const { data, error: upsertError } = await supabaseClient
      .from("users")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single()

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return
    }

    // Update UI
    setProfile(data)
    setSaving(false)
  }

  // -----------------------------------------------------
  // Rendering
  // -----------------------------------------------------

  if (loading) {
    return (
        <div className="p-8">Loading...</div>
    )
  }

  if (!user) {
    return (

        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold">Not signed in</h2>
          <p className="text-sm text-gray-500">Please sign in to edit your profile.</p>
        </div>
  
    )
  }

  return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Your Profile</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avatar + Info */}
            <div className="md:col-span-1 flex flex-col items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-28 h-28 rounded-full object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-3xl">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="text-center">
                <div className="font-medium">
                  {profile.full_name || user.email}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full name</label>
                <Input
                  value={profile.full_name ?? ""}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  value={profile.username ?? ""}
                  onChange={(e) => handleChange("username", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <Textarea
                  value={profile.bio ?? ""}
                  onChange={(e) => handleChange("bio", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Social Links (JSON)</label>
                <Textarea
                  className="font-mono text-sm"
                  rows={6}
                  value={socialText}
                  onChange={(e) => setSocialText(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save profile"}
                </Button>
                <Button variant="ghost" onClick={() => window.location.reload()}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

  )
}
