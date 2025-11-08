"use client"

import { useState, useRef, useEffect } from "react"
import ModelViewer from "./ModelViewer"

interface Props {
  src: string
  poster?: string
  className?: string
}

export default function ModelPreview({ src, poster, className }: Props) {
  // Lazy-init viewer on first hover/focus to avoid rendering many viewers in the grid
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const hoverTimeout = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current)
    }
  }, [])

  const handleEnter = () => {
    if (!mounted) setMounted(true)
    // show viewer quickly, but allow a small delay if you'd like to avoid flicker
    if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current)
    setVisible(true)
  }

  const handleLeave = () => {
    // hide viewer after small delay to avoid rapid mount/unmount on quick mouse movements
    hoverTimeout.current = window.setTimeout(() => setVisible(false), 200)
  }

  return (
    <div
      className={`relative w-full h-full ${className || ""}`}
      onMouseEnter={handleEnter}
      onFocus={handleEnter}
      onMouseLeave={handleLeave}
      onBlur={handleLeave}
      tabIndex={0}
    >
      {/* Poster image shown initially */}
      <img
        src={poster || "/placeholder.svg"}
        alt="Model preview"
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Viewer container: mounted lazily, visibility toggled on hover */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ display: visible ? "block" : "none", width: "100%", height: "100%" }}>
            {/* pointer-events-none on wrapper prevents the viewer from capturing hover events that would
                interfere with leave events on the card; we could enable pointer events if interaction
                is desired in the preview. */}
            <div className="w-full h-full pointer-events-auto">
              <ModelViewer src={src} poster={poster} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
