'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@payloadcms/ui'
import { MediaGrid } from './MediaGrid'
import { DropzoneUploader } from './DropzoneUploader'
import { ImageCropper, getCroppedImg } from './ImageCropper'
import type { Area } from 'react-easy-crop'
import type { Media } from '@/payload-types'

export type { Media }

type TabType = 'browse' | 'upload' | 'crop'

/**
 * Get the best available image URL for a media item
 * Supports both S3/cloud storage and local storage
 * For cropping, prefer larger sizes; for thumbnails, prefer smaller sizes
 */
function getMediaUrl(media: Media, preferLarge = false): string | null {
  if (preferLarge) {
    // For cropping, prefer the largest available size or original
    return (
      media.url ||
      media.sizes?.desktop?.url ||
      media.sizes?.tablet?.url ||
      media.sizes?.card?.url ||
      media.thumbnailURL ||
      null
    )
  }
  // For thumbnails, prefer smaller sizes
  return (
    media.thumbnailURL ||
    media.sizes?.thumbnail?.url ||
    media.sizes?.card?.url ||
    media.url ||
    null
  )
}

interface MediaLibraryProps {
  /** Callback when media is selected */
  onSelect?: (media: Media) => void
  /** Whether to allow cropping */
  allowCrop?: boolean
  /** Button label */
  buttonLabel?: string
  /** Button style */
  buttonStyle?: 'primary' | 'secondary' | 'none'
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelect,
  allowCrop = true,
  buttonLabel = 'Media Library',
  buttonStyle = 'secondary',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('browse')
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [mediaForCrop, setMediaForCrop] = useState<Media | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleMediaSelect = useCallback((media: Media) => {
    setSelectedMedia(media)
  }, [])

  const handleUploadComplete = useCallback((uploadedMedia: Media[]) => {
    // After upload, switch to browse tab to see new media
    if (uploadedMedia.length > 0) {
      setActiveTab('browse')
      // Select the first uploaded media
      setSelectedMedia(uploadedMedia[0])
    }
  }, [])

  const handleCropClick = useCallback(() => {
    if (selectedMedia && selectedMedia.mimeType?.startsWith('image/')) {
      const imageUrl = getMediaUrl(selectedMedia, true)
      if (imageUrl) {
        setMediaForCrop(selectedMedia)
        setActiveTab('crop')
      }
    }
  }, [selectedMedia])

  const handleCropComplete = useCallback(async (croppedAreaPixels: Area) => {
    const imageUrl = mediaForCrop ? getMediaUrl(mediaForCrop, true) : null
    if (!mediaForCrop || !imageUrl) return

    try {
      // Get the cropped image blob using the full-size image URL
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels)

      // Create a new file from the blob
      const fileName = `cropped-${mediaForCrop.filename || 'image'}`
      const file = new File([croppedBlob], fileName, { type: 'image/jpeg' })

      // Upload the cropped image
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        '_payload',
        JSON.stringify({
          alt: `Cropped: ${mediaForCrop.alt || mediaForCrop.filename || 'image'}`,
        }),
      )

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setSelectedMedia(result.doc)
        setActiveTab('browse')
      }
    } catch (error) {
      console.error('Failed to upload cropped image:', error)
    }

    setMediaForCrop(null)
  }, [mediaForCrop])

  const handleCropCancel = useCallback(() => {
    setMediaForCrop(null)
    setActiveTab('browse')
  }, [])

  const handleConfirmSelection = useCallback(() => {
    if (selectedMedia && onSelect) {
      onSelect(selectedMedia)
      setIsOpen(false)
    }
  }, [selectedMedia, onSelect])

  const tabStyle = (tab: TabType): React.CSSProperties => ({
    padding: '8px 16px',
    border: 'none',
    background: activeTab === tab ? 'var(--theme-elevation-100)' : 'transparent',
    color: activeTab === tab ? 'var(--theme-text)' : 'var(--theme-elevation-800)',
    cursor: 'pointer',
    borderBottom: activeTab === tab ? '2px solid var(--theme-success-500)' : '2px solid transparent',
    fontWeight: activeTab === tab ? 600 : 400,
    transition: 'all 0.2s ease',
  })

  // Modal styles
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'var(--theme-elevation-0)',
    borderRadius: 'var(--border-radius-m)',
    width: '90vw',
    maxWidth: '1200px',
    height: '85vh',
    maxHeight: '900px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--theme-elevation-150)',
    backgroundColor: 'var(--theme-elevation-50)',
  }

  return (
    <>
      <Button buttonStyle={buttonStyle} size="small" onClick={() => setIsOpen(true)}>
        {buttonLabel}
      </Button>

      {isOpen && (
        <div style={overlayStyle} onClick={() => setIsOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={headerStyle}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Media Library</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--theme-text)',
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden',
                padding: '16px',
              }}
            >
              {/* Tab Navigation */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--theme-elevation-150)',
                  marginBottom: '16px',
                }}
              >
                <button
                  type="button"
                  style={tabStyle('browse')}
                  onClick={() => setActiveTab('browse')}
                >
                  Browse
                </button>
                <button
                  type="button"
                  style={tabStyle('upload')}
                  onClick={() => setActiveTab('upload')}
                >
                  Upload
                </button>
                {allowCrop && selectedMedia?.mimeType?.startsWith('image/') && getMediaUrl(selectedMedia, true) && (
                  <button
                    type="button"
                    style={tabStyle('crop')}
                    onClick={handleCropClick}
                  >
                    Crop
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                {activeTab === 'browse' && (
                  <MediaGrid
                    onSelect={handleMediaSelect}
                    selectedId={selectedMedia?.id}
                  />
                )}

                {activeTab === 'upload' && (
                  <DropzoneUploader onUploadComplete={handleUploadComplete} />
                )}

                {activeTab === 'crop' && mediaForCrop && getMediaUrl(mediaForCrop, true) && (
                  <ImageCropper
                    imageUrl={getMediaUrl(mediaForCrop, true)!}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                  />
                )}
              </div>

              {/* Footer with selected media info and confirm button */}
              {selectedMedia && activeTab === 'browse' && (
                <div
                  style={{
                    borderTop: '1px solid var(--theme-elevation-150)',
                    padding: '16px',
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    backgroundColor: 'var(--theme-elevation-50)',
                    borderRadius: 'var(--border-radius-s)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flex: 1,
                      overflow: 'hidden',
                    }}
                  >
                    {selectedMedia.mimeType?.startsWith('image/') && getMediaUrl(selectedMedia) && (
                      <img
                        src={getMediaUrl(selectedMedia)!}
                        alt={selectedMedia.alt || selectedMedia.filename || 'Media'}
                        style={{
                          width: '48px',
                          height: '48px',
                          objectFit: 'cover',
                          borderRadius: 'var(--border-radius-s)',
                        }}
                      />
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {selectedMedia.filename}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--theme-elevation-600)',
                        }}
                      >
                        {selectedMedia.width && selectedMedia.height
                          ? `${selectedMedia.width} × ${selectedMedia.height}`
                          : selectedMedia.mimeType}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {allowCrop && selectedMedia.mimeType?.startsWith('image/') && getMediaUrl(selectedMedia, true) && (
                      <Button buttonStyle="secondary" size="small" onClick={handleCropClick}>
                        Crop
                      </Button>
                    )}
                    {onSelect && (
                      <Button buttonStyle="primary" size="small" onClick={handleConfirmSelection}>
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MediaLibrary
