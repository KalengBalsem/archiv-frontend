export interface Project {
  id: string
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  gltf_url?: string
  location?: { name: string } | null

  status: string
  is_public?: boolean // optional, safe for missing data
  view_count?: number
  interaction_count?: number
  completion_date?: string
  views?: number
  created_at: string

  user: { username: string; display_name?: string } | null
  building_typology?: { name: string } | null
  license?: { name: string } | null
  tags?: { tag: { name: string } }[]
  software?: { software: { name: string } }[]
}
