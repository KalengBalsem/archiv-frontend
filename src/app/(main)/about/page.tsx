import Image from "next/image"
import type { Metadata } from "next"
import { supabaseClient } from '@/utils/supabaseClient'

async function getArchiveStats() {
  // Fetch only necessary columns to keep it fast
  const { data, count } = await supabaseClient
    .from('projects')
    .select('user_id, author_name', { count: 'exact' })

  // Logic: Create a set of unique identifiers (User ID OR Author Name)
  // filter(Boolean) removes null/undefined values instantly
  const uniqueContributors = new Set(
    data?.map((p) => p.user_id || p.author_name).filter(Boolean)
  ).size

  return {
    projects: count || 0,
    contributors: uniqueContributors || 0,
  }
}

export const metadata: Metadata = {
  title: "About ARCH-IV",
  description: "Global 3D Architectural Archive.",
}

export default async function AboutPage() {
  const stats = await getArchiveStats()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">About ARCH-IV</h1>
        
        <div className="flex justify-center mb-10">
          <Image
            src="https://assets.archiv.tech/archiv_violet.png"
            alt="ARCH-IV logo"
            width={500}
            height={300}
            priority
            className="rounded-lg" 
          />
        </div>

        {/* --- STATS SECTION (2 Columns) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 border-y border-gray-200 py-8">
          <div className="text-center border-r-0 md:border-r border-gray-100">
            <span className="block text-5xl font-bold text-violet-600 mb-2">{stats.projects}</span>
            <span className="text-gray-500 text-sm uppercase tracking-widest font-medium">Archived Projects</span>
          </div>
          <div className="text-center">
            <span className="block text-5xl font-bold text-violet-600 mb-2">{stats.contributors}</span>
            <span className="text-gray-500 text-sm uppercase tracking-widest font-medium">Contributors</span>
          </div>
        </div>
        {/* -------------------------------- */}

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <p>
            ARCH-IV is a comprehensive digital archive dedicated to preserving and showcasing 3D architectural
            models from around the world. Our mission is to create an accessible platform where architects,
            students, and design enthusiasts can explore, study, and draw inspiration.
          </p>
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Collection</h2>
          <p>
            Our archive features a diverse range of architectural projects, from residential buildings to
            large-scale commercial developments. Each entry includes detailed metadata to support academic research.
          </p>
        </div>
      </div>
    </main>
  )
}