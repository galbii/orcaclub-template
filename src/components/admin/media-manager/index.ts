/**
 * Media Manager Module
 *
 * A modern media management interface for the Payload CMS admin panel.
 * Features:
 * - Floating action button to open media library
 * - Full-screen modal with grid view
 * - Drag and drop file upload
 * - Image editor with crop, rotate, and quality controls
 * - Toast notifications for user feedback
 * - Copy public URL to clipboard
 * - Search and pagination
 */

// Main component (default export for Payload admin)
export { MediaManager, MediaManager as default } from './MediaManager'

// Individual components for custom composition
export { MediaManagerProvider, useMediaManager } from './MediaManagerProvider'
export { MediaManagerButton } from './MediaManagerButton'
export { MediaManagerModal } from './MediaManagerModal'
export { MediaGrid } from './MediaGrid'
export { FolderTree } from './FolderTree'
export { ImageEditor } from './ImageEditor'
export { ToastContainer, useToast } from './Toast'

// Types
export type {
  MediaItem,
  FolderItem,
  FolderTreeNode,
  MediaManagerState,
  MediaManagerActions,
  MediaManagerContextValue,
  UploadProgress,
  MediaApiResponse,
  FolderApiResponse,
} from './types'

export type { ToastMessage } from './Toast'
