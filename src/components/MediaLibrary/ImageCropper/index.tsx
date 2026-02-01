'use client'

import React, { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { Button } from '@payloadcms/ui'

/**
 * Aspect ratio options for the cropper
 */
const ASPECT_RATIOS = [
  { label: 'Free', value: 'free' },
  { label: '1:1', value: '1' },
  { label: '16:9', value: String(16 / 9) },
  { label: '4:3', value: String(4 / 3) },
  { label: '3:2', value: String(3 / 2) },
] as const

/**
 * Props for the ImageCropper component
 */
export interface ImageCropperProps {
  /** URL of the image to crop */
  imageUrl: string
  /** Callback fired when crop is applied with the cropped area in pixels */
  onCropComplete: (croppedAreaPixels: Area) => void
  /** Callback fired when crop operation is cancelled */
  onCancel: () => void
  /** Initial aspect ratio (optional) */
  initialAspect?: number
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    minHeight: '500px',
    backgroundColor: 'var(--theme-elevation-50)',
  },
  cropperContainer: {
    position: 'relative',
    flex: 1,
    minHeight: '300px',
    backgroundColor: 'var(--theme-elevation-100)',
  },
  controlsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    backgroundColor: 'var(--theme-elevation-50)',
    borderTop: '1px solid var(--theme-elevation-200)',
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--theme-text)',
    minWidth: '70px',
  },
  slider: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    appearance: 'none',
    backgroundColor: 'var(--theme-elevation-200)',
    cursor: 'pointer',
  },
  sliderValue: {
    fontSize: '14px',
    color: 'var(--theme-text)',
    minWidth: '50px',
    textAlign: 'right',
  },
  select: {
    flex: 1,
    maxWidth: '200px',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid var(--theme-elevation-200)',
    borderRadius: 'var(--border-radius-s)',
    backgroundColor: 'var(--theme-elevation-50)',
    color: 'var(--theme-text)',
    cursor: 'pointer',
  },
  previewInfo: {
    fontSize: '12px',
    color: 'var(--theme-text)',
    opacity: 0.7,
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    paddingTop: '8px',
  },
}

/**
 * ImageCropper component for the Payload CMS media library.
 * Provides an interactive interface for cropping images with zoom, rotation,
 * and aspect ratio controls.
 */
export function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  initialAspect,
}: ImageCropperProps) {
  // Crop position state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })

  // Zoom state (1x to 3x)
  const [zoom, setZoom] = useState<number>(1)

  // Rotation state (-180 to 180 degrees)
  const [rotation, setRotation] = useState<number>(0)

  // Aspect ratio state
  const [aspect, setAspect] = useState<number | undefined>(initialAspect)

  // Store the cropped area in pixels
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // Handle crop completion (called when user stops dragging/zooming)
  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Handle aspect ratio change
  const handleAspectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'free') {
      setAspect(undefined)
    } else {
      setAspect(parseFloat(value))
    }
  }, [])

  // Handle apply crop button click
  const handleApplyCrop = useCallback(() => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels)
    }
  }, [croppedAreaPixels, onCropComplete])

  // Get the current aspect ratio value for the select
  const getCurrentAspectValue = (): string => {
    if (aspect === undefined) return 'free'
    // Find matching preset or return the numeric value
    const preset = ASPECT_RATIOS.find(
      (r) => r.value !== 'free' && Math.abs(parseFloat(r.value) - aspect) < 0.01,
    )
    return preset ? preset.value : String(aspect)
  }

  return (
    <div style={styles.container}>
      {/* Cropper Container */}
      <div style={styles.cropperContainer}>
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={handleCropComplete}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          showGrid
          objectFit="contain"
          style={{
            containerStyle: {
              backgroundColor: 'var(--theme-elevation-100)',
            },
            cropAreaStyle: {
              border: '2px solid var(--theme-elevation-900)',
            },
          }}
        />
      </div>

      {/* Controls Panel */}
      <div style={styles.controlsPanel}>
        {/* Zoom Control */}
        <div style={styles.controlRow}>
          <label style={styles.label}>Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.sliderValue as React.CSSProperties}>{zoom.toFixed(1)}x</span>
        </div>

        {/* Rotation Control */}
        <div style={styles.controlRow}>
          <label style={styles.label}>Rotation</label>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value, 10))}
            style={styles.slider}
          />
          <span style={styles.sliderValue as React.CSSProperties}>{rotation}°</span>
        </div>

        {/* Aspect Ratio Selector */}
        <div style={styles.controlRow}>
          <label style={styles.label}>Aspect</label>
          <select
            value={getCurrentAspectValue()}
            onChange={handleAspectChange}
            style={styles.select}
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preview Info */}
        {croppedAreaPixels && (
          <div style={styles.previewInfo}>
            Crop area: {Math.round(croppedAreaPixels.width)} x {Math.round(croppedAreaPixels.height)}{' '}
            px
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <Button buttonStyle="secondary" size="small" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            buttonStyle="primary"
            size="small"
            onClick={handleApplyCrop}
            disabled={!croppedAreaPixels}
          >
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Creates an HTMLImageElement from a source URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

/**
 * Generates a cropped image blob from the original image and crop coordinates.
 *
 * @param imageSrc - The source URL of the image to crop
 * @param pixelCrop - The crop area in pixels { x, y, width, height }
 * @returns A Promise that resolves to a Blob of the cropped image (JPEG, 0.95 quality)
 *
 * @example
 * ```typescript
 * const croppedBlob = await getCroppedImg(imageUrl, {
 *   x: 100,
 *   y: 50,
 *   width: 400,
 *   height: 300
 * })
 * ```
 */
export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas 2D context')
  }

  // Set canvas dimensions to the cropped area size
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped portion of the image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      },
      'image/jpeg',
      0.95,
    )
  })
}

export default ImageCropper
export type { Area }
