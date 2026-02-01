'use client'

import { MediaManagerButton } from './MediaManagerButton'

/**
 * Media Manager Dashboard Component
 *
 * This component provides a floating button to open the media manager modal.
 * The modal itself is rendered at the root level (in AdminRootProvider) so it's
 * available on all admin pages, not just the dashboard.
 *
 * This component is mounted via afterDashboard and provides quick access to the
 * media library from the dashboard view.
 *
 * NOTE: Both MediaManagerProvider and MediaManagerModal are provided at the root level
 * via AdminRootProvider, so this component only needs to render the button.
 *
 * Usage in payload.config.ts:
 * ```ts
 * admin: {
 *   components: {
 *     afterDashboard: ['/components/admin/media-manager/MediaManager'],
 *   }
 * }
 * ```
 */
export function MediaManager() {
  return <MediaManagerButton />
}

export default MediaManager
