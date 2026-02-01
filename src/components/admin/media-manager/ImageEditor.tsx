'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// Explicit color constants to avoid Payload theme conflicts
const colors = {
  white: '#ffffff',
  black: '#000000',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0f172a',
  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  blue600: '#2563eb',
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageEditorProps {
  file: File
  onSave: (editedFile: File) => void
  onCancel: () => void
}

/**
 * Simple image editor with crop, rotate, and quality controls
 * Scales consistently to fill available space
 */
export function ImageEditor({ file, onSave, onCancel }: ImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 })

  const [rotation, setRotation] = useState(0)
  const [quality, setQuality] = useState(85)

  // Crop state (in display coordinates)
  const [crop, setCrop] = useState<CropArea | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [isProcessing, setIsProcessing] = useState(false)

  // Load image and get its dimensions
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)

    // Load image to get dimensions BEFORE rendering
    // This breaks the circular dependency where the img element
    // only renders when displayDimensions > 0, but dimensions
    // are only set via onLoad which requires the img to render
    const img = new Image()
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.src = url

    return () => URL.revokeObjectURL(url)
  }, [file])

  // Measure container size
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        // Account for padding (32px on each side)
        setContainerSize({
          width: rect.width - 64,
          height: rect.height - 64,
        })
      }
    }

    updateContainerSize()
    window.addEventListener('resize', updateContainerSize)
    return () => window.removeEventListener('resize', updateContainerSize)
  }, [])

  // Calculate display dimensions when image loads or container resizes
  const calculateDisplayDimensions = useCallback(() => {
    if (!imageDimensions.width || !imageDimensions.height) return

    const maxWidth = Math.min(containerSize.width, 900)
    const maxHeight = Math.min(containerSize.height, 600)

    const imageRatio = imageDimensions.width / imageDimensions.height
    const containerRatio = maxWidth / maxHeight

    let displayWidth: number
    let displayHeight: number

    if (imageRatio > containerRatio) {
      // Image is wider than container ratio - fit to width
      displayWidth = maxWidth
      displayHeight = maxWidth / imageRatio
    } else {
      // Image is taller than container ratio - fit to height
      displayHeight = maxHeight
      displayWidth = maxHeight * imageRatio
    }

    // Ensure minimum size
    displayWidth = Math.max(displayWidth, 200)
    displayHeight = Math.max(displayHeight, 200)

    setDisplayDimensions({
      width: Math.round(displayWidth),
      height: Math.round(displayHeight),
    })

    // Reset crop to full image when dimensions change
    setCrop({
      x: 0,
      y: 0,
      width: Math.round(displayWidth),
      height: Math.round(displayHeight),
    })
  }, [imageDimensions, containerSize])

  useEffect(() => {
    calculateDisplayDimensions()
  }, [calculateDisplayDimensions])

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return

    const img = imageRef.current
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    })
  }, [])

  // Get mouse position relative to image
  const getMousePosition = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current) return { x: 0, y: 0 }

    const rect = imageRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, displayDimensions.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, displayDimensions.height)),
    }
  }, [displayDimensions])

  // Mouse handlers for crop selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pos = getMousePosition(e)
    setIsDragging(true)
    setDragStart(pos)
    setCrop({ x: pos.x, y: pos.y, width: 0, height: 0 })
  }, [getMousePosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return

    const pos = getMousePosition(e)

    const newCrop = {
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      width: Math.abs(pos.x - dragStart.x),
      height: Math.abs(pos.y - dragStart.y),
    }

    setCrop(newCrop)
  }, [isDragging, dragStart, getMousePosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)

    // If crop is too small, reset to full image
    if (crop && (crop.width < 20 || crop.height < 20)) {
      setCrop({ x: 0, y: 0, width: displayDimensions.width, height: displayDimensions.height })
    }
  }, [crop, displayDimensions])

  // Rotate
  const rotate = useCallback((degrees: number) => {
    setRotation((prev) => (prev + degrees + 360) % 360)
  }, [])

  // Reset crop
  const resetCrop = useCallback(() => {
    setCrop({ x: 0, y: 0, width: displayDimensions.width, height: displayDimensions.height })
  }, [displayDimensions])

  // Process and save
  const handleSave = useCallback(async () => {
    if (!crop || !imageRef.current) return

    setIsProcessing(true)

    try {
      // Calculate scale from display to original
      const scaleX = imageDimensions.width / displayDimensions.width
      const scaleY = imageDimensions.height / displayDimensions.height

      // Convert crop from display coordinates to original image coordinates
      const originalCrop = {
        x: Math.round(crop.x * scaleX),
        y: Math.round(crop.y * scaleY),
        width: Math.round(crop.width * scaleX),
        height: Math.round(crop.height * scaleY),
      }

      // Ensure crop is within bounds
      originalCrop.x = Math.max(0, Math.min(originalCrop.x, imageDimensions.width - 1))
      originalCrop.y = Math.max(0, Math.min(originalCrop.y, imageDimensions.height - 1))
      originalCrop.width = Math.min(originalCrop.width, imageDimensions.width - originalCrop.x)
      originalCrop.height = Math.min(originalCrop.height, imageDimensions.height - originalCrop.y)

      // Create a new image element for processing
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = imageUrl
      })

      // Step 1: Create canvas for rotation (if needed)
      let sourceCanvas: HTMLCanvasElement
      let sourceCtx: CanvasRenderingContext2D | null

      if (rotation !== 0) {
        // For 90/270 rotation, swap dimensions
        const swap = rotation === 90 || rotation === 270
        const rotatedWidth = swap ? img.height : img.width
        const rotatedHeight = swap ? img.width : img.height

        sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = rotatedWidth
        sourceCanvas.height = rotatedHeight
        sourceCtx = sourceCanvas.getContext('2d')

        if (!sourceCtx) throw new Error('Could not get canvas context')

        // Rotate around center
        sourceCtx.translate(rotatedWidth / 2, rotatedHeight / 2)
        sourceCtx.rotate((rotation * Math.PI) / 180)
        sourceCtx.translate(-img.width / 2, -img.height / 2)
        sourceCtx.drawImage(img, 0, 0)
      } else {
        // No rotation - draw original image
        sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = img.width
        sourceCanvas.height = img.height
        sourceCtx = sourceCanvas.getContext('2d')

        if (!sourceCtx) throw new Error('Could not get canvas context')
        sourceCtx.drawImage(img, 0, 0)
      }

      // Step 2: Crop from the (potentially rotated) source
      // Adjust crop coordinates if rotated
      let finalCrop = { ...originalCrop }

      if (rotation === 90) {
        finalCrop = {
          x: originalCrop.y,
          y: imageDimensions.width - originalCrop.x - originalCrop.width,
          width: originalCrop.height,
          height: originalCrop.width,
        }
      } else if (rotation === 180) {
        finalCrop = {
          x: imageDimensions.width - originalCrop.x - originalCrop.width,
          y: imageDimensions.height - originalCrop.y - originalCrop.height,
          width: originalCrop.width,
          height: originalCrop.height,
        }
      } else if (rotation === 270) {
        finalCrop = {
          x: imageDimensions.height - originalCrop.y - originalCrop.height,
          y: originalCrop.x,
          width: originalCrop.height,
          height: originalCrop.width,
        }
      }

      // Ensure final crop is valid
      finalCrop.x = Math.max(0, finalCrop.x)
      finalCrop.y = Math.max(0, finalCrop.y)
      finalCrop.width = Math.max(1, Math.min(finalCrop.width, sourceCanvas.width - finalCrop.x))
      finalCrop.height = Math.max(1, Math.min(finalCrop.height, sourceCanvas.height - finalCrop.y))

      // Create output canvas with crop dimensions
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = finalCrop.width
      outputCanvas.height = finalCrop.height
      const outputCtx = outputCanvas.getContext('2d')

      if (!outputCtx) throw new Error('Could not get output canvas context')

      // Draw cropped region
      outputCtx.drawImage(
        sourceCanvas,
        finalCrop.x, finalCrop.y, finalCrop.width, finalCrop.height,
        0, 0, finalCrop.width, finalCrop.height
      )

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
          'image/jpeg',
          quality / 100
        )
      })

      // Create new file
      const editedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })

      onSave(editedFile)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Failed to process image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [crop, rotation, quality, imageUrl, imageDimensions, displayDimensions, file.name, onSave])

  // Calculate crop info for display
  const getCropInfo = () => {
    if (!crop || !displayDimensions.width) return null

    const scaleX = imageDimensions.width / displayDimensions.width
    const scaleY = imageDimensions.height / displayDimensions.height

    return {
      width: Math.round(crop.width * scaleX),
      height: Math.round(crop.height * scaleY),
    }
  }

  const cropInfo = getCropInfo()

  return (
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[900px] flex flex-col overflow-hidden"
        style={{ backgroundColor: colors.white }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-6 py-4 border-b"
          style={{
            borderColor: colors.slate100,
            background: `linear-gradient(to right, ${colors.slate50}, ${colors.white})`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl" style={{ backgroundColor: colors.indigo100 }}>
                <svg className="w-6 h-6" style={{ color: colors.indigo600 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: colors.slate900 }}>Edit Image</h3>
                <p className="text-sm truncate max-w-sm" style={{ color: colors.slate500 }}>{file.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {imageDimensions.width > 0 && (
                <span className="text-sm" style={{ color: colors.slate400 }}>
                  Original: {imageDimensions.width} × {imageDimensions.height}px
                </span>
              )}
              <button
                onClick={onCancel}
                className="p-2 rounded-lg transition-colors"
                style={{ color: colors.slate400 }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Image area - takes remaining space */}
        <div
          ref={containerRef}
          className="flex-1 relative flex items-center justify-center p-8 overflow-hidden"
          style={{ backgroundColor: colors.slate900 }}
        >
          {imageUrl && displayDimensions.width > 0 ? (
            <div
              className="relative select-none cursor-crosshair"
              style={{
                width: displayDimensions.width,
                height: displayDimensions.height,
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Image */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Preview"
                onLoad={handleImageLoad}
                className="block rounded-lg shadow-2xl"
                style={{
                  width: displayDimensions.width,
                  height: displayDimensions.height,
                }}
                draggable={false}
              />

              {/* Crop selection with shadow overlay */}
              {crop && (
                <div
                  className="absolute border-2 border-white pointer-events-none"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: Math.max(crop.width, 1),
                    height: Math.max(crop.height, 1),
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {/* Corner handles */}
                  {crop.width > 30 && crop.height > 30 && (
                    <>
                      <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-indigo-500" />
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-indigo-500" />
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-indigo-500" />
                      <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-indigo-500" />

                      {/* Rule of thirds grid */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
                        <div className="absolute right-1/3 top-0 bottom-0 w-px bg-white/40" />
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
                        <div className="absolute bottom-1/3 left-0 right-0 h-px bg-white/40" />
                      </div>
                    </>
                  )}

                  {/* Crop dimensions label */}
                  {crop.width > 60 && crop.height > 40 && cropInfo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="px-2 py-1 bg-black/70 rounded text-white text-xs font-mono">
                        {cropInfo.width} × {cropInfo.height}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
            </div>
          )}

          {/* Instructions overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full">
            <p className="text-white/90 text-sm font-medium">Click and drag to select crop area</p>
          </div>

          {/* Rotation indicator */}
          {rotation !== 0 && (
            <div
              className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: colors.indigo600 }}
            >
              <p className="text-sm font-medium" style={{ color: colors.white }}>{rotation}° rotation</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          className="flex-shrink-0 px-6 py-4 border-t"
          style={{ backgroundColor: colors.slate50, borderColor: colors.slate200 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Rotation */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: colors.slate700 }}>Rotate:</span>
                <div
                  className="flex items-center rounded-lg border shadow-sm"
                  style={{ backgroundColor: colors.white, borderColor: colors.slate200 }}
                >
                  <button
                    onClick={() => rotate(-90)}
                    className="p-2.5 rounded-l-lg transition-colors border-r"
                    style={{ color: colors.slate600, borderColor: colors.slate200 }}
                    title="Rotate left 90°"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => rotate(90)}
                    className="p-2.5 rounded-r-lg transition-colors"
                    style={{ color: colors.slate600 }}
                    title="Rotate right 90°"
                  >
                    <svg className="w-5 h-5 scale-x-[-1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Quality slider */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: colors.slate700 }}>Quality:</span>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm"
                  style={{ backgroundColor: colors.white, borderColor: colors.slate200 }}
                >
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-32 h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: colors.indigo600 }}
                  />
                  <span className="text-sm font-mono w-10 text-right" style={{ color: colors.slate700 }}>{quality}%</span>
                </div>
              </div>

              {/* Reset crop */}
              <button
                onClick={resetCrop}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors border shadow-sm"
                style={{
                  color: colors.slate600,
                  backgroundColor: colors.white,
                  borderColor: colors.slate200,
                }}
              >
                Reset Crop
              </button>
            </div>

            {/* Output info */}
            {cropInfo && (
              <div className="text-sm" style={{ color: colors.slate500 }}>
                Output: <span className="font-mono font-medium" style={{ color: colors.slate700 }}>{cropInfo.width} × {cropInfo.height}px</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 py-4 border-t flex items-center justify-between"
          style={{ backgroundColor: colors.white, borderColor: colors.slate200 }}
        >
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: colors.slate600 }}
          >
            Skip Editing
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing || !crop}
            className="px-8 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            style={{
              color: colors.white,
              background: `linear-gradient(to right, ${colors.indigo600}, ${colors.blue600})`,
            }}
          >
            {isProcessing ? (
              <>
                <div
                  className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent"
                  style={{ borderColor: colors.white, borderTopColor: 'transparent' }}
                />
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply & Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
