'use client'

import { useMediaManager } from './MediaManagerProvider'

// Explicit color constants
const colors = {
  white: '#ffffff',
  slate800: '#1e293b',
  slate900: '#0f172a',
}

/**
 * Minimal floating button to open the media manager
 */
export function MediaManagerButton() {
  const { openModal } = useMediaManager()

  const handleClick = () => {
    openModal()
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-[9998] flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        backgroundColor: colors.slate900,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
      title="Open Media Library"
    >
      <svg
        className="w-5 h-5"
        style={{ color: colors.white }}
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
