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
    currentPage,
    totalPages,
    fetchMedia,
    folders,
    moveMediaToFolder,
  } = useMediaManager()

  if (isLoading && media.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.contentBg }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-3 border-t-transparent mx-auto mb-4"
            style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}
          />
          <p className="text-base font-medium" style={{ color: colors.textSecondary }}>Loading media...</p>
        </div>
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-12"
        style={{ backgroundColor: colors.contentBg }}
      >
        <div
          className="w-28 h-28 mb-8 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: colors.cardBg }}
        >
          <svg className="w-14 h-14" style={{ color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>No media found</p>
        <p className="text-base" style={{ color: colors.textSecondary }}>Drag and drop files here or click Upload to add media</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.contentBg }}>
      {/* Grid - Larger items with fewer columns */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {media.map((item) => (
            <MediaGridItem
              key={item.id}
              item={item}
              isSelected={selectedMedia?.id === item.id}
              onSelect={() => selectMedia(selectedMedia?.id === item.id ? null : item)}
              onCopyUrl={() => copyPublicUrl(item.publicUrl || item.url)}
              onDelete={() => deleteMedia(item.id)}
              folders={folders}
              onMoveToFolder={(folderId) => moveMediaToFolder(item.id, folderId)}
            />
          ))}
        </div>
      </div>

      {/* Pagination - Larger */}
      {totalPages > 1 && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-4 px-6 py-4 border-t"
          style={{ backgroundColor: colors.headerBg, borderColor: colors.border }}
        >
          <button
            onClick={() => fetchMedia(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 text-base font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-opacity-80"
            style={{ backgroundColor: colors.cardBg, color: colors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <div className="flex items-center gap-2">
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
                  className="w-10 h-10 text-base font-semibold rounded-lg transition-colors hover:bg-opacity-80"
                  style={{
                    backgroundColor: currentPage === pageNum ? colors.primary : colors.cardBg,
                    color: currentPage === pageNum ? colors.white : colors.textSecondary,
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
            className="flex items-center gap-2 px-4 py-2 text-base font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-opacity-80"
            style={{ backgroundColor: colors.cardBg, color: colors.textSecondary }}
          >
            Next
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  folders: FolderItem[]
  onMoveToFolder: (folderId: string | null) => void
}

/**
 * Individual media item in the grid
 */
function MediaGridItem({ item, isSelected, onSelect, onCopyUrl, onDelete, folders, onMoveToFolder }: MediaGridItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const moreButtonRef = useRef<HTMLButtonElement>(null)
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

  return (
    <div
      className="relative group rounded-xl cursor-pointer transition-all duration-200"
      style={{
        boxShadow: isSelected
          ? `0 0 0 3px ${colors.primary}, 0 4px 12px rgba(59, 130, 246, 0.3)`
          : isHovered
            ? `0 4px 20px rgba(0, 0, 0, 0.4)`
            : `0 2px 8px rgba(0, 0, 0, 0.2)`,
        transform: isSelected ? 'scale(1.02)' : isHovered ? 'translateY(-2px)' : undefined,
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
      }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowActions(false)
        setShowFolderMenu(false)
      }}
    >
      {/* Thumbnail - Larger aspect ratio */}
      <div className="aspect-[4/3] rounded-t-xl overflow-hidden" style={{ backgroundColor: colors.inputBg }}>
        {isImage ? (
          <img
            src={thumbnailUrl}
            alt={item.alt || item.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.inputBg }}>
            <FileIcon mimeType={item.mimeType} />
          </div>
        )}
      </div>

      {/* Filename bar - Always visible, solid background */}
      <div
        className="px-3 py-2.5 border-t rounded-b-xl"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        }}
      >
        <p
          className="text-sm font-medium truncate"
          style={{ color: colors.textPrimary }}
          title={item.filename}
        >
          {item.filename}
        </p>
        {currentFolderName && (
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: colors.textMuted }}>
            <svg className="w-3 h-3" style={{ color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
            </svg>
            {currentFolderName}
          </p>
        )}
      </div>

      {/* Hover overlay for actions */}
      <div
        className="absolute inset-0 transition-opacity duration-200 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 50%)',
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Action buttons - Top right */}
      {isHovered && (
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCopyUrl()
            }}
            className="p-2 rounded-lg shadow-md transition-all hover:scale-105"
            style={{ backgroundColor: colors.cardBg, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
            title="Copy URL"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            ref={moreButtonRef}
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
              setShowFolderMenu(false)
            }}
            className="p-2 rounded-lg shadow-md transition-all hover:scale-105"
            style={{ backgroundColor: colors.cardBg, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
            title="More actions"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Dropdown menu - rendered in portal for proper positioning */}
      {showActions && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-[10000]"
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(false)
              setShowFolderMenu(false)
            }}
          />
          <div
            className="fixed rounded-xl shadow-2xl border py-2 z-[10001]"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              minWidth: 200,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Move to folder option */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFolderMenu(!showFolderMenu)
                }}
                className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm w-full transition-colors hover:bg-opacity-80"
                style={{ color: colors.textPrimary, backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" style={{ color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Move to folder</span>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Folder submenu */}
              {showFolderMenu && (
                <div
                  className="absolute left-full top-0 ml-1 rounded-xl shadow-2xl border py-2 min-w-[180px]"
                  style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
                >
                  {/* Root option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveToFolder(null)
                      setShowActions(false)
                      setShowFolderMenu(false)
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm w-full transition-colors"
                    style={{
                      color: colors.textPrimary,
                      backgroundColor: !item.folder ? colors.hoverBg : 'transparent',
                    }}
                    onMouseEnter={(e) => !item.folder ? null : e.currentTarget.style.backgroundColor = colors.hoverBg}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !item.folder ? colors.hoverBg : 'transparent'}
                  >
                    <svg className="w-4 h-4" style={{ color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Root (No folder)</span>
                  </button>
                  {folders.length > 0 && (
                    <div className="border-t my-1" style={{ borderColor: colors.border }} />
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
                        className="flex items-center gap-3 px-4 py-2.5 text-sm w-full transition-colors"
                        style={{
                          color: colors.textPrimary,
                          backgroundColor: isCurrentFolder ? colors.hoverBg : 'transparent',
                        }}
                        onMouseEnter={(e) => isCurrentFolder ? null : e.currentTarget.style.backgroundColor = colors.hoverBg}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCurrentFolder ? colors.hoverBg : 'transparent'}
                      >
                        <svg className="w-4 h-4" style={{ color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
                        </svg>
                        <span>{folder.name}</span>
                        {isCurrentFolder && (
                          <svg className="w-4 h-4 ml-auto" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t my-1" style={{ borderColor: colors.border }} />

            <a
              href={item.publicUrl || item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: colors.textPrimary, backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in new tab
            </a>

            <div className="border-t my-1" style={{ borderColor: colors.border }} />

            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Delete this media item?')) {
                  onDelete()
                }
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm w-full transition-colors"
              style={{ color: colors.error, backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.errorBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <svg className="w-4 h-4" style={{ color: colors.white }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const iconClass = "w-12 h-12"

  if (mimeType?.startsWith('video/')) {
    return (
      <div className="p-4 rounded-xl" style={{ backgroundColor: colors.hoverBg }}>
        <svg className={iconClass} style={{ color: colors.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  if (mimeType?.startsWith('audio/')) {
    return (
      <div className="p-4 rounded-xl" style={{ backgroundColor: colors.hoverBg }}>
        <svg className={iconClass} style={{ color: colors.success }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
    )
  }

  if (mimeType === 'application/pdf') {
    return (
      <div className="p-4 rounded-xl" style={{ backgroundColor: colors.errorBg }}>
        <svg className={iconClass} style={{ color: colors.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: colors.hoverBg }}>
      <svg className={iconClass} style={{ color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  )
}
