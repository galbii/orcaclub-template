'use client'

import { useState, useCallback, useEffect } from 'react'

// Explicit color constants to avoid Payload theme conflicts
const colors = {
  white: '#ffffff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  indigo600: '#4f46e5',
}

interface MediaUploadMetadataFormProps {
  file: File
  onUpload: (metadata: MediaMetadata) => void
  onCancel: () => void
}

export interface MediaMetadata {
  alt: string
  caption?: string
  description?: string
  mediaType: 'image' | 'video' | 'audio' | 'document'
  tags?: string[]
  featured?: boolean
  videoMeta?: {
    duration?: number
    autoplay?: boolean
    muted?: boolean
  }
  seoMeta?: {
    focusKeywords?: string
    photographerCredit?: string
    copyrightInfo?: string
    originalSource?: string
  }
}

/**
 * Form for editing media metadata before upload
 */
export function MediaUploadMetadataForm({ file, onUpload, onCancel }: MediaUploadMetadataFormProps) {
  // Generate smart default alt text from filename
  const defaultAlt = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  // Detect media type from file
  const detectMediaType = (): 'image' | 'video' | 'audio' | 'document' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'document'
  }

  // Form state
  const [alt, setAlt] = useState(defaultAlt)
  const [caption, setCaption] = useState('')
  const [description, setDescription] = useState('')
  const [mediaType, setMediaType] = useState(detectMediaType())
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [featured, setFeatured] = useState(false)

  // Video metadata state
  const [videoDuration, setVideoDuration] = useState<number | undefined>()
  const [videoAutoplay, setVideoAutoplay] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)

  // SEO metadata state
  const [seoKeywords, setSeoKeywords] = useState('')
  const [seoPhotographer, setSeoPhotographer] = useState('')
  const [seoCopyright, setSeoCopyright] = useState('')
  const [seoSource, setSeoSource] = useState('')

  // Preview URL
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    return undefined
  }, [file])

  // Handle tag add
  const addTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }, [tagInput, tags])

  // Handle tag remove
  const removeTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }, [tags])

  // Handle upload
  const handleUpload = useCallback(() => {
    const metadata: MediaMetadata = {
      alt,
      mediaType,
      featured,
    }

    if (caption) metadata.caption = caption
    if (description) metadata.description = description
    if (tags.length > 0) metadata.tags = tags

    // Add video metadata if mediaType is video
    if (mediaType === 'video') {
      const videoMeta: NonNullable<MediaMetadata['videoMeta']> = {
        autoplay: videoAutoplay,
        muted: videoMuted,
      }
      if (videoDuration !== undefined) {
        videoMeta.duration = videoDuration
      }
      metadata.videoMeta = videoMeta
    }

    // Add SEO metadata if any field is filled
    if (seoKeywords || seoPhotographer || seoCopyright || seoSource) {
      const seoMeta: NonNullable<MediaMetadata['seoMeta']> = {}
      if (seoKeywords) seoMeta.focusKeywords = seoKeywords
      if (seoPhotographer) seoMeta.photographerCredit = seoPhotographer
      if (seoCopyright) seoMeta.copyrightInfo = seoCopyright
      if (seoSource) seoMeta.originalSource = seoSource
      metadata.seoMeta = seoMeta
    }

    onUpload(metadata)
  }, [alt, caption, description, mediaType, tags, featured, videoDuration, videoAutoplay, videoMuted, seoKeywords, seoPhotographer, seoCopyright, seoSource, onUpload])

  return (
    <div
      className="fixed inset-0 z-[10003] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: colors.white }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-6 py-4 border-b"
          style={{
            borderColor: colors.slate100,
            background: `linear-gradient(to right, ${colors.slate50}, ${colors.white})`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: colors.slate900 }}>
                Add Media Details
              </h3>
              <p className="text-sm mt-0.5 truncate max-w-sm" style={{ color: colors.slate500 }}>
                {file.name}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg transition-colors"
              style={{ color: colors.slate400 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Preview */}
          {previewUrl && (
            <div
              className="aspect-video rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.slate100 }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Alt Text (required) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
              Alt Text <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe what this image shows..."
              className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: colors.slate50,
                borderColor: colors.slate200,
                color: colors.slate900,
              }}
            />
            <p className="text-xs mt-1.5" style={{ color: colors.slate400 }}>
              Required for accessibility and SEO
            </p>
          </div>

          {/* Caption (Title) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
              Caption / Title
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional display title..."
              className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: colors.slate50,
                borderColor: colors.slate200,
                color: colors.slate900,
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description..."
              rows={2}
              className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none"
              style={{
                backgroundColor: colors.slate50,
                borderColor: colors.slate200,
                color: colors.slate900,
              }}
            />
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
              Media Type
            </label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as any)}
              className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: colors.slate50,
                borderColor: colors.slate200,
                color: colors.slate900,
              }}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: colors.slate50,
                  borderColor: colors.slate200,
                  color: colors.slate900,
                }}
              />
              <button
                onClick={addTag}
                disabled={!tagInput.trim()}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: colors.slate100, color: colors.slate700 }}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg"
                    style={{ backgroundColor: colors.blue50, color: colors.blue600 }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="p-0.5 rounded hover:bg-blue-100"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Featured */}
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium" style={{ color: colors.slate700 }}>
                Featured
              </label>
              <p className="text-xs mt-0.5" style={{ color: colors.slate400 }}>
                Mark as featured media
              </p>
            </div>
            <button
              onClick={() => setFeatured(!featured)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ backgroundColor: featured ? colors.blue500 : colors.slate200 }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
                style={{
                  backgroundColor: colors.white,
                  transform: featured ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>

          {/* Video Settings (conditional) */}
          {mediaType === 'video' && (
            <details className="group">
              <summary
                className="cursor-pointer px-4 py-3 rounded-lg font-medium text-sm"
                style={{ backgroundColor: colors.blue50, color: colors.slate900 }}
              >
                Video Settings (Optional)
              </summary>
              <div className="mt-3 space-y-4 px-4">
                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={videoDuration || ''}
                    onChange={(e) => setVideoDuration(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Video duration"
                    className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      backgroundColor: colors.white,
                      borderColor: colors.slate200,
                      color: colors.slate900,
                    }}
                  />
                </div>

                {/* Autoplay & Muted */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={videoAutoplay}
                      onChange={(e) => setVideoAutoplay(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: colors.slate700 }}>Autoplay</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={videoMuted}
                      onChange={(e) => setVideoMuted(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: colors.slate700 }}>Start Muted</span>
                  </label>
                </div>
              </div>
            </details>
          )}

          {/* SEO Settings */}
          <details className="group">
            <summary
              className="cursor-pointer px-4 py-3 rounded-lg font-medium text-sm"
              style={{ backgroundColor: colors.slate50, color: colors.slate900 }}
            >
              SEO & Attribution (Optional)
            </summary>
            <div className="mt-3 space-y-4 px-4">
              {/* Focus Keywords */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
                  Focus Keywords
                </label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="e.g., grand-piano, kawai"
                  className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: colors.white,
                    borderColor: colors.slate200,
                    color: colors.slate900,
                  }}
                />
              </div>

              {/* Photographer */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
                  Photographer Credit
                </label>
                <input
                  type="text"
                  value={seoPhotographer}
                  onChange={(e) => setSeoPhotographer(e.target.value)}
                  placeholder="Photo credit"
                  className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: colors.white,
                    borderColor: colors.slate200,
                    color: colors.slate900,
                  }}
                />
              </div>

              {/* Copyright */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
                  Copyright Info
                </label>
                <input
                  type="text"
                  value={seoCopyright}
                  onChange={(e) => setSeoCopyright(e.target.value)}
                  placeholder="Copyright or licensing"
                  className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: colors.white,
                    borderColor: colors.slate200,
                    color: colors.slate900,
                  }}
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.slate700 }}>
                  Original Source
                </label>
                <input
                  type="text"
                  value={seoSource}
                  onChange={(e) => setSeoSource(e.target.value)}
                  placeholder="Source URL"
                  className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: colors.white,
                    borderColor: colors.slate200,
                    color: colors.slate900,
                  }}
                />
              </div>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 py-4 border-t flex items-center justify-between gap-3"
          style={{ backgroundColor: colors.white, borderColor: colors.slate200 }}
        >
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: colors.slate600 }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!alt.trim()}
            className="px-8 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            style={{
              color: colors.white,
              background: `linear-gradient(to right, ${colors.indigo600}, ${colors.blue600})`,
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Media
          </button>
        </div>
      </div>
    </div>
  )
}
