export interface Project {
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