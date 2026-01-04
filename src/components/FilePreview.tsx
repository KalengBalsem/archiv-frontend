import { useEffect, useState, memo } from "react"
import { Trash2, Loader2 } from "lucide-react"

// Optimized component to prevent re-renders and memory leaks
export const FilePreview = memo(({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    const generateThumbnail = async () => {
      try {
        // Create a bitmap (fast, off-main-thread decoding)
        const imageBitmap = await createImageBitmap(file)
        
        // Scale down to 300px width for the thumbnail
        const scale = 300 / imageBitmap.width
        const canvas = document.createElement('canvas')
        canvas.width = 300
        canvas.height = imageBitmap.height * scale
        
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error("No context")
        
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          if (!active || !blob) return
          objectUrl = URL.createObjectURL(blob)
          setPreviewUrl(objectUrl)
          setLoading(false)
        }, 'image/jpeg', 0.7)

      } catch (err) {
        // Fallback for non-image files or errors
        objectUrl = URL.createObjectURL(file)
        if (active) {
            setPreviewUrl(objectUrl)
            setLoading(false)
        }
      }
    }

    // Only run for images. For PDFs/GLBs, we might just show an icon (omitted for brevity)
    if (file.type.startsWith('image/')) {
        generateThumbnail()
    } else {
        setLoading(false) // Just show a placeholder or standard blob
    }

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return (
    <div className="relative aspect-square bg-gray-100 rounded border overflow-hidden group">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400"/>
        </div>
      ) : (
        <img 
          src={previewUrl} 
          className="w-full h-full object-cover opacity-80" 
          alt="preview"
          decoding="async"
          loading="lazy"
        />
      )}
      <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={onRemove} className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm">
          <Trash2 className="w-3 h-3"/>
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate backdrop-blur-sm">
        {file.name}
      </div>
    </div>
  )
})
FilePreview.displayName = "FilePreview"