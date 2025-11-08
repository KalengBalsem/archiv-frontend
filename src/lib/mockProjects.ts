import type { Project } from "@/types/project";

export const mockProjects: Project[] = [
  {
    id: "1",
    title: "Modern Office Complex",
    slug: "modern-office-complex",
    description:
      "A contemporary office building featuring sustainable design principles and innovative workspace solutions.",
    status: "completed",
    is_public: true,
    view_count: 1247,
    interaction_count: 89,
    views: 1247, // Ditambahkan
    thumbnail_url: "/placeholder.svg?height=300&width=400",
    created_at: "2023-01-15T10:30:00Z",
    completion_date: "2023-06-30",
    gltf_url: "/models/office-complex.gltf",
    user: { username: "jane_architect", display_name: "Jane Smith" },
    building_typology: { name: "Commercial" },
    location: { name: "San Francisco, CA" },
    license: { name: "CC BY 4.0" }, // Ditambahkan
    tags: [
      { tag: { name: "Office" } },
      { tag: { name: "Modern" } },
      { tag: { name: "Glass" } },
      { tag: { name: "Sustainable" } },
      { tag: { name: "LEED" } },
    ],
    software: [
      { software: { name: "Revit" } },
      { software: { name: "3ds Max" } },
      { software: { name: "V-Ray" } },
    ],
  },
  {
    id: "2",
    title: "Residential Tower",
    slug: "residential-tower",
    description:
      "A 40-story residential tower designed with sustainability and community in mind.",
    status: "completed",
    is_public: true,
    view_count: 892,
    interaction_count: 67,
    views: 892, // Ditambahkan
    thumbnail_url: "/placeholder.svg?height=300&width=400",
    created_at: "2022-08-20T14:15:00Z",
    completion_date: "2022-12-15",
    gltf_url: "/models/residential-tower.gltf",
    user: { username: "david_designer", display_name: "David Park" },
    building_typology: { name: "Residential" },
    location: { name: "New York, NY" },
    license: { name: "MIT License" }, // Ditambahkan
    tags: [
      { tag: { name: "Residential" } },
      { tag: { name: "High-rise" } },
      { tag: { name: "Sustainable" } },
      { tag: { name: "Community" } },
    ],
    software: [
      { software: { name: "ArchiCAD" } },
      { software: { name: "Lumion" } },
      { software: { name: "AutoCAD" } },
    ],
  },
  {
    id: "3",
    title: "Cultural Center",
    slug: "cultural-center",
    description:
      "A modern cultural center featuring flexible exhibition spaces and community areas.",
    status: "completed",
    is_public: true,
    view_count: 1456,
    interaction_count: 123,
    views: 1456, // Ditambahkan
    thumbnail_url: "/placeholder.svg?height=300&width=400",
    created_at: "2023-03-10T09:45:00Z",
    completion_date: "2023-09-20",
    gltf_url: "/models/cultural-center.gltf",
    user: { username: "sarah_studios", display_name: "Sarah Johnson" },
    building_typology: { name: "Cultural" },
    location: { name: "Chicago, IL" },
    license: { name: "CC BY-NC-SA 4.0" }, // Ditambahkan
    tags: [
      { tag: { name: "Cultural" } },
      { tag: { name: "Public" } },
      { tag: { name: "Contemporary" } },
      { tag: { name: "Exhibition" } },
    ],
    software: [
      { software: { name: "Rhino" } },
      { software: { name: "Grasshopper" } },
      { software: { name: "Enscape" } },
    ],
  },
];