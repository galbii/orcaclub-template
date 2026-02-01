/**
 * Media Manager Types
 * Type definitions for the admin media manager component
 */

import type { Media } from '@/payload-types'

/**
 * Folder item representing a Payload folder
 */
export interface FolderItem {
  id: string
  name: string
  folder?: string | FolderItem | null // Parent folder (nested)
  createdAt: string
  updatedAt: string
}

/**
 * Folder with nested children for tree display
 */
export interface FolderTreeNode extends FolderItem {
  children: FolderTreeNode[]
  isExpanded?: boolean
}

export interface MediaItem {
  id: string
  filename: string
  alt: string
  url: string
  publicUrl: string | null
  mimeType: string
  filesize: number
  width?: number
  height?: number
  createdAt: string
  updatedAt: string
  folder?: string | FolderItem | null // Folder relationship
  // Extended fields from Media collection
  caption?: string
  description?: string
  mediaType?: 'image' | 'video' | 'audio' | 'document'
  tags?: string[]
  featured?: boolean
  // Video-specific metadata (nested group)
  videoMeta?: {
    duration?: number
    autoplay?: boolean
    muted?: boolean
  }
  // SEO and technical metadata (nested group)
  seoMeta?: {
    focusKeywords?: string
    photographerCredit?: string
    copyrightInfo?: string
    originalSource?: string
  }
  sizes?: {
    thumbnail?: { url: string; width: number; height: number }
    card?: { url: string; width: number; height: number }
    tablet?: { url: string; width: number; height: number }
    desktop?: { url: string; width: number; height: number }
  }
}

export interface MediaManagerState {
  isOpen: boolean
  media: MediaItem[]
  isLoading: boolean
  isUploading: boolean
  error: string | null
  selectedMedia: MediaItem | null
  searchQuery: string
  currentPage: number
  totalPages: number
  totalDocs: number
  // Folder state
  folders: FolderItem[]
  folderTree: FolderTreeNode[]
  currentFolder: FolderItem | null // null = root/all media
  isFoldersLoading: boolean
  expandedFolders: Set<string>
}

export interface MediaManagerActions {
  openModal: (options?: MediaManagerModalOptions) => void
  closeModal: () => void
  fetchMedia: (page?: number) => Promise<void>
  uploadFiles: (files: FileList | File[]) => Promise<void>
  deleteMedia: (id: string) => Promise<void>
  selectMedia: (media: MediaItem | null) => void
  setSearchQuery: (query: string) => void
  copyPublicUrl: (url: string) => Promise<void>
  // Folder actions
  fetchFolders: () => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<FolderItem | null>
  deleteFolder: (id: string) => Promise<void>
  setCurrentFolder: (folder: FolderItem | null) => void
  toggleFolderExpanded: (folderId: string) => void
  moveMediaToFolder: (mediaId: string, folderId: string | null) => Promise<void>
  updateMedia: (id: string, data: Record<string, unknown>) => Promise<MediaItem | null>
}

/**
 * Options for opening media manager modal
 */
export interface MediaManagerModalOptions {
  mode?: 'browse' | 'select' // Browse mode = general library, Select mode = field selector
  onSelect?: (media: MediaItem) => void // Callback when media is selected in select mode
  allowMultiple?: boolean // Future: allow multi-select
  filterMimeType?: string // Filter by mime type (e.g., 'image/', 'video/')
}

export interface MediaManagerContextValue extends MediaManagerState, MediaManagerActions {}

export interface UploadProgress {
  filename: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

export interface MediaApiResponse {
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

export interface FolderApiResponse {
  docs: FolderItem[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  hasPrevPage: boolean
  hasNextPage: boolean
}
