"use client"

import { useEffect } from "react"

interface Props {
  src: string
  alt?: string
  poster?: string
  className?: string
}

export default function ModelViewer({ src, alt = "3D model", poster, className }: Props) {
  useEffect(() => {
    // Dynamically load the model-viewer web component on the client
    // so it isn't imported during SSR.
    ;(async () => {
      try {
        await import("@google/model-viewer")
      } catch (e) {
        // If the package isn't installed, the page will still render but the viewer won't work.
        // We'll surface an error in the console so devs can install the dependency.
        // eslint-disable-next-line no-console
        console.error("Failed to load @google/model-viewer:", e)
      }
    })()
  }, [])

  return (
    // Use the model-viewer custom element. TypeScript type is declared in src/types/model-viewer.d.ts
    // Attributes: camera-controls enables orbit, auto-rotate for subtle motion, poster for thumbnail
    <model-viewer
      src={src}
      alt={alt}
      poster={poster}
      camera-controls
      auto-rotate
      exposure="1"
      loading="eager"
      className={className}
      style={{ width: "100%", height: "100%", background: "#f3f4f6" }}
    />
  )
}
