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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.backdrop,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '32rem',
          height: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.sidebarBg,
          borderLeft: `1px solid ${colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.headerBg,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: colors.textPrimary }}>
              Edit Media
            </h2>
            <p style={{ fontSize: '0.875rem', marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '20rem', color: colors.textSecondary }}>
              {media.filename}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s ease',
              color: colors.textMuted,
              backgroundColor: colors.cardBg,
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.hoverBg
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.cardBg
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Preview */}
          {media.mimeType?.startsWith('image/') && (
            <div
              style={{
                aspectRatio: '16 / 9',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
              }}
            >
              <img
                src={media.sizes?.card?.url || media.publicUrl || media.url}
                alt={media.alt}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Alt Text (required) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
              Alt Text <span style={{ color: colors.error }}>*</span>
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe what this image shows..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: `1px solid ${colors.border}`,
                borderRadius: '0.75rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: colors.inputBg,
                color: colors.textPrimary,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.borderFocus
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <p style={{ fontSize: '0.75rem', marginTop: '0.375rem', color: colors.textMuted }}>
              Required for accessibility and SEO
            </p>
          </div>

          {/* Caption */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption for display..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: `1px solid ${colors.border}`,
                borderRadius: '0.75rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: colors.inputBg,
                color: colors.textPrimary,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.borderFocus
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description for administrative purposes..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: `1px solid ${colors.border}`,
                borderRadius: '0.75rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                resize: 'none',
                backgroundColor: colors.inputBg,
                color: colors.textPrimary,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.borderFocus
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Media Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
              Media Type
            </label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: `1px solid ${colors.border}`,
                borderRadius: '0.75rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                appearance: 'none',
                backgroundColor: colors.inputBg,
                color: colors.textPrimary,
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.borderFocus
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.boxShadow = 'none'
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
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
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
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.75rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: colors.inputBg,
                  color: colors.textPrimary,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
              />
              <button
                onClick={addTag}
                disabled={!tagInput.trim()}
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '0.75rem',
                  transition: 'opacity 0.2s ease',
                  opacity: !tagInput.trim() ? 0.5 : 1,
                  cursor: !tagInput.trim() ? 'not-allowed' : 'pointer',
                  backgroundColor: colors.cardBg,
                  color: colors.textSecondary,
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  if (tagInput.trim()) e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  if (tagInput.trim()) e.currentTarget.style.opacity = '1'
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
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.875rem',
                      borderRadius: '0.5rem',
                      backgroundColor: colors.hoverBg,
                      color: colors.primaryLight,
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        padding: '0.125rem',
                        borderRadius: '0.25rem',
                        transition: 'color 0.2s ease',
                        color: colors.textMuted,
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = colors.error}
                      onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
                    >
                      <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Featured */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.textPrimary }}>
                Featured
              </label>
              <p style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: colors.textMuted }}>
                Mark as featured media for easy access
              </p>
            </div>
            <button
              onClick={() => setFeatured(!featured)}
              style={{
                position: 'relative',
                width: '3rem',
                height: '1.75rem',
                borderRadius: '9999px',
                transition: 'background-color 0.2s ease',
                backgroundColor: featured ? colors.primary : colors.border,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '0.25rem',
                  left: '0.25rem',
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

          {/* Video Metadata (conditional) */}
          {mediaType === 'video' && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
              }}
            >
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: colors.textPrimary }}>
                Video Settings
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Duration */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={videoDuration || ''}
                    onChange={(e) => setVideoDuration(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Video duration in seconds"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      fontSize: '1rem',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.75rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                    onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                  />
                </div>

                {/* Autoplay */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.textPrimary }}>
                      Autoplay
                    </label>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: colors.textMuted }}>
                      Video will start playing automatically
                    </p>
                  </div>
                  <button
                    onClick={() => setVideoAutoplay(!videoAutoplay)}
                    style={{
                      position: 'relative',
                      width: '3rem',
                      height: '1.75rem',
                      borderRadius: '9999px',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: videoAutoplay ? colors.primary : colors.border,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '0.25rem',
                        left: '0.25rem',
                        width: '1.25rem',
                        height: '1.25rem',
                        borderRadius: '9999px',
                        transition: 'transform 0.2s ease',
                        backgroundColor: colors.white,
                        transform: videoAutoplay ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </button>
                </div>

                {/* Muted */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.textPrimary }}>
                      Start Muted
                    </label>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: colors.textMuted }}>
                      Recommended for autoplay videos
                    </p>
                  </div>
                  <button
                    onClick={() => setVideoMuted(!videoMuted)}
                    style={{
                      position: 'relative',
                      width: '3rem',
                      height: '1.75rem',
                      borderRadius: '9999px',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: videoMuted ? colors.primary : colors.border,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '0.25rem',
                        left: '0.25rem',
                        width: '1.25rem',
                        height: '1.25rem',
                        borderRadius: '9999px',
                        transition: 'transform 0.2s ease',
                        backgroundColor: colors.white,
                        transform: videoMuted ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEO Metadata */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.cardBg,
            }}
          >
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: colors.textPrimary }}>
              SEO & Attribution
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Focus Keywords */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
                  Focus Keywords
                </label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="e.g., grand-piano, kawai, black-finish"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '0.75rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                />
                <p style={{ fontSize: '0.75rem', marginTop: '0.375rem', color: colors.textMuted }}>
                  Comma-separated keywords for SEO
                </p>
              </div>

              {/* Photographer Credit */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
                  Photographer Credit
                </label>
                <input
                  type="text"
                  value={seoPhotographer}
                  onChange={(e) => setSeoPhotographer(e.target.value)}
                  placeholder="Photo credit"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '0.75rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                />
              </div>

              {/* Copyright Info */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
                  Copyright Information
                </label>
                <input
                  type="text"
                  value={seoCopyright}
                  onChange={(e) => setSeoCopyright(e.target.value)}
                  placeholder="Copyright or licensing info"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '0.75rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                />
              </div>

              {/* Original Source */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: colors.textPrimary }}>
                  Original Source
                </label>
                <input
                  type="text"
                  value={seoSource}
                  onChange={(e) => setSeoSource(e.target.value)}
                  placeholder="Original source URL"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '0.75rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                />
              </div>
            </div>
          </div>

          {/* File Info */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.cardBg,
            }}
          >
            <h4 style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem', color: colors.textPrimary }}>
              File Information
            </h4>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              {media.width && media.height && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <dt style={{ color: colors.textMuted }}>Dimensions</dt>
                  <dd style={{ color: colors.textSecondary, margin: 0 }}>{media.width} × {media.height}px</dd>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <dt style={{ color: colors.textMuted }}>File Size</dt>
                <dd style={{ color: colors.textSecondary, margin: 0 }}>{formatFileSize(media.filesize)}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <dt style={{ color: colors.textMuted }}>Type</dt>
                <dd style={{ color: colors.textSecondary, margin: 0 }}>{media.mimeType}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <dt style={{ color: colors.textMuted }}>Created</dt>
                <dd style={{ color: colors.textSecondary, margin: 0 }}>{formatDate(media.createdAt)}</dd>
              </div>
            </dl>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            padding: '1rem 1.5rem',
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.headerBg,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.75rem',
              transition: 'all 0.2s ease',
              color: colors.textSecondary,
              backgroundColor: colors.cardBg,
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || !alt.trim() || isSaving}
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '0.75rem',
              transition: 'all 0.2s ease',
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              cursor: (!hasChanges || !alt.trim() || isSaving) ? 'not-allowed' : 'pointer',
              opacity: (!hasChanges || !alt.trim() || isSaving) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (hasChanges && alt.trim() && !isSaving) {
                e.currentTarget.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              if (hasChanges && alt.trim() && !isSaving) {
                e.currentTarget.style.opacity = '1'
              }
            }}
          >
            {isSaving ? (
              <>
                <div
                  style={{
                    animation: 'spin 1s linear infinite',
                    borderRadius: '9999px',
                    height: '1rem',
                    width: '1rem',
                    border: `2px solid ${colors.white}`,
                    borderTopColor: 'transparent',
                  }}
                />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
      {/* Keyframes for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
