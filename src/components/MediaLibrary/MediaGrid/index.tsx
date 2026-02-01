'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { usePayloadAPI } from '@payloadcms/ui'
import type { Media } from '@/payload-types'

/**
 * Paginated response from Payload API
 */
interface PaginatedDocs {
  docs: Media[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

/**
 * Props for the MediaGrid component
 */
interface MediaGridProps {
  /** Callback when a media item is selected */
  onSelect: (media: Media) => void
  /** ID of the currently selected media item */
  selectedId?: string
}

/**
 * MIME type filter options
 */
type MimeTypeFilter = 'all' | 'images' | 'videos' | 'documents'

const MIME_TYPE_FILTERS: Record<MimeTypeFilter, string | null> = {
  all: null,
  images: 'image',
  videos: 'video',
  documents: 'application',
}

const ITEMS_PER_PAGE = 12

/**
 * Styles object using Payload CSS variables for theming
 */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--base)',
    padding: 'var(--base)',
    backgroundColor: 'var(--theme-elevation-0)',
    borderRadius: 'var(--border-radius-m)',
    border: '1px solid var(--theme-elevation-150)',
  },
  controls: {
    display: 'flex',
    gap: 'var(--base)',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  searchInput: {
    flex: '1 1 200px',
    minWidth: '200px',
    padding: 'calc(var(--base) * 0.5) var(--base)',
    fontSize: '14px',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 'var(--border-radius-s)',
    backgroundColor: 'var(--theme-elevation-50)',
    color: 'var(--theme-text)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  filterSelect: {
    padding: 'calc(var(--base) * 0.5) var(--base)',
    fontSize: '14px',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 'var(--border-radius-s)',
    backgroundColor: 'var(--theme-elevation-50)',
    color: 'var(--theme-text)',
    cursor: 'pointer',
    minWidth: '140px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 'var(--base)',
    minHeight: '200px',
  },
  mediaItem: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    border: '2px solid var(--theme-elevation-150)',
    borderRadius: 'var(--border-radius-m)',
    overflow: 'hidden',
    cursor: 'pointer',
    backgroundColor: 'var(--theme-elevation-50)',
    transition: 'border-color 0.15s ease, transform 0.15s ease',
  },
  mediaItemSelected: {
    borderColor: 'var(--theme-success-500)',
  },
  mediaItemHover: {
    borderColor: 'var(--theme-elevation-400)',
  },
  thumbnailContainer: {
    position: 'relative' as const,
    aspectRatio: '1',
    backgroundColor: 'var(--theme-elevation-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  placeholderIcon: {
    fontSize: '32px',
    color: 'var(--theme-elevation-400)',
  },
  checkmark: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--theme-success-500)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  filename: {
    padding: 'calc(var(--base) * 0.5)',
    fontSize: '12px',
    color: 'var(--theme-text)',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
    borderTop: '1px solid var(--theme-elevation-150)',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--base)',
    paddingTop: 'var(--base)',
    borderTop: '1px solid var(--theme-elevation-150)',
  },
  paginationButton: {
    padding: 'calc(var(--base) * 0.5) var(--base)',
    fontSize: '14px',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 'var(--border-radius-s)',
    backgroundColor: 'var(--theme-elevation-50)',
    color: 'var(--theme-text)',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  pageInfo: {
    fontSize: '14px',
    color: 'var(--theme-elevation-500)',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    color: 'var(--theme-elevation-500)',
    fontSize: '14px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: 'var(--base)',
    color: 'var(--theme-error-500)',
    fontSize: '14px',
  },
  emptyContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    color: 'var(--theme-elevation-500)',
    fontSize: '14px',
  },
  retryButton: {
    padding: 'calc(var(--base) * 0.5) var(--base)',
    fontSize: '14px',
    border: '1px solid var(--theme-error-500)',
    borderRadius: 'var(--border-radius-s)',
    backgroundColor: 'transparent',
    color: 'var(--theme-error-500)',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
}

/**
 * Get the thumbnail URL for a media item
 * Supports both S3 storage (thumbnailURL field) and local storage (sizes.thumbnail.url)
 */
function getThumbnailUrl(media: Media): string | null {
  // S3/cloud storage populates thumbnailURL field directly
  if (media.thumbnailURL) {
    return media.thumbnailURL
  }
  // Local storage uses sizes object
  if (media.sizes?.thumbnail?.url) {
    return media.sizes.thumbnail.url
  }
  // Fall back to the main URL for images
  if (media.mimeType?.startsWith('image') && media.url) {
    return media.url
  }
  return null
}

/**
 * Get the icon for non-image media types
 */
function getMediaTypeIcon(mimeType: string): string {
  if (mimeType?.startsWith('video')) return '\u{1F3AC}' // Video camera icon
  if (mimeType?.startsWith('audio')) return '\u{1F3B5}' // Music note icon
  if (mimeType?.includes('pdf')) return '\u{1F4C4}' // Document icon
  if (mimeType?.includes('word') || mimeType?.includes('document')) return '\u{1F4DD}' // Memo icon
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return '\u{1F4CA}' // Chart icon
  return '\u{1F4C1}' // File folder icon
}

/**
 * MediaGrid component for displaying and selecting media from the Payload CMS media library
 */
