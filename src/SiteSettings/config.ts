import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'contactInfo',
      label: 'Contact Information',
      type: 'group',
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Phone Number',
        },
        {
          name: 'address',
          type: 'textarea',
          label: 'Address',
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Media Links',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          label: 'Platform',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'X / Twitter', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'GitHub', value: 'github' },
            { label: 'Discord', value: 'discord' },
            { label: 'Threads', value: 'threads' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          label: 'Label (optional override)',
          admin: {
            description: 'Overrides the platform name when displayed as link text',
          },
        },
      ],
    },
  ],
}
