"use client"

import type React from "react";
import Image from "next/image";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Attachment {
  id: string
  title: string
  type: string
  category: string
  file_url: string
  thumbnail_url: string
  file_size: string
  file_format: string
  uploaded_at: string
  description: string
}

interface AttachmentModalProps {
  attachment: Attachment | null
  attachments: Attachment[]
  onClose: () => void
  onNavigate: (attachment: Attachment) => void
}

export default function AttachmentModal({ attachment, attachments, onClose, onNavigate }: AttachmentModalProps) {
  if (!attachment) return null

  const currentIndex = attachments.findIndex((att) => att.id === attachment.id)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < attachments.length - 1

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(attachments[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onNavigate(attachments[currentIndex + 1])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose()
    if (e.key === "ArrowLeft" && hasPrevious) handlePrevious()
    if (e.key === "ArrowRight" && hasNext) handleNext()
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{attachment.title}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <Badge variant="secondary">{attachment.file_format}</Badge>
              <span>{attachment.file_size}</span>
              <span>{attachment.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={attachment.file_url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          {/* Navigation Arrows */}
          {hasPrevious && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {hasNext && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}

          {/* Image */}
          <div className="flex items-center justify-center bg-gray-100 min-h-[400px] max-h-[60vh]">
            <Image
              src={attachment.file_url || "/placeholder.svg"}
              alt={attachment.title}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-700 mb-2">{attachment.description}</p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Uploaded on{" "}
              {new Date(attachment.uploaded_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>
              {currentIndex + 1} of {attachments.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
