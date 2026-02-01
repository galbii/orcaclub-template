'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMediaManager } from './MediaManagerProvider'
import type { MediaItem } from './types'

// Dark theme color palette matching MediaGrid, Modal, and FolderTree
const colors = {
  // Backgrounds
  backdrop: 'rgba(0, 0, 0, 0.85)',
  modalBg: '#0a0e1a',
  headerBg: '#0f1422',
  sidebarBg: '#0d1117',
  contentBg: '#0a0e1a',
  cardBg: '#151b2b',
  inputBg: '#1a2234',
  hoverBg: '#1e2739',

  // Borders
  border: '#1e2739',
  borderLight: '#2d3748',
  borderFocus: '#3b82f6',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textAccent: '#60a5fa',

  // Brand colors
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: '#60a5fa',
  success: '#10b981',
  successBg: '#064e3b',
  error: '#ef4444',
  errorBg: '#7f1d1d',
  warning: '#f59e0b',
  warningBg: '#78350f',

  // Accents
  accent: '#8b5cf6',
  accentHover: '#7c3aed',
  gold: '#f59e0b',

  // UI elements
  white: '#ffffff',
  black: '#000000',
}

interface MediaEditPanelProps {
  media: MediaItem
  onClose: () => void
}

/**
 * Side panel for editing media metadata
 */
