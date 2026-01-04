import Image from "next/image"
import type { Metadata } from "next"

// 1. Add Metadata
export const metadata: Metadata = {
  title: "About ARCH-IV | Global 3D Architectural Archive",
  description: "Explore ARCH-IV, a digital archive preserving contemporary and historical 3D architectural models for architects, students, and enthusiasts.",
  openGraph: {
    title: "About ARCH-IV",
    description: "Preserving and showcasing 3D architectural models from around the world.",
    // images: ['/your-og-image.jpg'], // Optional: Add an OG image
  },
}

export default function AboutPage() {
  return (
      // 2. Use <main> for semantic structure
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">About ARCH-IV</h1>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <div className="flex justify-center">
                <Image
                  src="https://assets.archiv.tech/archiv_violet.png"
                  // 3. SEO-friendly Alt Text
                  alt="ARCH-IV logo representing digital architectural preservation"
                  width={500}
                  height={300}
                  priority // Optional: Loads faster as it's above the fold
                />
              </div>
              
              <p>
                ARCH-IV is a comprehensive digital archive dedicated to preserving and showcasing 3D architectural
                models from around the world. Our mission is to create an accessible platform where architects,
                students, and design enthusiasts can explore, study, and draw inspiration from contemporary and
                historical architectural works.
              </p>

              <p>
                Founded with the belief that architecture should be accessible to all, ARCH-IV serves as a bridge
                between professional practice and public understanding. Each model in our collection is carefully
                curated and documented to provide valuable insights into design processes, construction techniques, and
                architectural innovation.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Collection</h2>
              <p>
                Our archive features a diverse range of architectural projects, from residential buildings to
                large-scale commercial developments, cultural institutions, and experimental structures. Each entry
                includes detailed metadata, contributor information, and technical specifications to support both
                academic research and professional reference.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">For Architects & Students</h2>
              <p>
                Whether you're a practicing architect seeking reference materials, a student exploring design
                precedents, or simply someone passionate about the built environment, ARCH-IV provides the tools and
                resources to deepen your understanding of architectural design and construction.
              </p>
            </div>
          </div>
        </div>
      </main>
  )
}