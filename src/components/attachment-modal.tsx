"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { X, ZoomIn, ZoomOut, RefreshCw } from "lucide-react"

interface AttachmentModalProps {
  attachment: { file_url: string; title: string } | null
  onClose: () => void
}

export default function AttachmentModal({ attachment, onClose }: AttachmentModalProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  if (!attachment) return null

  // --- HANDLERS ---

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 4))
  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1)
      if (newScale === 1) setPosition({ x: 0, y: 0 }) // Reset posisi jika zoom out full
      return newScale
    })
  }
  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Zoom dengan Scroll Mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    if (e.deltaY < 0) handleZoomIn()
    else handleZoomOut()
  }

  // Geser Gambar (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) { // Hanya bisa geser jika sedang di-zoom
      e.preventDefault()
      setIsDragging(true)
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault()
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 overflow-hidden"
      onClick={onClose}
    >
      {/* Container Gambar (Relative untuk posisi absolut tombol) */}
      <div 
        className="relative w-full h-full flex items-center justify-center" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* --- TOMBOL KONTROL (Floating) --- */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
           <button
            onClick={onClose}
            className="bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors mb-4"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex flex-col bg-gray-800/80 rounded-lg overflow-hidden backdrop-blur-sm">
            <button onClick={handleZoomIn} className="p-3 text-white hover:bg-gray-700 active:bg-gray-600" title="Zoom In">
              <ZoomIn className="h-5 w-5" />
            </button>
            <button onClick={handleZoomOut} className="p-3 text-white hover:bg-gray-700 active:bg-gray-600" title="Zoom Out">
              <ZoomOut className="h-5 w-5" />
            </button>
            <button onClick={handleReset} className="p-3 text-white hover:bg-gray-700 active:bg-gray-600 border-t border-gray-600" title="Reset View">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* --- AREA GAMBAR --- */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? "none" : "transform 0.2s ease-out", // Halus saat zoom, responsif saat geser
            }}
            className="flex items-center justify-center"
          >
            <Image
              src={attachment.file_url}
              alt={attachment.title}
              width={1200}
              height={1200}
              className="max-h-[90vh] w-auto max-w-[90vw] object-contain select-none pointer-events-none" // pointer-events-none agar tidak mengganggu drag container
              priority
              draggable={false}
            />
          </div>
        </div>
        
      </div>
    </div>
  )
}