export const MediaGrid: React.FC<MediaGridProps> = ({ onSelect, selectedId }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [mimeTypeFilter, setMimeTypeFilter] = useState<MimeTypeFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Build the API URL with query parameters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set('limit', String(ITEMS_PER_PAGE))
    params.set('page', String(currentPage))
    params.set('sort', '-createdAt')

    // Build where clause for search and filter
    const whereConditions: string[] = []

    // Search by filename or alt text
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.trim()
      whereConditions.push(
        `or[0][filename][contains]=${encodeURIComponent(searchTerm)}`,
        `or[1][alt][contains]=${encodeURIComponent(searchTerm)}`,
      )
    }

    // Filter by MIME type
    const mimeTypePrefix = MIME_TYPE_FILTERS[mimeTypeFilter]
    if (mimeTypePrefix) {
      whereConditions.push(`where[mimeType][contains]=${encodeURIComponent(mimeTypePrefix)}`)
    }

    // Construct the full URL
    let url = `/api/media?${params.toString()}`
    if (whereConditions.length > 0) {
      url += '&' + whereConditions.join('&')
    }

    return url
  }, [searchQuery, mimeTypeFilter, currentPage])

  // Fetch media data using Payload API
  const [{ data, isError, isLoading }, { setParams }] = usePayloadAPI(apiUrl, {
    initialParams: {},
  })

  // Cast data to our expected type
  const paginatedData = data as PaginatedDocs | undefined

  // Handle search input change with debounce effect
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page on search
  }, [])

  // Handle MIME type filter change
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMimeTypeFilter(e.target.value as MimeTypeFilter)
    setCurrentPage(1) // Reset to first page on filter change
  }, [])

  // Handle media item selection
  const handleSelect = useCallback(
    (media: Media) => {
      onSelect(media)
    },
    [onSelect],
  )

  // Handle pagination
  const handlePrevPage = useCallback(() => {
    if (paginatedData?.hasPrevPage) {
      setCurrentPage((prev) => prev - 1)
    }
  }, [paginatedData?.hasPrevPage])

  const handleNextPage = useCallback(() => {
    if (paginatedData?.hasNextPage) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [paginatedData?.hasNextPage])

  // Handle retry on error
  const handleRetry = useCallback(() => {
    setParams({ cacheBust: Date.now() })
  }, [setParams])

  // Render loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading media...</div>
      </div>
    )
  }

  // Render error state
  if (isError) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <span>Failed to load media library</span>
          <button
            style={styles.retryButton}
            onClick={handleRetry}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-error-100)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const mediaItems = paginatedData?.docs || []
  const totalPages = paginatedData?.totalPages || 1
  const currentPageNum = paginatedData?.page || 1

  return (
    <div style={styles.container}>
      {/* Search and Filter Controls */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search by filename or alt text..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={styles.searchInput}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--theme-elevation-400)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--theme-elevation-150)'
          }}
        />
        <select value={mimeTypeFilter} onChange={handleFilterChange} style={styles.filterSelect}>
          <option value="all">All Types</option>
          <option value="images">Images</option>
          <option value="videos">Videos</option>
          <option value="documents">Documents</option>
        </select>
      </div>

      {/* Media Grid */}
      {mediaItems.length === 0 ? (
        <div style={styles.emptyContainer}>
          {searchQuery || mimeTypeFilter !== 'all'
            ? 'No media found matching your criteria'
            : 'No media uploaded yet'}
        </div>
      ) : (
        <div style={styles.grid}>
          {mediaItems.map((media) => {
            const isSelected = selectedId === media.id
            const isHovered = hoveredId === media.id
            const thumbnailUrl = getThumbnailUrl(media)

            return (
              <div
                key={media.id}
                onClick={() => handleSelect(media)}
                onMouseEnter={() => setHoveredId(media.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  ...styles.mediaItem,
                  ...(isSelected ? styles.mediaItemSelected : {}),
                  ...(isHovered && !isSelected ? styles.mediaItemHover : {}),
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(media)
                  }
                }}
                aria-selected={isSelected}
                aria-label={`Select ${media.filename || 'media'}`}
              >
                <div style={styles.thumbnailContainer}>
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={media.alt || media.filename || 'Media thumbnail'}
                      style={styles.thumbnail}
                      loading="lazy"
                    />
                  ) : (
                    <span style={styles.placeholderIcon}>
                      {getMediaTypeIcon(media.mimeType || '')}
                    </span>
                  )}
                  {isSelected && (
                    <div style={styles.checkmark} aria-hidden="true">
                      &#10003;
                    </div>
                  )}
                </div>
                <div style={styles.filename} title={media.filename || 'Untitled'}>
                  {media.filename || 'Untitled'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={handlePrevPage}
            disabled={!paginatedData?.hasPrevPage}
            style={{
              ...styles.paginationButton,
              ...(paginatedData?.hasPrevPage ? {} : styles.paginationButtonDisabled),
            }}
            onMouseEnter={(e) => {
              if (paginatedData?.hasPrevPage) {
                e.currentTarget.style.backgroundColor = 'var(--theme-elevation-100)'
                e.currentTarget.style.borderColor = 'var(--theme-elevation-300)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-elevation-50)'
              e.currentTarget.style.borderColor = 'var(--theme-elevation-150)'
            }}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPageNum} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!paginatedData?.hasNextPage}
            style={{
              ...styles.paginationButton,
              ...(paginatedData?.hasNextPage ? {} : styles.paginationButtonDisabled),
            }}
            onMouseEnter={(e) => {
              if (paginatedData?.hasNextPage) {
                e.currentTarget.style.backgroundColor = 'var(--theme-elevation-100)'
                e.currentTarget.style.borderColor = 'var(--theme-elevation-300)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-elevation-50)'
              e.currentTarget.style.borderColor = 'var(--theme-elevation-150)'
            }}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default MediaGrid
