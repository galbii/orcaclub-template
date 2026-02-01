'use client'

import { useMediaManager } from './MediaManagerProvider'
import { useEffect } from 'react'

// Explicit color constants
const colors = {
  white: '#ffffff',
  slate800: '#1e293b',
  slate900: '#0f172a',
}

/**
 * Minimal floating button to open the media manager
 * Uses all inline styles to ensure visibility in Payload admin context
 */
export function MediaManagerButton() {
  const context = useMediaManager()
  const { openModal } = context

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('[MediaManagerButton] Component mounted and rendered')
    console.log('[MediaManagerButton] Context available:', !!context)
    console.log('[MediaManagerButton] openModal function available:', !!openModal)
    console.log('[MediaManagerButton] Context keys:', Object.keys(context))
    return () => {
      console.log('[MediaManagerButton] Component unmounted')
    }
  }, [context, openModal])

  const handleClick = () => {
    console.log('[MediaManagerButton] ========== BUTTON CLICKED ==========')
    console.log('[MediaManagerButton] openModal function type:', typeof openModal)
    console.log('[MediaManagerButton] Calling openModal()...')
    try {
      openModal()
      console.log('[MediaManagerButton] openModal() called successfully')
    } catch (error) {
      console.error('[MediaManagerButton] Error calling openModal():', error)
    }
    console.log('[MediaManagerButton] ========== CLICK HANDLER COMPLETE ==========')
  }

  return (
    <button
      onClick={handleClick}
      title="Open Media Library"
      style={{
        // Positioning - all inline to ensure it works
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999, // Very high z-index to ensure visibility

        // Layout
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '56px',
        height: '56px',

        // Appearance
        backgroundColor: colors.slate900,
        border: 'none',
        borderRadius: '14px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',

        // Animation
        transition: 'all 0.2s ease',
        transform: 'scale(1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
    >
      <svg
        style={{
          width: '24px',
          height: '24px',
          color: colors.white,
        }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </button>
  )
}
