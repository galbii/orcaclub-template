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

  // Handle keyboard escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !editingFile) {
        closeModal()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeModal, editingFile])

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
      handleFilesSelected(files)
    }
  }, [handleFilesSelected])

  // File input handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilesSelected(files)
    }
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

  // Debug logging
  useEffect(() => {
    console.log('[MediaManagerModal] State changed:', { isOpen, mode: modalOptions?.mode, isSelectionMode })
  }, [isOpen, modalOptions, isSelectionMode])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-200">
        {/* Backdrop with blur */}
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: colors.backdrop }}
          onClick={closeModal}
        />

        {/* Modal Container */}
        <div
          className="relative w-full max-w-7xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
          style={{
            backgroundColor: colors.modalBg,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Modern Header with Gradient */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b backdrop-blur-sm"
            style={{
              backgroundColor: colors.headerBg,
              borderColor: colors.border,
              background: `linear-gradient(135deg, ${colors.headerBg} 0%, ${colors.modalBg} 100%)`,
            }}
          >
            <div className="flex items-center gap-5">
              {/* Icon with gradient background */}
              <div
                className="p-3.5 rounded-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                }}
              >
                <svg className="w-7 h-7" style={{ color: colors.white }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
                  {isSelectionMode ? 'Select Media' : 'Media Library'}
                </h2>
                <div className="flex items-center gap-3 text-sm mt-1.5" style={{ color: colors.textSecondary }}>
                  <span className="font-medium">{totalDocs.toLocaleString()} items</span>
                  {currentFolder && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" style={{ color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
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
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
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

            <div className="flex items-center gap-3">
              {/* Modern Search Bar */}
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-12 pr-5 py-3.5 text-sm rounded-xl border focus:outline-none transition-all"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textPrimary,
                    borderColor: colors.border,
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
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
                  style={{ color: colors.textMuted }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isUploading ? colors.textMuted : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                  color: colors.white,
                  boxShadow: isUploading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
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
                      className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent"
                      style={{ borderColor: colors.white, borderTopColor: 'transparent' }}
                    />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="hidden"
              />

              {/* Close Button */}
              <button
                onClick={closeModal}
                className="p-3 rounded-xl transition-all hover:rotate-90"
                style={{
                  backgroundColor: colors.cardBg,
                  color: colors.textMuted,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.error
                  e.currentTarget.style.color = colors.white
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.cardBg
                  e.currentTarget.style.color = colors.textMuted
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="flex-shrink-0 px-6 py-4 border-b"
              style={{
                backgroundColor: colors.errorBg,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-3" style={{ color: colors.error }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Content area with sidebar */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Folder Sidebar */}
            <div
              className={`flex-shrink-0 border-r transition-all duration-300 relative ${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-72'}`}
              style={{
                backgroundColor: colors.sidebarBg,
                borderColor: colors.border,
              }}
            >
              <FolderTree />

              {/* Sidebar Toggle Button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute top-1/2 -translate-y-1/2 -right-4 z-20 w-9 h-9 flex items-center justify-center border rounded-full shadow-lg transition-all hover:scale-110"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                  color: colors.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary
                  e.currentTarget.style.borderColor = colors.primary
                  e.currentTarget.style.color = colors.white
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.cardBg
                  e.currentTarget.style.borderColor = colors.border
                  e.currentTarget.style.color = colors.textSecondary
                }}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Expand Sidebar Button (when collapsed) */}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="absolute top-1/2 -translate-y-1/2 left-0 z-20 w-10 h-16 flex items-center justify-center border-r rounded-r-xl shadow-lg transition-all hover:w-12"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                  color: colors.textSecondary,
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Main Content Area */}
            <div className="flex-1 relative" style={{ backgroundColor: colors.contentBg }}>
              <MediaGrid />

              {/* Drag & Drop Overlay */}
              {isDragging && (
                <div
                  className="absolute inset-0 flex items-center justify-center z-10 backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: `3px dashed ${colors.primary}`,
                  }}
                >
                  <div className="text-center">
                    <div
                      className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center animate-bounce"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                        boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
                      }}
                    >
                      <svg className="w-12 h-12" style={{ color: colors.white }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>Drop files to upload</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {currentFolder
                        ? `Uploading to "${currentFolder.name}"`
                        : 'Images will open in editor for cropping'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Selected Media Details */}
          {selectedMedia && (
            <div
              className="flex-shrink-0 px-8 py-6 border-t backdrop-blur-sm"
              style={{
                backgroundColor: colors.headerBg,
                borderColor: colors.border,
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  {/* Thumbnail Preview */}
                  {selectedMedia.mimeType?.startsWith('image/') && (
                    <div
                      className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.primary,
                      }}
                    >
                      <img
                        src={selectedMedia.sizes?.thumbnail?.url || selectedMedia.publicUrl || selectedMedia.url}
                        alt={selectedMedia.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Media Info */}
                  <div>
                    <p className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                      {selectedMedia.filename}
                    </p>
                    <div className="flex items-center gap-3 text-sm" style={{ color: colors.textSecondary }}>
                      {selectedMedia.width && selectedMedia.height && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          {selectedMedia.width} × {selectedMedia.height}px
                        </span>
                      )}
                      {selectedMedia.filesize > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {formatFileSize(selectedMedia.filesize)}
                        </span>
                      )}
                      {selectedMedia.folder && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" style={{ color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
                          </svg>
                          <span style={{ color: colors.gold }}>
                            {typeof selectedMedia.folder === 'string'
                              ? selectedMedia.folder
                              : selectedMedia.folder.name
                            }
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Select Button (Selection Mode Only) */}
                  {isSelectionMode && (
                    <button
                      onClick={handleSelect}
                      className="flex items-center gap-3 px-8 py-3.5 text-base font-bold rounded-xl transition-all shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`,
                        color: colors.white,
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Select This Media
                    </button>
                  )}

                  {/* Move to Folder (Browse Mode Only) */}
                  {!isSelectionMode && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMoveMenu(!showMoveMenu)}
                        className="flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-xl transition-all border"
                        style={{
                          backgroundColor: colors.cardBg,
                          borderColor: colors.border,
                          color: colors.textSecondary,
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
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Move
                      </button>

                      {/* Move Menu Dropdown */}
                      {showMoveMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowMoveMenu(false)}
                          />
                          <div
                            className="absolute bottom-full right-0 mb-3 w-72 rounded-2xl shadow-2xl border py-2 z-20 max-h-80 overflow-y-auto"
                            style={{
                              backgroundColor: colors.cardBg,
                              borderColor: colors.border,
                              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                            }}
                          >
                            <button
                              onClick={() => handleMoveToFolder(null)}
                              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors"
                              style={{ color: colors.textSecondary }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.hoverBg
                                e.currentTarget.style.color = colors.textPrimary
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = colors.textSecondary
                              }}
                            >
                              <svg className="w-5 h-5" style={{ color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Root (No folder)
                            </button>
                            <div className="h-px my-2" style={{ backgroundColor: colors.border }} />
                            {folders.map((folder) => (
                              <button
                                key={folder.id}
                                onClick={() => handleMoveToFolder(folder.id)}
                                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors"
                                style={{ color: colors.textSecondary }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = colors.hoverBg
                                  e.currentTarget.style.color = colors.gold
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = colors.textSecondary
                                }}
                              >
                                <svg className="w-5 h-5" style={{ color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
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

                  {/* Edit Button (Always Available) */}
                  <button
                    onClick={() => setEditingMedia(selectedMedia)}
                    className="flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-xl transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
                      color: colors.white,
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Metadata
                  </button>

                  {/* Copy URL Button */}
                  <button
                    onClick={() => copyPublicUrl(selectedMedia.publicUrl || selectedMedia.url)}
                    className="flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-xl transition-all border"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                      color: colors.textSecondary,
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy URL
                  </button>

                  {/* Open in New Tab */}
                  <a
                    href={selectedMedia.publicUrl || selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-xl transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${colors.cardBg} 0%, ${colors.hoverBg} 100%)`,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Editor */}
      {editingFile && (
        <ImageEditor
          file={editingFile}
          onSave={moveToMetadataEditing}
          onCancel={() => {
            if (pendingFiles.length > 1) {
              skipEditing()
            } else {
              setEditingFile(null)
            }
          }}
        />
      )}

      {/* Metadata Editor */}
      {metadataEditingFile && (
        <MediaUploadMetadataForm
          file={metadataEditingFile}
          onUpload={(metadata) => uploadWithMetadata(metadataEditingFile, metadata)}
          onCancel={() => {
            if (pendingFiles.length > 1) {
              // Skip this file and move to next
              skipEditing()
            } else {
              setMetadataEditingFile(null)
            }
          }}
        />
      )}

      {/* Media Edit Panel */}
      {editingMedia && (
        <MediaEditPanel
          media={editingMedia}
          onClose={() => setEditingMedia(null)}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
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
