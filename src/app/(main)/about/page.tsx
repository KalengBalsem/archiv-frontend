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
          ARCH-IV is a <strong>Design Intelligence Network</strong>. 
          While scientific research lives on forever in journals, architectural design often disappears 
          after the final jury. We are building the infrastructure to turn ephemeral student projects 
          into a living, searchable, and scalable database.
        </p>
        <br/>
        <p>
          The name creates a double meaning. While it functions as a digital <strong>archive</strong>, 
          the suffix <strong>IV</strong> (4) honors the foundational four years of architectural education. 
          It represents the critical period of growth that is currently being lost, a gap we aim to close 
          by preserving that intense creative output for the future.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">More Than Just Images</h2>
        <p>
          We treat design as structured data. Our platform supports:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Full 3D Integration:</strong> View and inspect GLTF/Revit models directly in the browser.</li>
          <li><strong>Deep Metadata:</strong> Search by typology, climate, design intent, and site context.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">A Community-Owned Project</h2>
        <p>
          ARCH-IV is an experiment in <strong>collective ownership</strong>. We believe that the tools 
          used to preserve knowledge should belong to the people who create it. This is an open-source 
          initiative: anyone who contributes—whether through code, design, or data—has a stake in 
          the platform's future.
        </p>
        <br/>
        <p>This is just the beginning of a better building design & engineering future.</p>
      </div>
      </div>
    </main>
  )
}