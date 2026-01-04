import type { Project } from "@/types/project";

export const mockProjects: Project[] = [
  {
    id: "1",
    title: "Modern Office Complex",
    slug: "modern-office-complex",
    description:
      "A contemporary office building featuring sustainable design principles and innovative workspace solutions.",
    status: "completed",
    views: 1247,
    thumbnail_url: "/placeholder.svg?height=300&width=400",
    gltf_url: "/models/office-complex.gltf",
    created_at: "2023-01-15T10:30:00Z",
    completed_date: "2023-06-30", // Renamed from completion_date
    
    // Updated to match Author interface
    author: { 
      name: "Jane Smith",
      avatar_url: "/avatars/jane.jpg" // Added mock avatar
    },
    
    // Flattened fields
    typology: "Commercial",
    location: "San Francisco, CA",
    license: "CC BY 4.0",
    
    // Flattened arrays
    tags: ["Office", "Modern", "Glass", "Sustainable", "LEED"],
    software: ["Revit", "3ds Max", "V-Ray"],
  },
  {
    id: "2",
    title: "Residential Tower",
    slug: "residential-tower",
    description:
      "A 40-story residential tower designed with sustainability and community in mind.",
    status: "completed",
    views: 892,
    thumbnail_url: "/placeholder.svg?height=300&width=400",
    gltf_url: "/models/residential-tower.gltf",
    created_at: "2022-08-20T14:15:00Z",
    completed_date: "2022-12-15",
    
    author: { 
      name: "David Park",
      avatar_url: "/avatars/david.jpg"
    },
    
    typology: "Residential",
    location: "New York, NY",
    license: "MIT License",
    
    tags: ["Residential", "High-rise", "Sustainable", "Community"],
    software: ["ArchiCAD", "Lumion", "AutoCAD"],
  },
  {
    id: "3",
    title: "Cultural Center",
    slug: "cultural-center",
    description:
      "A modern cultural center featuring flexible exhibition spaces and community areas.",
    status: "completed",
    views: 1456,
    thumbnail_url: "/placeholder.svg?height=300&width=400",
    gltf_url: "/models/cultural-center.gltf",
    created_at: "2023-03-10T09:45:00Z",
    completed_date: "2023-09-20",
    
    author: { 
      name: "Sarah Johnson",
      avatar_url: "/avatars/sarah.jpg"
    },
    
    typology: "Cultural",
    location: "Chicago, IL",
    license: "CC BY-NC-SA 4.0",
    
    tags: ["Cultural", "Public", "Contemporary", "Exhibition"],
    software: ["Rhino", "Grasshopper", "Enscape"],
  },
];