export function MediaEditPanel({ media, onClose }: MediaEditPanelProps) {
  const { updateMedia } = useMediaManager()

  // Form state
  const [alt, setAlt] = useState(media.alt || '')
  const [caption, setCaption] = useState(media.caption || '')
  const [description, setDescription] = useState(media.description || '')
  const [mediaType, setMediaType] = useState(media.mediaType || 'image')
  const [tags, setTags] = useState<string[]>(media.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [featured, setFeatured] = useState(media.featured || false)

  // Video metadata state
  const [videoDuration, setVideoDuration] = useState<number | undefined>(media.videoMeta?.duration)
  const [videoAutoplay, setVideoAutoplay] = useState<boolean>(media.videoMeta?.autoplay || false)
  const [videoMuted, setVideoMuted] = useState<boolean>(media.videoMeta?.muted ?? true)

  // SEO metadata state
  const [seoKeywords, setSeoKeywords] = useState(media.seoMeta?.focusKeywords || '')
  const [seoPhotographer, setSeoPhotographer] = useState(media.seoMeta?.photographerCredit || '')
  const [seoCopyright, setSeoCopyright] = useState(media.seoMeta?.copyrightInfo || '')
  const [seoSource, setSeoSource] = useState(media.seoMeta?.originalSource || '')

  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  useEffect(() => {
    const changed =
      alt !== (media.alt || '') ||
      caption !== (media.caption || '') ||
      description !== (media.description || '') ||
      mediaType !== (media.mediaType || 'image') ||
      featured !== (media.featured || false) ||
      JSON.stringify(tags) !== JSON.stringify(media.tags || []) ||
      // Video metadata changes
      videoDuration !== media.videoMeta?.duration ||
      videoAutoplay !== (media.videoMeta?.autoplay || false) ||
      videoMuted !== (media.videoMeta?.muted || true) ||
      // SEO metadata changes
      seoKeywords !== (media.seoMeta?.focusKeywords || '') ||
      seoPhotographer !== (media.seoMeta?.photographerCredit || '') ||
      seoCopyright !== (media.seoMeta?.copyrightInfo || '') ||
      seoSource !== (media.seoMeta?.originalSource || '')
    setHasChanges(changed)
  }, [alt, caption, description, mediaType, tags, featured, videoDuration, videoAutoplay, videoMuted, seoKeywords, seoPhotographer, seoCopyright, seoSource, media])

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

  // Handle save
  const handleSave = useCallback(async () => {
    if (!hasChanges) return

    setIsSaving(true)
    try {
      // Build update data object
      const updateData: Record<string, unknown> = {
        alt,
        mediaType,
        featured,
      }
      if (caption) updateData.caption = caption
      if (description) updateData.description = description
      if (tags.length > 0) updateData.tags = tags

      // Add video metadata if mediaType is video
      if (mediaType === 'video') {
        updateData.videoMeta = {
          duration: videoDuration,
          autoplay: videoAutoplay,
          muted: videoMuted,
        }
      }

      // Add SEO metadata if any field is filled
      if (seoKeywords || seoPhotographer || seoCopyright || seoSource) {
        updateData.seoMeta = {
          focusKeywords: seoKeywords || undefined,
          photographerCredit: seoPhotographer || undefined,
          copyrightInfo: seoCopyright || undefined,
          originalSource: seoSource || undefined,
        }
      }

      await updateMedia(media.id, updateData)
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }, [hasChanges, updateMedia, media.id, alt, caption, description, mediaType, tags, featured, videoDuration, videoAutoplay, videoMuted, seoKeywords, seoPhotographer, seoCopyright, seoSource, onClose])

  return (
    <div
      className="fixed inset-0 z-[10002] flex justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: colors.backdrop }}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l"
        style={{ backgroundColor: colors.sidebarBg, borderColor: colors.border }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-6 py-5 border-b flex items-center justify-between"
          style={{ borderColor: colors.border, backgroundColor: colors.headerBg }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              Edit Media
            </h2>
            <p className="text-sm mt-0.5 truncate max-w-xs" style={{ color: colors.textSecondary }}>
              {media.filename}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
            style={{ color: colors.textMuted, backgroundColor: colors.cardBg }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preview */}
          {media.mimeType?.startsWith('image/') && (
            <div
              className="aspect-video rounded-xl overflow-hidden border"
              style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
              <img
                src={media.sizes?.card?.url || media.publicUrl || media.url}
                alt={media.alt}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Alt Text (required) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Alt Text <span style={{ color: colors.error }}>*</span>
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe what this image shows..."
              className="w-full px-4 py-3 text-base border rounded-xl focus:outline-none transition-colors"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
            />
            <p className="text-xs mt-1.5" style={{ color: colors.textMuted }}>
              Required for accessibility and SEO
            </p>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption for display..."
              className="w-full px-4 py-3 text-base border rounded-xl focus:outline-none transition-colors"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description for administrative purposes..."
              rows={3}
              className="w-full px-4 py-3 text-base border rounded-xl focus:outline-none transition-colors resize-none"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
            />
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Media Type
            </label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as any)}
              className="w-full px-4 py-3 text-base border rounded-xl focus:outline-none transition-colors appearance-none"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
              onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
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
                className="flex-1 px-4 py-2.5 text-sm border rounded-xl focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
              />
              <button
                onClick={addTag}
                disabled={!tagInput.trim()}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 hover:bg-opacity-80"
                style={{ backgroundColor: colors.cardBg, color: colors.textSecondary }}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg"
                    style={{ backgroundColor: colors.hoverBg, color: colors.primaryLight }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="p-0.5 rounded transition-colors"
                      style={{ color: colors.textMuted }}
                      onMouseEnter={(e) => e.currentTarget.style.color = colors.error}
                      onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Featured */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                Featured
              </label>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                Mark as featured media for easy access
              </p>
            </div>
            <button
              onClick={() => setFeatured(!featured)}
              className="relative w-12 h-7 rounded-full transition-colors"
              style={{ backgroundColor: featured ? colors.primary : colors.border }}
            >
              <span
                className="absolute top-1 left-1 w-5 h-5 rounded-full transition-transform"
                style={{
                  backgroundColor: colors.white,
                  transform: featured ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>

          {/* Video Metadata (conditional) */}
          {mediaType === 'video' && (
            <div
              className="p-4 rounded-xl space-y-4 border"
              style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
              <h4 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                Video Settings
              </h4>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={videoDuration || ''}
                  onChange={(e) => setVideoDuration(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Video duration in seconds"
                  className="w-full px-4 py-3 text-base border rounded-xl focus:outline-none transition-colors"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                />
              </div>

              {/* Autoplay */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Autoplay
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                    Video will start playing automatically
                  </p>
                </div>
                <button
                  onClick={() => setVideoAutoplay(!videoAutoplay)}
                  className="relative w-12 h-7 rounded-full transition-colors"
                  style={{ backgroundColor: videoAutoplay ? colors.primary : colors.border }}
                >
                  <span
                    className="absolute top-1 left-1 w-5 h-5 rounded-full transition-transform"
                    style={{
                      backgroundColor: colors.white,
                      transform: videoAutoplay ? 'translateX(20px)' : 'translateX(0)',
                    }}
                  />
                </button>
              </div>

              {/* Muted */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Start Muted
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                    Recommended for autoplay videos
                  </p>
                </div>
                <button
                  onClick={() => setVideoMuted(!videoMuted)}
                  className="relative w-12 h-7 rounded-full transition-colors"
                  style={{ backgroundColor: videoMuted ? colors.primary : colors.border }}
                >
                  <span
                    className="absolute top-1 left-1 w-5 h-5 rounded-full transition-transform"
                    style={{
                      backgroundColor: colors.white,
                      transform: videoMuted ? 'translateX(20px)' : 'translateX(0)',
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* SEO Metadata */}
          <div
            className="p-4 rounded-xl space-y-4 border"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <h4 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              SEO & Attribution
            </h4>

            {/* Focus Keywords */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Focus Keywords
              </label>
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="e.g., grand-piano, kawai, black-finish"
                className="w-full px-4 py-3 text-base border rounded-xl focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
              />
              <p className="text-xs mt-1.5" style={{ color: colors.textMuted }}>
                Comma-separated keywords for SEO
              </p>
            </div>

            {/* Photographer Credit */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Photographer Credit
              </label>
              <input
                type="text"
                value={seoPhotographer}
                onChange={(e) => setSeoPhotographer(e.target.value)}
                placeholder="Photo credit"
                className="w-full px-4 py-3 text-base border rounded-xl focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
              />
            </div>

            {/* Copyright Info */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Copyright Information
              </label>
              <input
                type="text"
                value={seoCopyright}
                onChange={(e) => setSeoCopyright(e.target.value)}
                placeholder="Copyright or licensing info"
                className="w-full px-4 py-3 text-base border rounded-xl focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
              />
            </div>

            {/* Original Source */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Original Source
              </label>
              <input
                type="text"
                value={seoSource}
                onChange={(e) => setSeoSource(e.target.value)}
                placeholder="Original source URL"
                className="w-full px-4 py-3 text-base border rounded-xl focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
              />
            </div>
          </div>

          {/* File Info */}
          <div
            className="p-4 rounded-xl border"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <h4 className="text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
              File Information
            </h4>
            <dl className="space-y-2 text-sm">
              {media.width && media.height && (
                <div className="flex justify-between">
                  <dt style={{ color: colors.textMuted }}>Dimensions</dt>
                  <dd style={{ color: colors.textSecondary }}>{media.width} × {media.height}px</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt style={{ color: colors.textMuted }}>File Size</dt>
                <dd style={{ color: colors.textSecondary }}>{formatFileSize(media.filesize)}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: colors.textMuted }}>Type</dt>
                <dd style={{ color: colors.textSecondary }}>{media.mimeType}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: colors.textMuted }}>Created</dt>
                <dd style={{ color: colors.textSecondary }}>{formatDate(media.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 py-4 border-t flex items-center justify-between"
          style={{ backgroundColor: colors.headerBg, borderColor: colors.border }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-opacity-80"
            style={{ color: colors.textSecondary, backgroundColor: colors.cardBg }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || !alt.trim() || isSaving}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-opacity-90"
            style={{ backgroundColor: colors.primary, color: colors.white }}
          >
            {isSaving ? (
              <>
                <div
                  className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent"
                  style={{ borderColor: colors.white, borderTopColor: 'transparent' }}
                />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
