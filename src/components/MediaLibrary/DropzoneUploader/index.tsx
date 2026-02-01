'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@payloadcms/ui'
import type { Media } from '@/payload-types'

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  media?: Media
}

interface DropzoneUploaderProps {
  /** Callback fired when uploads complete */
  onUploadComplete: (uploadedMedia: Media[]) => void
  /** Accepted file types (defaults to images and common media) */
  accept?: Record<string, string[]>
  /** Maximum file size in bytes (default 10MB) */
  maxSize?: number
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
  },
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    border: '2px dashed var(--theme-elevation-300)',
    borderRadius: 'var(--border-radius-m)',
    backgroundColor: 'var(--theme-elevation-50)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '200px',
  },
  dropzoneActive: {
    borderColor: 'var(--theme-success-500)',
    backgroundColor: 'var(--theme-elevation-100)',
  },
  dropzoneReject: {
    borderColor: 'var(--theme-error-500)',
    backgroundColor: 'var(--theme-error-50)',
  },
  dropzoneIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: 'var(--theme-elevation-500)',
  },
  dropzoneText: {
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--theme-text)',
    marginBottom: '8px',
    textAlign: 'center',
  },
  dropzoneSubtext: {
    fontSize: '14px',
    color: 'var(--theme-elevation-600)',
    textAlign: 'center',
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'var(--theme-elevation-50)',
    borderRadius: 'var(--border-radius-s)',
    border: '1px solid var(--theme-elevation-150)',
  },
  filePreview: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--border-radius-s)',
    objectFit: 'cover',
    backgroundColor: 'var(--theme-elevation-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--theme-text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    fontSize: '12px',
    color: 'var(--theme-elevation-600)',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: 'var(--theme-elevation-200)',
    borderRadius: '2px',
    marginTop: '8px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--theme-success-500)',
    transition: 'width 0.2s ease',
  },
  statusIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  errorText: {
    fontSize: '12px',
    color: 'var(--theme-error-500)',
    marginTop: '4px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    paddingTop: '8px',
  },
}

