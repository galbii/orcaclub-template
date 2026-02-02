'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMediaManager } from './MediaManagerProvider'
import type { MediaItem, FolderItem } from './types'

// Dark theme color palette
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

// Keyframe animations
const spinKeyframes = `
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
`

/**
 * Grid display of media items with selection and actions
 */
export function MediaGrid() {
  const {
    media,
    isLoading,
    selectedMedia,
    selectMedia,
    copyPublicUrl,
    deleteMedia,
    editMediaImage,
    currentPage,
    totalPages,
    fetchMedia,
    folders,
    moveMediaToFolder,
  } = useMediaManager()

  if (isLoading && media.length === 0) {
    return (
      <>
        <style>{spinKeyframes}</style>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: colors.contentBg
        }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                animation: 'spin 1s linear infinite',
                borderRadius: '9999px',
                height: '48px',
                width: '48px',
                border: '3px solid',
                borderColor: colors.primary,
                borderTopColor: 'transparent',
                margin: '0 auto 16px'
              }}
            />
            <p style={{ fontSize: '16px', fontWeight: 500, color: colors.textSecondary }}>Loading media...</p>
          </div>
        </div>
      </>
    )
  }

  if (media.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '48px',
          backgroundColor: colors.contentBg
        }}
      >
        <div
          style={{
            width: '112px',
            height: '112px',
            marginBottom: '32px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.cardBg
          }}
        >
          <svg style={{ width: '56px', height: '56px', color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', color: colors.textPrimary }}>No media found</p>
        <p style={{ fontSize: '16px', color: colors.textSecondary }}>Drag and drop files here or click Upload to add media</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: colors.contentBg }}>
      {/* Grid - Larger items with fewer columns */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {media.map((item) => (
            <MediaGridItem
              key={item.id}
              item={item}
              isSelected={selectedMedia?.id === item.id}
              onSelect={() => selectMedia(selectedMedia?.id === item.id ? null : item)}
              onCopyUrl={() => copyPublicUrl(item.publicUrl || item.url)}
              onDelete={() => deleteMedia(item.id)}
              onEditImage={() => editMediaImage(item)}
              folders={folders}
              onMoveToFolder={(folderId) => moveMediaToFolder(item.id, folderId)}
            />
          ))}
        </div>
      </div>

      {/* Pagination - Larger */}
      {totalPages > 1 && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '16px 24px',
            borderTop: `1px solid ${colors.border}`,
            backgroundColor: colors.headerBg
          }}
        >
          <button
            onClick={() => fetchMedia(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '16px',
              fontWeight: 500,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              opacity: currentPage === 1 ? 0.4 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              backgroundColor: colors.cardBg,
              color: colors.textSecondary,
              border: 'none'
            }}
          >
            <svg style={{ width: '20px', height: '20px', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => fetchMedia(pageNum)}
                  style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    backgroundColor: currentPage === pageNum ? colors.primary : colors.cardBg,
                    color: currentPage === pageNum ? colors.white : colors.textSecondary,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => fetchMedia(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '16px',
              fontWeight: 500,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              opacity: currentPage === totalPages ? 0.4 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              backgroundColor: colors.cardBg,
              color: colors.textSecondary,
              border: 'none'
            }}
          >
            Next
            <svg style={{ width: '20px', height: '20px', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

interface MediaGridItemProps {
  item: MediaItem
  isSelected: boolean
  onSelect: () => void
  onCopyUrl: () => void
  onDelete: () => void
  onEditImage: () => void
  folders: FolderItem[]
  onMoveToFolder: (folderId: string | null) => void
}

/**
 * Individual media item in the grid
 */
function MediaGridItem({ item, isSelected, onSelect, onCopyUrl, onDelete, onEditImage, folders, onMoveToFolder }: MediaGridItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isImage = item.mimeType?.startsWith('image/')
  const thumbnailUrl = item.sizes?.thumbnail?.url || item.publicUrl || item.url

  // Get current folder name if item is in a folder
  const currentFolderName = typeof item.folder === 'object' && item.folder
    ? item.folder.name
    : null

  // Calculate dropdown position when showing actions
  useEffect(() => {
    if (showActions && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.right - 200, window.innerWidth - 220),
      })
    }
  }, [showActions])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
      }
    }
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isSelected
          ? `0 0 0 3px ${colors.primary}, 0 4px 12px rgba(59, 130, 246, 0.3)`
          : isHovered
            ? `0 4px 20px rgba(0, 0, 0, 0.4)`
            : `0 2px 8px rgba(0, 0, 0, 0.2)`,
        transform: isSelected ? 'scale(1.02)' : isHovered ? 'translateY(-2px)' : 'none',
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('a')) {
          return
        }
        onSelect()
      }}
      onMouseEnter={() => {
        // Clear any pending leave timer
        if (leaveTimerRef.current) {
          clearTimeout(leaveTimerRef.current)
          leaveTimerRef.current = null
        }
        setIsHovered(true)
      }}
      onMouseLeave={() => {
        // Delay hiding buttons to allow clicking them
        leaveTimerRef.current = setTimeout(() => {
          setIsHovered(false)
        }, 300)
      }}
    >
      {/* Thumbnail - Larger aspect ratio */}
      <div style={{
        aspectRatio: '4/3',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        overflow: 'hidden',
        backgroundColor: colors.inputBg
      }}>
        {isImage ? (
          <img
            src={thumbnailUrl}
            alt={item.alt || item.filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.inputBg
          }}>
            <FileIcon mimeType={item.mimeType} />
          </div>
        )}
      </div>

      {/* Filename bar - Always visible, solid background */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: `1px solid ${colors.border}`,
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          backgroundColor: colors.cardBg,
        }}
      >
        <p
          style={{
            fontSize: '14px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: colors.textPrimary
          }}
          title={item.filename}
        >
          {item.filename}
        </p>
        {currentFolderName && (
          <p style={{
            fontSize: '12px',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: colors.textMuted
          }}>
            <svg style={{ width: '12px', height: '12px', color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
            </svg>
            {currentFolderName}
          </p>
        )}
      </div>

      {/* Hover overlay for actions */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transition: 'opacity 0.2s ease',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 50%)',
          opacity: isHovered ? 1 : 0,
          pointerEvents: 'none',
        }}
      />

      {/* Action buttons - Top right - ALWAYS VISIBLE FOR TESTING */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '8px',
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onCopyUrl()
          }}
          style={{
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s ease',
            backgroundColor: colors.cardBg,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Copy URL"
        >
          <svg style={{ width: '20px', height: '20px', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Delete "${item.filename}"? This action cannot be undone.`)) {
              onDelete()
            }
          }}
          style={{
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
            backgroundColor: colors.cardBg,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.backgroundColor = colors.error
            e.currentTarget.style.borderColor = colors.error
            e.currentTarget.style.color = colors.white
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.backgroundColor = colors.cardBg
            e.currentTarget.style.borderColor = colors.border
            e.currentTarget.style.color = colors.textPrimary
          }}
          title="Delete"
        >
          <svg style={{ width: '20px', height: '20px', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button
          type="button"
          ref={moreButtonRef}
          onClick={(e) => {
            e.stopPropagation()
            setShowActions(prev => !prev)
            setShowFolderMenu(false)
          }}
          style={{
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s ease',
            backgroundColor: colors.cardBg,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="More actions"
        >
          <svg style={{ width: '20px', height: '20px', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu - rendered in portal for proper positioning */}
      {showActions && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop to close dropdown */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000000,
            }}
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(false)
              setShowFolderMenu(false)
            }}
          />
          <div
            style={{
              position: 'fixed',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
              border: `1px solid ${colors.border}`,
              padding: '8px 0',
              zIndex: 1000001,
              backgroundColor: colors.cardBg,
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              minWidth: 200,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Move to folder option */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFolderMenu(!showFolderMenu)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  width: '100%',
                  transition: 'background-color 0.2s ease',
                  color: colors.textPrimary,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg style={{ width: '20px', height: '20px', color: colors.gold, pointerEvents: 'none' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Move to folder</span>
                </div>
                <svg style={{ width: '16px', height: '16px', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Folder submenu */}
              {showFolderMenu && (
                <div
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: 0,
                    marginLeft: '4px',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                    border: `1px solid ${colors.border}`,
                    padding: '8px 0',
                    minWidth: '180px',
                    backgroundColor: colors.cardBg,
                  }}
                >
                  {/* Root option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveToFolder(null)
                      setShowActions(false)
                      setShowFolderMenu(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      width: '100%',
                      transition: 'background-color 0.2s ease',
                      color: colors.textPrimary,
                      backgroundColor: !item.folder ? colors.hoverBg : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => !item.folder ? null : e.currentTarget.style.backgroundColor = colors.hoverBg}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !item.folder ? colors.hoverBg : 'transparent'}
                  >
                    <svg style={{ width: '16px', height: '16px', color: colors.textMuted, pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Root (No folder)</span>
                  </button>
                  {folders.length > 0 && (
                    <div style={{ borderTop: `1px solid ${colors.border}`, margin: '4px 0' }} />
                  )}
                  {folders.map((folder) => {
                    const isCurrentFolder = typeof item.folder === 'object'
                      ? item.folder?.id === folder.id
                      : item.folder === folder.id
                    return (
                      <button
                        key={folder.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onMoveToFolder(folder.id)
                          setShowActions(false)
                          setShowFolderMenu(false)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 16px',
                          fontSize: '14px',
                          width: '100%',
                          transition: 'background-color 0.2s ease',
                          color: colors.textPrimary,
                          backgroundColor: isCurrentFolder ? colors.hoverBg : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => isCurrentFolder ? null : e.currentTarget.style.backgroundColor = colors.hoverBg}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCurrentFolder ? colors.hoverBg : 'transparent'}
                      >
                        <svg style={{ width: '16px', height: '16px', color: colors.gold, pointerEvents: 'none' }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
                        </svg>
                        <span>{folder.name}</span>
                        {isCurrentFolder && (
                          <svg style={{ width: '16px', height: '16px', marginLeft: 'auto', color: colors.primary, pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ borderTop: `1px solid ${colors.border}`, margin: '4px 0' }} />

            {/* Edit Image - Only for images */}
            {isImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowActions(false)
                  setShowFolderMenu(false)
                  onEditImage()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  width: '100%',
                  transition: 'background-color 0.2s ease',
                  color: colors.textPrimary,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg style={{ width: '20px', height: '20px', color: colors.accent, pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Image
              </button>
            )}

            <a
              href={item.publicUrl || item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                fontSize: '14px',
                transition: 'background-color 0.2s ease',
                color: colors.textPrimary,
                backgroundColor: 'transparent',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg style={{ width: '20px', height: '20px', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in new tab
            </a>

            <div style={{ borderTop: `1px solid ${colors.border}`, margin: '4px 0' }} />

            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Delete this media item?')) {
                  onDelete()
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                fontSize: '14px',
                width: '100%',
                transition: 'background-color 0.2s ease',
                color: colors.error,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.errorBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg style={{ width: '20px', height: '20px', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            backgroundColor: colors.primary,
          }}
        >
          <svg style={{ width: '16px', height: '16px', color: colors.white }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  )
}

/**
 * File type icon for non-image files
 */
function FileIcon({ mimeType }: { mimeType: string }) {
  const iconStyle = { width: '48px', height: '48px' }

  if (mimeType?.startsWith('video/')) {
    return (
      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.hoverBg }}>
        <svg style={{ ...iconStyle, color: colors.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  if (mimeType?.startsWith('audio/')) {
    return (
      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.hoverBg }}>
        <svg style={{ ...iconStyle, color: colors.success }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
    )
  }

  if (mimeType === 'application/pdf') {
    return (
      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.errorBg }}>
        <svg style={{ ...iconStyle, color: colors.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.hoverBg }}>
      <svg style={{ ...iconStyle, color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  )
}
