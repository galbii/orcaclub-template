'use client'

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react'
import type {
  MediaManagerContextValue,
  MediaManagerState,
  MediaItem,
  MediaApiResponse,
  FolderItem,
  FolderTreeNode,
  FolderApiResponse,
} from './types'
import type { ToastMessage } from './Toast'

interface ExtendedState extends MediaManagerState {
  toasts: ToastMessage[]
  editingFile: File | null
  metadataEditingFile: File | null
  editingMedia: MediaItem | null
  pendingFiles: File[]
  modalOptions: import('./types').MediaManagerModalOptions | null
}

const initialState: ExtendedState = {
  isOpen: false,
  media: [],
  isLoading: false,
  isUploading: false,
  error: null,
  selectedMedia: null,
  searchQuery: '',
  currentPage: 1,
  totalPages: 1,
  totalDocs: 0,
  toasts: [],
  editingFile: null,
  metadataEditingFile: null,
  editingMedia: null,
  pendingFiles: [],
  modalOptions: null,
  // Folder state
  folders: [],
  folderTree: [],
  currentFolder: null,
  isFoldersLoading: false,
  expandedFolders: new Set<string>(),
}

interface ExtendedContextValue extends MediaManagerContextValue {
  toasts: ToastMessage[]
  dismissToast: (id: string) => void
  showToast: (type: ToastMessage['type'], message: string) => void
  editingFile: File | null
  metadataEditingFile: File | null
  editingMedia: MediaItem | null
  pendingFiles: File[]
  modalOptions: import('./types').MediaManagerModalOptions | null
  setEditingFile: (file: File | null) => void
  setMetadataEditingFile: (file: File | null) => void
  setEditingMedia: (media: MediaItem | null) => void
  handleFilesSelected: (files: FileList | File[]) => void
  moveToMetadataEditing: (file: File) => void
  uploadWithMetadata: (file: File, metadata: any) => void
  skipEditing: () => void
}

const MediaManagerContext = createContext<ExtendedContextValue | null>(null)

/**
 * Hook to access media manager context
 */
export function useMediaManager(): ExtendedContextValue {
  const context = useContext(MediaManagerContext)
  if (!context) {
    throw new Error('useMediaManager must be used within MediaManagerProvider')
  }
  return context
}

interface MediaManagerProviderProps {
  children: ReactNode
}

/**
 * Build folder tree from flat folder list
 */
function buildFolderTree(folders: FolderItem[]): FolderTreeNode[] {
  const folderMap = new Map<string, FolderTreeNode>()
  const rootFolders: FolderTreeNode[] = []

  // First pass: create tree nodes
  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, children: [] })
  })

  // Second pass: build hierarchy
  folders.forEach((folder) => {
    const node = folderMap.get(folder.id)
    if (!node) return

    const parentId = typeof folder.folder === 'string'
      ? folder.folder
      : folder.folder?.id

    if (parentId) {
      const parent = folderMap.get(parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        rootFolders.push(node)
      }
    } else {
      rootFolders.push(node)
    }
  })

  // Sort children by name
  const sortFolders = (nodes: FolderTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    nodes.forEach((node) => sortFolders(node.children))
  }
  sortFolders(rootFolders)

  return rootFolders
}

/**
 * Provider component for media manager state and actions
 */
