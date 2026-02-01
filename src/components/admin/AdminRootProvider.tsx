'use client'

import { MediaManagerProvider } from './media-manager/MediaManagerProvider'
import { MediaManagerModal } from './media-manager/MediaManagerModal'
import { MediaManagerButton } from './media-manager/MediaManagerButton'

/**
 * Root provider that wraps the entire admin interface
 * This ensures the Media Manager context is available everywhere in the admin UI
 *
 * Usage: Add this component to the admin.components.providers array in payload.config.ts
 *
 * ```typescript
 * admin: {
 *   components: {
 *     providers: ['/components/admin/AdminRootProvider#AdminRootProvider'],
 *   },
 * }
 * ```
 */
export function AdminRootProvider({ children }: { children: React.ReactNode }) {
  return (
    <MediaManagerProvider>
      {children}
      {/* Media Manager Modal - rendered globally, controlled by context */}
      <MediaManagerModal />
      {/* Floating Action Button - always available in admin */}
      <MediaManagerButton />
    </MediaManagerProvider>
  )
}
