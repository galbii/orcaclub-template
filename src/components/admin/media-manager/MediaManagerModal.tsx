'use client'

import { useCallback, useState, useRef, useEffect, type DragEvent } from 'react'
import { useMediaManager } from './MediaManagerProvider'
import { MediaGrid } from './MediaGrid'
import { FolderTree } from './FolderTree'
import { ToastContainer } from './Toast'
import { ImageEditor } from './ImageEditor'
import { MediaUploadMetadataForm } from './MediaUploadMetadataForm'
import { MediaEditPanel } from './MediaEditPanel'

// Dark theme color palette - Modern, sleek, professional
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

/**
 * Modal dialog for the media manager with folder navigation and drag-drop upload
 * Rebuilt for proper upload flow handling
 */
export function MediaManagerModal() {
  const {
    isOpen,
    closeModal,
    handleFilesSelected,
    isUploading,
    error,
    searchQuery,
    setSearchQuery,
    selectedMedia,
    copyPublicUrl,
    totalDocs,
    toasts,
    dismissToast,
    editingFile,
    metadataEditingFile,
    editingMedia,
    setEditingFile,
    setMetadataEditingFile,
    setEditingMedia,
    moveToMetadataEditing,
    uploadWithMetadata,
    skipEditing,
    pendingFiles,
    currentFolder,
    folders,
    moveMediaToFolder,
    modalOptions,
  } = useMediaManager()

  const [isDragging, setIsDragging] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  // Debug logging
  useEffect(() => {
    console.log('🎨 [MODAL STATE]', {
      isOpen,
      editingFile: editingFile?.name,
      metadataEditingFile: metadataEditingFile?.name,
      editingMedia: editingMedia?.filename,
      pendingFiles: pendingFiles.length,
    })
  }, [isOpen, editingFile, metadataEditingFile, editingMedia, pendingFiles])

  // Handle keyboard escape - only close modal, not editors
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If editing, close editor first
        if (editingFile) {
          setEditingFile(null)
        } else if (metadataEditingFile) {
          setMetadataEditingFile(null)
        } else if (editingMedia) {
          setEditingMedia(null)
        } else if (isOpen) {
          closeModal()
        }
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, editingFile, metadataEditingFile, editingMedia, closeModal, setEditingFile, setMetadataEditingFile, setEditingMedia])

  // Prevent body scroll when modal or editors are open
  useEffect(() => {
    if (isOpen || editingFile || metadataEditingFile || editingMedia) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, editingFile, metadataEditingFile, editingMedia])

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      console.log('📥 [DROP] Files dropped:', files.length)
      handleFilesSelected(files)
    }
  }, [handleFilesSelected])

  // File input handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      console.log('📥 [FILE INPUT] Files selected:', files.length)
      handleFilesSelected(files)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFilesSelected])

  // Handle move to folder
  const handleMoveToFolder = useCallback(async (folderId: string | null) => {
    if (selectedMedia) {
      await moveMediaToFolder(selectedMedia.id, folderId)
      setShowMoveMenu(false)
    }
  }, [selectedMedia, moveMediaToFolder])

  // Handle select in selection mode
  const handleSelect = useCallback(() => {
    if (selectedMedia && modalOptions?.onSelect) {
      modalOptions.onSelect(selectedMedia)
      closeModal()
    }
  }, [selectedMedia, modalOptions, closeModal])

  // Determine if we're in selection mode
  const isSelectionMode = modalOptions?.mode === 'select'

  return (
    <>
      {/* Main Media Library Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={closeModal}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.backdrop,
              backdropFilter: 'blur(8px)',
              zIndex: 1,
            }}
          />

          {/* Modal Container */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '1280px',
              height: '92vh',
              backgroundColor: colors.modalBg,
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            {/* Header */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px 32px',
                backgroundColor: colors.headerBg,
                borderBottom: `1px solid ${colors.border}`,
                background: `linear-gradient(135deg, ${colors.headerBg} 0%, ${colors.modalBg} 100%)`,
              }}
            >
              {/* Left: Title & Info */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div>
                  <h2
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: colors.textPrimary,
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {isSelectionMode ? 'Select Media' : 'Media Library'}
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: colors.textSecondary,
                      marginTop: '6px',
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{totalDocs.toLocaleString()} items</span>
                    {currentFolder && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg
                            style={{ width: '16px', height: '16px', color: colors.gold }}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
                          </svg>
                          <span style={{ color: colors.textAccent }}>{currentFolder.name}</span>
                        </span>
                      </>
                    )}
                    {isSelectionMode && (
                      <>
                        <span>•</span>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: colors.primary,
                            color: colors.white,
                          }}
                        >
                          Selection Mode
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Search, Upload, Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                  <svg
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px',
                      color: colors.textMuted,
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '320px',
                      paddingLeft: '48px',
                      paddingRight: '20px',
                      paddingTop: '14px',
                      paddingBottom: '14px',
                      fontSize: '14px',
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.borderFocus
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.border
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Upload Button */}
                <button
                  onClick={() => {
                    console.log('📤 [UPLOAD BUTTON] Clicked')
                    fileInputRef.current?.click()
                  }}
                  disabled={isUploading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    border: 'none',
                    background: isUploading
                      ? colors.textMuted
                      : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                    color: colors.white,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    boxShadow: isUploading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease',
                    opacity: isUploading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isUploading) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {isUploading ? (
                    <>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          border: `2px solid ${colors.white}`,
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Upload</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,application/pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {/* Close Button */}
                <button
                  onClick={closeModal}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: colors.cardBg,
                    color: colors.textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.error
                    e.currentTarget.style.color = colors.white
                    e.currentTarget.style.transform = 'rotate(90deg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.cardBg
                    e.currentTarget.style.color = colors.textMuted
                    e.currentTarget.style.transform = 'rotate(0deg)'
                  }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                style={{
                  flexShrink: 0,
                  padding: '16px 24px',
                  backgroundColor: colors.errorBg,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: colors.error }}>
                  <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{error}</p>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
              {/* Folder Sidebar */}
              <div
                style={{
                  flexShrink: 0,
                  width: sidebarCollapsed ? 0 : '288px',
                  backgroundColor: colors.sidebarBg,
                  borderRight: `1px solid ${colors.border}`,
                  overflow: 'visible',
                  transition: 'width 0.3s ease',
                  position: 'relative',
                }}
              >
                <div style={{ overflow: sidebarCollapsed ? 'hidden' : 'visible', height: '100%' }}>
                  <FolderTree />
                </div>

                {/* Sidebar Toggle */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-18px',
                    transform: 'translateY(-50%)',
                    zIndex: 20,
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary
                    e.currentTarget.style.borderColor = colors.primary
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.cardBg
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                  }}
                >
                  <svg
                    style={{
                      width: '16px',
                      height: '16px',
                      color: colors.textSecondary,
                      transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      pointerEvents: 'none',
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {/* Main Content */}
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  backgroundColor: colors.contentBg,
                  overflow: 'hidden',
                }}
              >
                <MediaGrid />

                {/* Drag & Drop Overlay */}
                {isDragging && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      backdropFilter: 'blur(4px)',
                      border: `3px dashed ${colors.primary}`,
                      zIndex: 10,
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '96px',
                          height: '96px',
                          margin: '0 auto 24px',
                          borderRadius: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                          boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
                          animation: 'bounce 1s infinite',
                        }}
                      >
                        <svg
                          style={{ width: '48px', height: '48px', color: colors.white }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <p style={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                        Drop files to upload
                      </p>
                      <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '8px' }}>
                        {currentFolder ? `Uploading to "${currentFolder.name}"` : 'Images will open in editor for cropping'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Selected Media */}
            {selectedMedia && (
              <div
                style={{
                  flexShrink: 0,
                  padding: '24px 32px',
                  backgroundColor: colors.headerBg,
                  borderTop: `1px solid ${colors.border}`,
                  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Left: Thumbnail + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {selectedMedia.mimeType?.startsWith('image/') && (
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          backgroundColor: colors.cardBg,
                          border: `2px solid ${colors.primary}`,
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        <img
                          src={selectedMedia.sizes?.thumbnail?.url || selectedMedia.publicUrl || selectedMedia.url}
                          alt={selectedMedia.alt}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                        {selectedMedia.filename}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '14px',
                          color: colors.textSecondary,
                          marginTop: '4px',
                        }}
                      >
                        {selectedMedia.width && selectedMedia.height && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                              />
                            </svg>
                            {selectedMedia.width} × {selectedMedia.height}px
                          </span>
                        )}
                        {selectedMedia.filesize > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            {formatFileSize(selectedMedia.filesize)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Select Button (Selection Mode) */}
                    {isSelectionMode && (
                      <button
                        onClick={handleSelect}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px 32px',
                          fontSize: '16px',
                          fontWeight: 700,
                          borderRadius: '12px',
                          border: 'none',
                          background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`,
                          color: colors.white,
                          cursor: 'pointer',
                          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.5)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)'
                          e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Select This Media
                      </button>
                    )}

                    {/* Move to Folder (Browse Mode) */}
                    {!isSelectionMode && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowMoveMenu(!showMoveMenu)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            borderRadius: '12px',
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                            color: colors.textSecondary,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.hoverBg
                            e.currentTarget.style.borderColor = colors.gold
                            e.currentTarget.style.color = colors.gold
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardBg
                            e.currentTarget.style.borderColor = colors.border
                            e.currentTarget.style.color = colors.textSecondary
                          }}
                        >
                          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          Move
                        </button>

                        {/* Move Menu */}
                        {showMoveMenu && (
                          <>
                            <div
                              onClick={() => setShowMoveMenu(false)}
                              style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 10,
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: 0,
                                marginBottom: '12px',
                                width: '288px',
                                borderRadius: '16px',
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                                padding: '8px',
                                zIndex: 20,
                                maxHeight: '320px',
                                overflowY: 'auto',
                              }}
                            >
                              <button
                                onClick={() => handleMoveToFolder(null)}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '14px 20px',
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  borderRadius: '8px',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: colors.textSecondary,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = colors.hoverBg
                                  e.currentTarget.style.color = colors.textPrimary
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = colors.textSecondary
                                }}
                              >
                                <svg
                                  style={{ width: '20px', height: '20px', color: colors.textMuted }}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Root (No folder)
                              </button>
                              <div style={{ height: '1px', backgroundColor: colors.border, margin: '8px 0' }} />
                              {folders.map((folder) => (
                                <button
                                  key={folder.id}
                                  onClick={() => handleMoveToFolder(folder.id)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 20px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    borderRadius: '8px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: colors.textSecondary,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.hoverBg
                                    e.currentTarget.style.color = colors.gold
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                    e.currentTarget.style.color = colors.textSecondary
                                  }}
                                >
                                  <svg style={{ width: '20px', height: '20px', color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
                                  </svg>
                                  {folder.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Edit Metadata */}
                    <button
                      onClick={() => setEditingMedia(selectedMedia)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '12px',
                        border: 'none',
                        background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
                        color: colors.white,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Metadata
                    </button>

                    {/* Copy URL */}
                    <button
                      onClick={() => copyPublicUrl(selectedMedia.publicUrl || selectedMedia.url)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '12px',
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        color: colors.textSecondary,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.hoverBg
                        e.currentTarget.style.borderColor = colors.primary
                        e.currentTarget.style.color = colors.primaryLight
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.cardBg
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.color = colors.textSecondary
                      }}
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy URL
                    </button>

                    {/* Open in New Tab */}
                    <a
                      href={selectedMedia.publicUrl || selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '12px',
                        textDecoration: 'none',
                        background: `linear-gradient(135deg, ${colors.cardBg} 0%, ${colors.hoverBg} 100%)`,
                        border: `1px solid ${colors.border}`,
                        color: colors.textPrimary,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`
                        e.currentTarget.style.borderColor = colors.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.background = `linear-gradient(135deg, ${colors.cardBg} 0%, ${colors.hoverBg} 100%)`
                        e.currentTarget.style.borderColor = colors.border
                      }}
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Open
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Editor - Always rendered when editingFile exists, independent of modal */}
      {editingFile && (
        <ImageEditor
          file={editingFile}
          onSave={(editedFile) => {
            console.log('✅ [IMAGE EDITOR] Save clicked, moving to metadata')
            moveToMetadataEditing(editedFile)
          }}
          onCancel={() => {
            console.log('❌ [IMAGE EDITOR] Cancel clicked')
            if (pendingFiles.length > 1) {
              skipEditing()
            } else {
              setEditingFile(null)
            }
          }}
        />
      )}

      {/* Metadata Form - Always rendered when metadataEditingFile exists, independent of modal */}
      {metadataEditingFile && (
        <MediaUploadMetadataForm
          file={metadataEditingFile}
          onUpload={(metadata) => {
            console.log('✅ [METADATA FORM] Upload clicked')
            uploadWithMetadata(metadataEditingFile, metadata)
          }}
          onCancel={() => {
            console.log('❌ [METADATA FORM] Cancel clicked')
            if (pendingFiles.length > 1) {
              skipEditing()
            } else {
              setMetadataEditingFile(null)
            }
          }}
        />
      )}

      {/* Media Edit Panel - Always rendered when editingMedia exists, independent of modal */}
      {editingMedia && <MediaEditPanel key={editingMedia.id} media={editingMedia} onClose={() => setEditingMedia(null)} />}

      {/* Toast Notifications - Always rendered */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Keyframes for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  )
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
