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
  console.log('📸 [IMAGE EDITOR] Component function called with file:', file.name)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Log when component actually renders to DOM
  useEffect(() => {
    console.log('✅ [IMAGE EDITOR] Component mounted to DOM!')
    return () => {
      console.log('❌ [IMAGE EDITOR] Component unmounting from DOM')
    }
  }, [])

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
    console.log('📸 [IMAGE EDITOR] Loading file:', file.name)
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    console.log('📸 [IMAGE EDITOR] Image URL created:', url)

    // Load image to get dimensions BEFORE rendering
    const img = new Image()
    img.onload = () => {
      console.log('📸 [IMAGE EDITOR] Image loaded:', {
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = (e) => {
      console.error('❌ [IMAGE EDITOR] Image load error:', e)
    }
    img.src = url

    return () => {
      console.log('📸 [IMAGE EDITOR] Cleaning up URL')
      URL.revokeObjectURL(url)
    }
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
    console.log('📸 [IMAGE EDITOR] calculateDisplayDimensions called:', {
      imageDimensions,
      containerSize,
    })

    if (!imageDimensions.width || !imageDimensions.height) {
      console.log('❌ [IMAGE EDITOR] No image dimensions yet, skipping calculation')
      return
    }

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

    console.log('📸 [IMAGE EDITOR] Calculated display dimensions:', {
      displayWidth: Math.round(displayWidth),
      displayHeight: Math.round(displayHeight),
    })

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

  console.log('📸 [IMAGE EDITOR] Render state:', {
    imageUrl,
    displayWidth: displayDimensions.width,
    displayHeight: displayDimensions.height,
    imageWidth: imageDimensions.width,
    imageHeight: imageDimensions.height,
    shouldShowImage: !!(imageUrl && displayDimensions.width > 0),
  })

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: '1200px',
          height: '90vh',
          maxHeight: '900px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 24px',
            borderBottom: `1px solid ${colors.slate100}`,
            background: `linear-gradient(to right, ${colors.slate50}, ${colors.white})`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: colors.indigo100 }}>
                <svg style={{ width: '24px', height: '24px', color: colors.indigo600 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.slate900, margin: 0 }}>Edit Image</h3>
                <p style={{ fontSize: '14px', color: colors.slate500, margin: '2px 0 0 0', maxWidth: '384px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {imageDimensions.width > 0 && (
                <span style={{ fontSize: '14px', color: colors.slate400 }}>
                  Original: {imageDimensions.width} × {imageDimensions.height}px
                </span>
              )}
              <button
                onClick={onCancel}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.slate400,
                  cursor: 'pointer',
                }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Image area - takes remaining space */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            overflow: 'hidden',
            backgroundColor: colors.slate900,
          }}
        >
          {imageUrl && displayDimensions.width > 0 ? (
            <div
              style={{
                position: 'relative',
                userSelect: 'none',
                cursor: 'crosshair',
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
                style={{
                  display: 'block',
                  borderRadius: '8px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  width: displayDimensions.width,
                  height: displayDimensions.height,
                }}
                draggable={false}
              />

              {/* Crop selection with shadow overlay */}
              {crop && (
                <div
                  style={{
                    position: 'absolute',
                    border: '2px solid white',
                    pointerEvents: 'none',
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
                      <div style={{ position: 'absolute', top: '-8px', left: '-8px', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '9999px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: `2px solid ${colors.indigo500}` }} />
                      <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '9999px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: `2px solid ${colors.indigo500}` }} />
                      <div style={{ position: 'absolute', bottom: '-8px', left: '-8px', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '9999px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: `2px solid ${colors.indigo500}` }} />
                      <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '9999px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: `2px solid ${colors.indigo500}` }} />

                      {/* Rule of thirds grid */}
                      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', left: '33.333%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', right: '33.333%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', top: '33.333%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '33.333%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.4)' }} />
                      </div>
                    </>
                  )}

                  {/* Crop dimensions label */}
                  {crop.width > 60 && crop.height > 40 && cropInfo && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '0.25rem', color: 'white', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {cropInfo.width} × {cropInfo.height}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
          )}

          {/* Instructions overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              borderRadius: '9999px',
            }}
          >
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', fontWeight: 500, margin: 0 }}>
              Click and drag to select crop area
            </p>
          </div>

          {/* Rotation indicator */}
          {rotation !== 0 && (
            <div
              style={{
                position: 'absolute',
                top: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 12px',
                borderRadius: '9999px',
                backgroundColor: colors.indigo600,
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 500, color: colors.white, margin: 0 }}>
                {rotation}° rotation
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 24px',
            borderTop: `1px solid ${colors.slate200}`,
            backgroundColor: colors.slate50,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Rotation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: colors.slate700 }}>Rotate:</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '8px',
                    border: `1px solid ${colors.slate200}`,
                    backgroundColor: colors.white,
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <button
                    onClick={() => rotate(-90)}
                    style={{
                      padding: '10px',
                      borderTopLeftRadius: '8px',
                      borderBottomLeftRadius: '8px',
                      borderRight: `1px solid ${colors.slate200}`,
                      backgroundColor: 'transparent',
                      color: colors.slate600,
                      cursor: 'pointer',
                      border: 'none',
                      borderRight: `1px solid ${colors.slate200}`,
                    }}
                    title="Rotate left 90°"
                  >
                    <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => rotate(90)}
                    style={{
                      padding: '10px',
                      borderTopRightRadius: '8px',
                      borderBottomRightRadius: '8px',
                      backgroundColor: 'transparent',
                      color: colors.slate600,
                      cursor: 'pointer',
                      border: 'none',
                    }}
                    title="Rotate right 90°"
                  >
                    <svg style={{ width: '20px', height: '20px', transform: 'scaleX(-1)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Quality slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: colors.slate700 }}>Quality:</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.slate200}`,
                    backgroundColor: colors.white,
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    style={{
                      width: '128px',
                      height: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      accentColor: colors.indigo600,
                    }}
                  />
                  <span style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 500, width: '40px', textAlign: 'right', color: colors.slate700 }}>
                    {quality}%
                  </span>
                </div>
              </div>

              {/* Reset crop */}
              <button
                onClick={resetCrop}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderRadius: '8px',
                  border: `1px solid ${colors.slate200}`,
                  backgroundColor: colors.white,
                  color: colors.slate600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                Reset Crop
              </button>
            </div>

            {/* Output info */}
            {cropInfo && (
              <div style={{ fontSize: '14px', color: colors.slate500 }}>
                Output: <span style={{ fontFamily: 'monospace', fontWeight: 500, color: colors.slate700 }}>{cropInfo.width} × {cropInfo.height}px</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 24px',
            borderTop: `1px solid ${colors.slate200}`,
            backgroundColor: colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: colors.slate600,
              cursor: 'pointer',
            }}
          >
            Skip Editing
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing || !crop}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 32px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '12px',
              border: 'none',
              color: colors.white,
              background: isProcessing || !crop ? colors.slate400 : `linear-gradient(to right, ${colors.indigo600}, ${colors.blue600})`,
              cursor: isProcessing || !crop ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              opacity: isProcessing || !crop ? 0.5 : 1,
            }}
          >
            {isProcessing ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: `2px solid ${colors.white}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Processing...
              </>
            ) : (
              <>
                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
