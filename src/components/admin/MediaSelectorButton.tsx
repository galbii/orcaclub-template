/**
 * MediaSelectorButton Component
 *
 * A custom component that integrates with Payload's upload fields to allow selecting
 * media from the custom MediaManager library. Use this with beforeInput or afterInput
 * field components to provide an alternative to drag-drop upload.
 *
 * Usage in collection config:
 * ```typescript
 * {
 *   name: 'featuredImage',
 *   type: 'upload',
 *   relationTo: 'media',
 *   admin: {
 *     components: {
 *       beforeInput: ['/components/admin/MediaSelectorButton#MediaSelectorButton'],
 *     },
 *   },
 * }
 * ```
 */
'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'
import { useMediaManager } from './media-manager/MediaManagerProvider'
import type { Media } from '@/payload-types'

/**
 * Button component for selecting media from the custom media library
 */
export const MediaSelectorButton: React.FC = () => {
  const { value, setValue } = useField<string | Media>({ path: '' })
  const { openModal, isOpen } = useMediaManager()

  const handleOpenLibrary = () => {
    console.log('[MediaSelectorButton] Opening modal in select mode')
    openModal({
      mode: 'select',
      onSelect: (media) => {
        console.log('[MediaSelectorButton] Media selected:', media.id)
        // Set the field value to the selected media ID
        setValue(media.id)
      },
    })
    console.log('[MediaSelectorButton] Modal state after open:', isOpen)
  }

  return (
    <div className="media-selector-button-wrapper" style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={handleOpenLibrary}
        className="btn btn--style-secondary btn--size-medium"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Browse Media Library</span>
      </button>
      {typeof value === 'string' && value && (
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--theme-success-500)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
          Media selected from library
        </p>
      )}
    </div>
  )
}
