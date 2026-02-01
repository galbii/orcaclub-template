/**
 * Media Field Utilities
 *
 * Reusable field factory functions for creating upload fields with integrated
 * custom media library selector. This ensures consistency across all collections
 * and reduces code duplication.
 */

import type { UploadField } from 'payload'

/**
 * Create an upload field with integrated media library selector
 *
 * This factory function creates a standard upload field that:
 * - Relates to the 'media' collection
 * - Includes a "Browse Media Library" button above the upload area
 * - Allows users to select from existing media OR upload new files
 * - Supports all standard upload field options
 *
 * @param name - Field name
 * @param options - Additional field configuration (optional)
 * @returns Configured upload field with media selector
 *
 * @example
 * ```typescript
 * // Simple usage
 * fields: [
 *   mediaField('featuredImage', { required: true })
 * ]
 *
 * // With custom configuration
 * fields: [
 *   mediaField('heroImage', {
 *     required: true,
 *     admin: {
 *       description: 'Main hero image (recommended: 1920x1080px)',
 *     },
 *     filterOptions: {
 *       mimeType: { contains: 'image' }, // Only images
 *     },
 *   })
 * ]
 * ```
 */
export const mediaField = (
  name: string,
  options?: Partial<UploadField>,
): UploadField => {
  const { admin, ...restOptions } = options || {}

  return {
    name,
    type: 'upload',
    relationTo: 'media',
    ...restOptions,
    admin: {
      ...admin,
      components: {
        ...admin?.components,
        beforeInput: ['/components/admin/MediaSelectorButton#MediaSelectorButton'],
      },
    },
  } as UploadField
}

/**
 * Create an array of upload fields for galleries/multiple images
 *
 * Common pattern for image galleries, product images, etc.
 *
 * @param name - Field name
 * @param options - Additional configuration
 * @returns Array field with media upload items
 *
 * @example
 * ```typescript
 * fields: [
 *   mediaArrayField('gallery', {
 *     minRows: 1,
 *     maxRows: 12,
 *     admin: {
 *       description: 'Product image gallery (drag to reorder)',
 *     },
 *   })
 * ]
 * ```
 */
export const mediaArrayField = (
  name: string,
  options?: {
    minRows?: number
    maxRows?: number
    admin?: {
      description?: string
      condition?: (data: any, siblingData: any) => boolean
    }
    filterOptions?: Record<string, any>
  },
): {
  name: string
  type: 'array'
  minRows?: number
  maxRows?: number
  admin?: any
  fields: UploadField[]
} => {
  const arrayField: {
    name: string
    type: 'array'
    minRows?: number
    maxRows?: number
    admin?: any
    fields: UploadField[]
  } = {
    name,
    type: 'array',
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        required: true,
        admin: {
          components: {
            beforeInput: ['/components/admin/MediaSelectorButton#MediaSelectorButton'],
          },
        },
      },
    ],
  }

  if (options?.minRows !== undefined) arrayField.minRows = options.minRows
  if (options?.maxRows !== undefined) arrayField.maxRows = options.maxRows
  if (options?.admin !== undefined) arrayField.admin = options.admin
  if (options?.filterOptions !== undefined) {
    arrayField.fields[0]!.filterOptions = options.filterOptions
  }

  return arrayField
}

/**
 * Create a media field that only accepts images
 *
 * @param name - Field name
 * @param options - Additional configuration
 * @returns Upload field filtered to images only
 *
 * @example
 * ```typescript
 * fields: [
 *   imageField('thumbnail', { required: true })
 * ]
 * ```
 */
export const imageField = (
  name: string,
  options?: Partial<UploadField>,
): UploadField => {
  return mediaField(name, {
    ...options,
    filterOptions: {
      mimeType: { contains: 'image' },
      ...options?.filterOptions,
    },
  })
}

/**
 * Create a media field that only accepts videos
 *
 * @param name - Field name
 * @param options - Additional configuration
 * @returns Upload field filtered to videos only
 *
 * @example
 * ```typescript
 * fields: [
 *   videoField('demoVideo')
 * ]
 * ```
 */
export const videoField = (
  name: string,
  options?: Partial<UploadField>,
): UploadField => {
  return mediaField(name, {
    ...options,
    filterOptions: {
      mimeType: { contains: 'video' },
      ...options?.filterOptions,
    },
  })
}

/**
 * Responsive image field group for hero sections
 *
 * Provides separate desktop and mobile image fields for responsive design.
 *
 * @param label - Group label (e.g., "Hero Images")
 * @returns Group field with desktop and mobile image uploads
 *
 * @example
 * ```typescript
 * fields: [
 *   responsiveImageGroup('Hero Images')
 * ]
 * ```
 */
export const responsiveImageGroup = (label: string = 'Images') => ({
  type: 'group' as const,
  name: 'responsiveImages',
  label,
  fields: [
    imageField('desktop', {
      required: true,
      admin: {
        description: 'Desktop image (recommended: 1920x1080px)',
      },
    }),
    imageField('mobile', {
      admin: {
        description: 'Mobile image (optional, recommended: 768x1024px)',
      },
    }),
  ],
})
