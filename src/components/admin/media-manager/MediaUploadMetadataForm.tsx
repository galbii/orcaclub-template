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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '1rem 1.5rem',
            borderBottom: `1px solid ${colors.slate100}`,
            background: `linear-gradient(to right, ${colors.slate50}, ${colors.white})`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: colors.slate900 }}>
                Add Media Details
              </h3>
              <p style={{ fontSize: '0.875rem', marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '20rem', color: colors.slate500 }}>
                {file.name}
              </p>
            </div>
            <button
              onClick={onCancel}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease',
                color: colors.slate400,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Preview */}
            {previewUrl && (
              <div
                style={{
                  aspectRatio: '16 / 9',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  backgroundColor: colors.slate100,
                }}
              >
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Alt Text (required) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                Alt Text <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe what this image shows..."
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  border: `1px solid ${colors.slate200}`,
                  borderRadius: '0.5rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: colors.slate50,
                  color: colors.slate900,
                }}
              />
              <p style={{ fontSize: '0.75rem', marginTop: '0.375rem', color: colors.slate400 }}>
                Required for accessibility and SEO
              </p>
            </div>

            {/* Caption (Title) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                Caption / Title
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Optional display title..."
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  border: `1px solid ${colors.slate200}`,
                  borderRadius: '0.5rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: colors.slate50,
                  color: colors.slate900,
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  border: `1px solid ${colors.slate200}`,
                  borderRadius: '0.5rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  resize: 'none',
                  backgroundColor: colors.slate50,
                  color: colors.slate900,
                }}
              />
            </div>

            {/* Media Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                Media Type
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  border: `1px solid ${colors.slate200}`,
                  borderRadius: '0.5rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: colors.slate50,
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                Tags
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    border: `1px solid ${colors.slate200}`,
                    borderRadius: '0.5rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: colors.slate50,
                    color: colors.slate900,
                  }}
                />
                <button
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    transition: 'all 0.2s ease',
                    opacity: !tagInput.trim() ? 0.5 : 1,
                    cursor: !tagInput.trim() ? 'not-allowed' : 'pointer',
                    backgroundColor: colors.slate100,
                    color: colors.slate700,
                    border: 'none',
                  }}
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: colors.blue50,
                        color: colors.blue600,
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        style={{
                          padding: '0.125rem',
                          borderRadius: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <svg style={{ width: '0.75rem', height: '0.75rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Featured */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.slate700 }}>
                  Featured
                </label>
                <p style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: colors.slate400 }}>
                  Mark as featured media
                </p>
              </div>
              <button
                onClick={() => setFeatured(!featured)}
                style={{
                  position: 'relative',
                  width: '2.75rem',
                  height: '1.5rem',
                  borderRadius: '9999px',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: featured ? colors.blue500 : colors.slate200,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '0.125rem',
                    left: '0.125rem',
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: '9999px',
                    transition: 'transform 0.2s ease',
                    backgroundColor: colors.white,
                    transform: featured ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </button>
            </div>

            {/* Video Settings (conditional) */}
            {mediaType === 'video' && (
              <details>
                <summary
                  style={{
                    cursor: 'pointer',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    backgroundColor: colors.blue50,
                    color: colors.slate900,
                  }}
                >
                  Video Settings (Optional)
                </summary>
                <div style={{ marginTop: '0.75rem', padding: '0 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Duration */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={videoDuration || ''}
                        onChange={(e) => setVideoDuration(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Video duration"
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          border: `1px solid ${colors.slate200}`,
                          borderRadius: '0.5rem',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          backgroundColor: colors.white,
                          color: colors.slate900,
                        }}
                      />
                    </div>

                    {/* Autoplay & Muted */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={videoAutoplay}
                          onChange={(e) => setVideoAutoplay(e.target.checked)}
                          style={{ width: '1rem', height: '1rem', borderRadius: '0.25rem' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: colors.slate700 }}>Autoplay</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={videoMuted}
                          onChange={(e) => setVideoMuted(e.target.checked)}
                          style={{ width: '1rem', height: '1rem', borderRadius: '0.25rem' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: colors.slate700 }}>Start Muted</span>
                      </label>
                    </div>
                  </div>
                </div>
              </details>
            )}

            {/* SEO Settings */}
            <details>
              <summary
                style={{
                  cursor: 'pointer',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  backgroundColor: colors.slate50,
                  color: colors.slate900,
                }}
              >
                SEO & Attribution (Optional)
              </summary>
              <div style={{ marginTop: '0.75rem', padding: '0 1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Focus Keywords */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                      Focus Keywords
                    </label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      placeholder="e.g., grand-piano, kawai"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        border: `1px solid ${colors.slate200}`,
                        borderRadius: '0.5rem',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        backgroundColor: colors.white,
                        color: colors.slate900,
                      }}
                    />
                  </div>

                  {/* Photographer */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                      Photographer Credit
                    </label>
                    <input
                      type="text"
                      value={seoPhotographer}
                      onChange={(e) => setSeoPhotographer(e.target.value)}
                      placeholder="Photo credit"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        border: `1px solid ${colors.slate200}`,
                        borderRadius: '0.5rem',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        backgroundColor: colors.white,
                        color: colors.slate900,
                      }}
                    />
                  </div>

                  {/* Copyright */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                      Copyright Info
                    </label>
                    <input
                      type="text"
                      value={seoCopyright}
                      onChange={(e) => setSeoCopyright(e.target.value)}
                      placeholder="Copyright or licensing"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        border: `1px solid ${colors.slate200}`,
                        borderRadius: '0.5rem',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        backgroundColor: colors.white,
                        color: colors.slate900,
                      }}
                    />
                  </div>

                  {/* Source */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.slate700 }}>
                      Original Source
                    </label>
                    <input
                      type="text"
                      value={seoSource}
                      onChange={(e) => setSeoSource(e.target.value)}
                      placeholder="Source URL"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        border: `1px solid ${colors.slate200}`,
                        borderRadius: '0.5rem',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        backgroundColor: colors.white,
                        color: colors.slate900,
                      }}
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            padding: '1rem 1.5rem',
            borderTop: `1px solid ${colors.slate200}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            backgroundColor: colors.white,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.75rem',
              transition: 'all 0.2s ease',
              color: colors.slate600,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!alt.trim()}
            style={{
              padding: '0.625rem 2rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '0.75rem',
              transition: 'all 0.2s ease',
              opacity: !alt.trim() ? 0.5 : 1,
              cursor: !alt.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              color: colors.white,
              background: `linear-gradient(to right, ${colors.indigo600}, ${colors.blue600})`,
              border: 'none',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Media
          </button>
        </div>
      </div>
    </div>
  )
}