export function MediaManagerProvider({ children }: MediaManagerProviderProps) {
  const [state, setState] = useState<ExtendedState>(initialState)

  // Toast management
  const showToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setState(prev => ({
      ...prev,
      toasts: [...prev.toasts, { id, type, message }],
    }))
  }, [])

  const dismissToast = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      toasts: prev.toasts.filter(t => t.id !== id),
    }))
  }, [])

  // Transform API response to MediaItem format
  const transformMedia = useCallback((doc: any): MediaItem => ({
    id: doc.id,
    filename: doc.filename || '',
    alt: doc.alt || '',
    url: doc.url || '',
    publicUrl: doc.publicUrl || null,
    mimeType: doc.mimeType || '',
    filesize: doc.filesize || 0,
    width: doc.width,
    height: doc.height,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    folder: doc.folder,
    sizes: doc.sizes,
    // Extended fields
    caption: doc.caption,
    description: doc.description,
    mediaType: doc.mediaType,
    tags: doc.tags,
    featured: doc.featured,
    // Nested group fields
    videoMeta: doc.videoMeta,
    seoMeta: doc.seoMeta,
  }), [])

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    setState(prev => ({ ...prev, isFoldersLoading: true }))

    try {
      const response = await fetch('/api/payload-folders?limit=500&sort=name')

      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.statusText}`)
      }

      const data: FolderApiResponse = await response.json()
      const folderTree = buildFolderTree(data.docs)

      setState(prev => ({
        ...prev,
        folders: data.docs,
        folderTree,
        isFoldersLoading: false,
      }))
    } catch (error) {
      console.error('Failed to fetch folders:', error)
      setState(prev => ({
        ...prev,
        isFoldersLoading: false,
      }))
    }
  }, [])

  // Create folder
  const createFolder = useCallback(async (name: string, parentId?: string): Promise<FolderItem | null> => {
    try {
      const response = await fetch('/api/payload-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          folder: parentId || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create folder')
      }

      const data = await response.json()

      // Refresh folders
      await fetchFolders()

      return data.doc
    } catch (error) {
      console.error('Failed to create folder:', error)
      showToast('error', 'Failed to create folder')
      return null
    }
  }, [fetchFolders, showToast])

  // Delete folder
  const deleteFolder = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/payload-folders/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete folder')
      }

      // Refresh folders
      await fetchFolders()

      // If deleted folder was current, go to root
      setState(prev => ({
        ...prev,
        currentFolder: prev.currentFolder?.id === id ? null : prev.currentFolder,
      }))
    } catch (error) {
      console.error('Failed to delete folder:', error)
      showToast('error', 'Failed to delete folder')
    }
  }, [fetchFolders, showToast])

  // Set current folder
  const setCurrentFolder = useCallback((folder: FolderItem | null) => {
    setState(prev => ({ ...prev, currentFolder: folder, currentPage: 1 }))
  }, [])

  // Toggle folder expanded
  const toggleFolderExpanded = useCallback((folderId: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedFolders)
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId)
      } else {
        newExpanded.add(folderId)
      }
      return { ...prev, expandedFolders: newExpanded }
    })
  }, [])

  // Move media to folder
  const moveMediaToFolder = useCallback(async (mediaId: string, folderId: string | null) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: folderId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to move media')
      }

      // Refresh media in current folder view
      await fetchMedia(state.currentPage)
      showToast('success', folderId ? 'Moved to folder' : 'Moved to root')
    } catch (error) {
      console.error('Failed to move media:', error)
      showToast('error', 'Failed to move media')
    }
  }, [showToast, state.currentPage])

  // Fetch media from API
  const fetchMedia = useCallback(async (page: number = 1) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24',
        sort: '-createdAt',
        depth: '1', // Include folder relationship
      })

      // Add search filter if query exists
      if (state.searchQuery) {
        params.append('where[or][0][alt][contains]', state.searchQuery)
        params.append('where[or][1][filename][contains]', state.searchQuery)
      }

      // Add folder filter
      if (state.currentFolder) {
        params.append('where[folder][equals]', state.currentFolder.id)
      }

      const response = await fetch(`/api/media?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.statusText}`)
      }

      const data: MediaApiResponse = await response.json()

      setState(prev => ({
        ...prev,
        media: data.docs.map(transformMedia),
        currentPage: data.page,
        totalPages: data.totalPages,
        totalDocs: data.totalDocs,
        isLoading: false,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch media',
      }))
      showToast('error', 'Failed to load media')
    }
  }, [state.searchQuery, state.currentFolder, transformMedia, showToast])

  // Handle file selection - show editor for images
  const handleFilesSelected = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Filter to get image files for editing
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'))
    const otherFiles = fileArray.filter(f => !f.type.startsWith('image/'))

    // If there are non-image files, upload them directly
    if (otherFiles.length > 0) {
      uploadFilesDirectly(otherFiles)
    }

    // If there are image files, queue them for editing
    if (imageFiles.length > 0) {
      const firstFile = imageFiles[0]
      if (firstFile) {
        setState(prev => ({
          ...prev,
          pendingFiles: imageFiles,
          editingFile: firstFile,
        }))
      }
    }
  }, [])

  // Upload files directly without editing
  const uploadFilesDirectly = useCallback(async (files: File[]) => {
    setState(prev => ({ ...prev, isUploading: true, error: null }))

    const uploadPromises = files.map(async (file) => {
      console.log('📤 [UPLOAD] Starting direct upload for:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      })

      const formData = new FormData()
      formData.append('file', file)

      const altText = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())

      // Include folder if uploading to a specific folder
      const payload: Record<string, any> = { alt: altText }
      if (state.currentFolder) {
        payload.folder = state.currentFolder.id
      }

      console.log('📝 [UPLOAD] Payload data:', payload)
      formData.append('_payload', JSON.stringify(payload))

      console.log('🌐 [UPLOAD] Sending request to /api/media')
      const response = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include', // CRITICAL: Include auth cookies
        body: formData,
      })

      console.log('📨 [UPLOAD] Response status:', response.status, response.statusText)

      if (!response.ok) {
        // Log the actual error response for debugging
        const errorText = await response.text()
        console.error('❌ [UPLOAD] Upload failed for', file.name, ':', response.status, errorText)
        throw new Error(`Failed to upload ${file.name}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ [UPLOAD] Upload successful:', {
        id: result.doc?.id,
        url: result.doc?.url,
        sizes: result.doc?.sizes ? Object.keys(result.doc.sizes) : 'none',
      })

      return result
    })

    try {
      await Promise.all(uploadPromises)
      await fetchMedia(1)
      setState(prev => ({ ...prev, isUploading: false }))
      showToast('success', `Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }))
      showToast('error', errorMessage)
    }
  }, [fetchMedia, showToast, state.currentFolder])

  // Upload edited file and move to next in queue
  const uploadEditedFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isUploading: true }))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const altText = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())

      // Include folder if uploading to a specific folder
      const payload: Record<string, any> = { alt: altText }
      if (state.currentFolder) {
        payload.folder = state.currentFolder.id
      }

      formData.append('_payload', JSON.stringify(payload))

      const response = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include', // CRITICAL: Include auth cookies
        body: formData,
      })

      if (!response.ok) {
        // Log the actual error response for debugging
        const errorText = await response.text()
        console.error(`Upload failed for ${file.name}:`, response.status, errorText)
        throw new Error(`Failed to upload ${file.name}: ${response.statusText}`)
      }

      // Move to next file in queue or close editor
      setState(prev => {
        const remainingFiles = prev.pendingFiles.slice(1)
        return {
          ...prev,
          isUploading: false,
          pendingFiles: remainingFiles,
          editingFile: remainingFiles[0] || null,
        }
      })

      await fetchMedia(1)
      showToast('success', `Uploaded ${file.name}`)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState(prev => ({ ...prev, isUploading: false }))
      showToast('error', errorMessage)
    }
  }, [fetchMedia, showToast, state.currentFolder])

  // Skip editing current file
  const skipEditing = useCallback(() => {
    setState(prev => {
      const remainingFiles = prev.pendingFiles.slice(1)

      // Upload current file without editing
      if (prev.editingFile) {
        uploadFilesDirectly([prev.editingFile])
      }

      return {
        ...prev,
        pendingFiles: remainingFiles,
        editingFile: remainingFiles[0] || null,
      }
    })
  }, [uploadFilesDirectly])

  // Move from image editing to metadata editing
  const moveToMetadataEditing = useCallback((file: File) => {
    setState(prev => ({
      ...prev,
      editingFile: null,
      metadataEditingFile: file,
    }))
  }, [])

  // Upload file with metadata
  const uploadWithMetadata = useCallback(async (file: File, metadata: any) => {
    setState(prev => ({ ...prev, isUploading: true, metadataEditingFile: null }))

    try {
      console.log('📤 [UPLOAD WITH METADATA] Starting upload for:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      })

      const formData = new FormData()
      formData.append('file', file)

      // Build payload with provided metadata
      const payload: Record<string, any> = {
        alt: metadata.alt,
        mediaType: metadata.mediaType,
        featured: metadata.featured,
      }

      if (metadata.caption) payload.caption = metadata.caption
      if (metadata.description) payload.description = metadata.description
      if (metadata.tags && metadata.tags.length > 0) payload.tags = metadata.tags
      if (metadata.videoMeta) payload.videoMeta = metadata.videoMeta
      if (metadata.seoMeta) payload.seoMeta = metadata.seoMeta

      // Include folder if uploading to a specific folder
      if (state.currentFolder) {
        payload.folder = state.currentFolder.id
      }

      console.log('📝 [UPLOAD WITH METADATA] Payload data:', payload)
      formData.append('_payload', JSON.stringify(payload))

      console.log('🌐 [UPLOAD WITH METADATA] Sending request to /api/media')
      const response = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      console.log('📨 [UPLOAD WITH METADATA] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [UPLOAD WITH METADATA] Upload failed for', file.name, ':', response.status, errorText)
        throw new Error(`Failed to upload ${file.name}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ [UPLOAD WITH METADATA] Upload successful:', {
        id: result.doc?.id,
        url: result.doc?.url,
        publicUrl: result.doc?.publicUrl,
        sizes: result.doc?.sizes ? Object.keys(result.doc.sizes) : 'none',
      })

      // Move to next file in queue or close
      setState(prev => {
        const remainingFiles = prev.pendingFiles.slice(1)
        return {
          ...prev,
          isUploading: false,
          pendingFiles: remainingFiles,
          editingFile: remainingFiles[0] || null,
        }
      })

      await fetchMedia(1)
      showToast('success', `Uploaded ${file.name}`)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState(prev => ({ ...prev, isUploading: false }))
      showToast('error', errorMessage)
    }
  }, [fetchMedia, showToast, state.currentFolder])

  // Set editing file
  const setEditingFile = useCallback((file: File | null) => {
    setState(prev => ({ ...prev, editingFile: file }))
  }, [])

  // Set metadata editing file
  const setMetadataEditingFile = useCallback((file: File | null) => {
    setState(prev => ({ ...prev, metadataEditingFile: file }))
  }, [])

  // Set editing media
  const setEditingMedia = useCallback((media: MediaItem | null) => {
    setState(prev => ({ ...prev, editingMedia: media }))
  }, [])

  // Legacy upload function (now redirects to handleFilesSelected)
  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    handleFilesSelected(files)
  }, [handleFilesSelected])

  // Delete media item
  const deleteMedia = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete media')
      }

      setState(prev => ({
        ...prev,
        media: prev.media.filter(m => m.id !== id),
        selectedMedia: prev.selectedMedia?.id === id ? null : prev.selectedMedia,
      }))
      showToast('success', 'Media deleted')
    } catch (error) {
      showToast('error', 'Failed to delete media')
    }
  }, [showToast])

  // Update media item
  const updateMedia = useCallback(async (id: string, data: Record<string, unknown>): Promise<MediaItem | null> => {
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update media')
      }

      const result = await response.json()
      const updatedItem = transformMedia(result.doc || result)

      // Update the item in state
      setState(prev => ({
        ...prev,
        media: prev.media.map(m => m.id === id ? updatedItem : m),
        selectedMedia: prev.selectedMedia?.id === id ? updatedItem : prev.selectedMedia,
      }))

      showToast('success', 'Media updated')
      return updatedItem
    } catch (error) {
      showToast('error', 'Failed to update media')
      return null
    }
  }, [showToast, transformMedia])

  // Modal controls
  const openModal = useCallback((options?: import('./types').MediaManagerModalOptions) => {
    console.log('[MediaManagerProvider] openModal called with options:', options)
    setState(prev => {
      console.log('[MediaManagerProvider] Setting isOpen to true, previous state:', prev.isOpen)
      return { ...prev, isOpen: true, modalOptions: options || null }
    })
  }, [])

  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      selectedMedia: null,
      editingFile: null,
      metadataEditingFile: null,
      editingMedia: null,
      pendingFiles: [],
      modalOptions: null,
    }))
  }, [])

  // Selection and search
  const selectMedia = useCallback((media: MediaItem | null) => {
    setState(prev => ({ ...prev, selectedMedia: media }))
  }, [])

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }, [])

  // Copy URL to clipboard with toast feedback
  const copyPublicUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showToast('success', 'URL copied to clipboard')
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showToast('success', 'URL copied to clipboard')
      } catch (e) {
        showToast('error', 'Failed to copy URL')
      }
      document.body.removeChild(textArea)
    }
  }, [showToast])

  // Fetch folders and media when modal opens
  useEffect(() => {
    if (state.isOpen) {
      fetchFolders()
      fetchMedia(1)
    }
  }, [state.isOpen, fetchFolders])

  // Refetch media when search query or current folder changes
  useEffect(() => {
    if (state.isOpen) {
      fetchMedia(1)
    }
  }, [state.searchQuery, state.currentFolder, fetchMedia])

  const contextValue: ExtendedContextValue = {
    ...state,
    openModal,
    closeModal,
    fetchMedia,
    uploadFiles,
    deleteMedia,
    selectMedia,
    setSearchQuery,
    copyPublicUrl,
    dismissToast,
    showToast,
    setEditingFile,
    setMetadataEditingFile,
    setEditingMedia,
    handleFilesSelected,
    moveToMetadataEditing,
    uploadWithMetadata,
    skipEditing,
    // Folder actions
    fetchFolders,
    createFolder,
    deleteFolder,
    setCurrentFolder,
    toggleFolderExpanded,
    moveMediaToFolder,
    updateMedia,
  }

  return (
    <MediaManagerContext.Provider value={contextValue}>
      {children}
    </MediaManagerContext.Provider>
  )
}
