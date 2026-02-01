/**
 * Admin Root Provider
 *
 * Wraps the entire Payload admin UI with necessary providers.
 * This ensures all admin components have access to shared context.
 *
 * IMPORTANT: This provider renders both the MediaManagerModal and MediaManagerButton globally,
 * ensuring they're available on all admin pages (dashboard, edit views, list views, etc.)
 *
 * Usage in payload.config.ts:
 * ```typescript
 * admin: {
 *   components: {
 *     providers: ['/components/admin/AdminRootProvider#AdminRootProvider'],
 *   }
 * }
 * ```
 */
'use client'

import React, { useEffect } from 'react'
import { MediaManagerProvider } from './media-manager/MediaManagerProvider'
import { MediaManagerModal } from './media-manager/MediaManagerModal'
import { MediaManagerButton } from './media-manager/MediaManagerButton'

interface AdminRootProviderProps {
  children: React.ReactNode
}

export const AdminRootProvider: React.FC<AdminRootProviderProps> = ({ children }) => {
  // Debug: Log when provider mounts
  useEffect(() => {
    console.log('[AdminRootProvider] Provider mounted - Media Manager initialized')
  }, [])

  return (
    <MediaManagerProvider>
      {children}
      {/* Modal and Button are rendered here so they're available on ALL admin pages */}
      <MediaManagerModal />
      <MediaManagerButton />
    </MediaManagerProvider>
  )
}
