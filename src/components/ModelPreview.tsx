"use client"

import ModelViewer from "./ModelViewer"

interface Props {
  src: string
  poster?: string
  className?: string
}

export default function ModelPreview({ src, poster, className }: Props) {
  // Small, lightweight preview using the same model-viewer element
  return (
    <div className={`w-full h-full ${className || ""}`}>
      <ModelViewer src={src} poster={poster} className="w-full h-full" />
    </div>
  )
}
