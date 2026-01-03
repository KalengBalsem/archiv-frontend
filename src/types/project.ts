// types/project.ts
export interface Project {
  id: string
  title: string
  slug: string
  description?: string
  thumbnail_url: string
  gltf_url?: string
  status: string
  views: number
  created_at: string
  
  // Relasi yang sudah di-flat-kan (disederhanakan)
  author: {
    name: string
    avatar_url?: string
  }
  typology: string
  license: string
  location: string
  tags: string[]
  software: string[]
}