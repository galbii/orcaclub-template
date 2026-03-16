import type { RequiredDataFromCollectionSlug } from 'payload'

// OrcaClub — static fallback for the homepage before CMS content is seeded
export const homeStatic: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'highImpact',
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
                text: 'OrcaClub',
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
                text: 'The premium membership for builders who move fast.',
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
    links: [
      {
        link: {
          type: 'custom',
          label: 'Join the Club',
          url: '/join',
          newTab: false,
          appearance: 'default',
        },
      },
      {
        link: {
          type: 'custom',
          label: 'Learn More',
          url: '/about',
          newTab: false,
          appearance: 'outline',
        },
      },
    ],
  },
  meta: {
    description: 'OrcaClub — the premium membership community for builders who move fast.',
    title: 'OrcaClub',
  },
  title: 'Home',
  layout: [],
}
