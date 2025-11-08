"use client"

import { useEffect, useRef } from "react"

interface Props {
  src: string
  alt?: string
  poster?: string
  className?: string
}

export default function ModelViewer({ src, alt = "3D model", poster, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let el: HTMLElement | null = null

    const setup = async () => {
      try {
        await import("@google/model-viewer")
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load @google/model-viewer:", e)
        return
      }

      if (!ref.current) return

      el = document.createElement("model-viewer")
      if (src) el.setAttribute("src", src)
      if (alt) el.setAttribute("alt", alt)
      if (poster) el.setAttribute("poster", poster)
      el.setAttribute("camera-controls", "")
      el.setAttribute("auto-rotate", "")
      el.setAttribute("exposure", "1")
      el.setAttribute("loading", "eager")
      if (className) el.className = className
      el.style.width = "100%"
      el.style.height = "100%"
      el.style.background = "#f3f4f6"

      ref.current.appendChild(el)
    }

    setup()

    return () => {
      if (el && ref.current) ref.current.removeChild(el)
      el = null
    }
  }, [src, alt, poster, className])

  return <div ref={ref} className={className} />
}
