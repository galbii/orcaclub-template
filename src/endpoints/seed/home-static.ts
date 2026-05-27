import type { RequiredDataFromCollectionSlug } from 'payload'

// Static fallback for the homepage before CMS content is seeded.
// Replace by creating a page with slug "home" in /admin.
export const homeStatic: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Welcome to your new Payload site',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            tag: 'h1',
            version: 1,
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: "Sign in at /admin to create your first page. Get started by editing src/app/(frontend)/page.tsx or creating a page with slug 'home' in /admin.",
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
    links: [],
  },
  meta: {
    description: 'A Payload CMS + Next.js starter template.',
    title: 'Home',
  },
  title: 'Home',
  layout: [],
}