const DEFAULT_ACCEPT = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  'video/*': ['.mp4', '.webm', '.mov'],
  'application/pdf': ['.pdf'],
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DropzoneUploader({
  onUploadComplete,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
}: DropzoneUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (file: File): Promise<Media | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append(
      '_payload',
      JSON.stringify({
        alt: file.name.replace(/\.[^/.]+$/, ''),
      }),
    )

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed with status ${response.status}`)
      }

      const result = await response.json()
      return result.doc as Media
    } catch (error) {
      throw error
    }
  }

  const handleUpload = useCallback(async () => {
    const filesToUpload = uploadingFiles.filter((f) => f.status !== 'success')
    if (filesToUpload.length === 0) return

    setIsUploading(true)
    const uploadedMedia: Media[] = []

    for (let i = 0; i < filesToUpload.length; i++) {
      const uploadingFile = filesToUpload[i]

      // Update status to uploading
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === uploadingFile.file ? { ...f, status: 'uploading' as const, progress: 0 } : f,
        ),
      )

      try {
        // Simulate progress (since fetch doesn't support progress for uploads easily)
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === uploadingFile.file && f.status === 'uploading'
                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                : f,
            ),
          )
        }, 100)

        const media = await uploadFile(uploadingFile.file)
        clearInterval(progressInterval)

        if (media) {
          uploadedMedia.push(media)
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === uploadingFile.file
                ? { ...f, status: 'success' as const, progress: 100, media }
                : f,
            ),
          )
        }
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === uploadingFile.file
              ? {
                  ...f,
                  status: 'error' as const,
                  progress: 0,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f,
          ),
        )
      }
    }

    setIsUploading(false)

    if (uploadedMedia.length > 0) {
      onUploadComplete(uploadedMedia)
    }
  }, [uploadingFiles, onUploadComplete])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }))

    setUploadingFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFile = useCallback((fileToRemove: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== fileToRemove))
  }, [])

  const clearCompleted = useCallback(() => {
    setUploadingFiles((prev) => prev.filter((f) => f.status !== 'success'))
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: true,
  })

  const getDropzoneStyle = (): React.CSSProperties => {
    if (isDragReject) return { ...styles.dropzone, ...styles.dropzoneReject }
    if (isDragAccept || isDragActive) return { ...styles.dropzone, ...styles.dropzoneActive }
    return styles.dropzone
  }

  const pendingFiles = uploadingFiles.filter((f) => f.status !== 'success')
  const hasFiles = uploadingFiles.length > 0

  return (
    <div style={styles.container}>
      {/* Dropzone */}
      <div {...getRootProps({ style: getDropzoneStyle() })}>
        <input {...getInputProps()} />
        <div style={styles.dropzoneIcon}>
          {isDragReject ? '\u{1F6AB}' : isDragActive ? '\u{1F4E5}' : '\u{1F4C1}'}
        </div>
        <p style={styles.dropzoneText}>
          {isDragReject
            ? 'Some files are not accepted'
            : isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'}
        </p>
        <p style={styles.dropzoneSubtext}>
          Supports images, videos, and PDFs up to {formatFileSize(maxSize)}
        </p>
      </div>

      {/* File List */}
      {hasFiles && (
        <div style={styles.fileList}>
          {uploadingFiles.map((uploadingFile, index) => {
            const isImage = uploadingFile.file.type.startsWith('image/')
            const previewUrl = isImage ? URL.createObjectURL(uploadingFile.file) : null

            return (
              <div key={`${uploadingFile.file.name}-${index}`} style={styles.fileItem}>
                {/* Preview */}
                <div style={styles.filePreview}>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={uploadingFile.file.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--border-radius-s)' }}
                      onLoad={() => URL.revokeObjectURL(previewUrl)}
                    />
                  ) : (
                    <span style={{ fontSize: '24px' }}>
                      {uploadingFile.file.type.includes('video')
                        ? '\u{1F3AC}'
                        : uploadingFile.file.type.includes('pdf')
                          ? '\u{1F4C4}'
                          : '\u{1F4C1}'}
                    </span>
                  )}
                </div>

                {/* File Info */}
                <div style={styles.fileInfo}>
                  <div style={styles.fileName}>{uploadingFile.file.name}</div>
                  <div style={styles.fileSize}>{formatFileSize(uploadingFile.file.size)}</div>
                  {uploadingFile.status === 'uploading' && (
                    <div style={styles.progressBar}>
                      <div
                        style={{ ...styles.progressFill, width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                  )}
                  {uploadingFile.status === 'error' && (
                    <div style={styles.errorText}>{uploadingFile.error}</div>
                  )}
                </div>

                {/* Status Icon */}
                <div style={styles.statusIcon}>
                  {uploadingFile.status === 'success' && (
                    <span style={{ color: 'var(--theme-success-500)' }}>{'\u2713'}</span>
                  )}
                  {uploadingFile.status === 'error' && (
                    <span style={{ color: 'var(--theme-error-500)' }}>{'\u2717'}</span>
                  )}
                  {uploadingFile.status === 'uploading' && (
                    <span style={{ color: 'var(--theme-elevation-500)' }}>{'\u231B'}</span>
                  )}
                </div>

                {/* Remove Button */}
                {uploadingFile.status !== 'uploading' && (
                  <button
                    type="button"
                    onClick={() => removeFile(uploadingFile.file)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'var(--theme-elevation-600)',
                      fontSize: '16px',
                    }}
                    aria-label="Remove file"
                  >
                    {'\u2715'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      {hasFiles && (
        <div style={styles.actions}>
          {uploadingFiles.some((f) => f.status === 'success') && (
            <Button buttonStyle="secondary" size="small" onClick={clearCompleted}>
              Clear Completed
            </Button>
          )}
          {pendingFiles.length > 0 && (
            <Button
              buttonStyle="primary"
              size="small"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${pendingFiles.length} File${pendingFiles.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default DropzoneUploader
