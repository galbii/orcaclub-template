/** @type {import('tailwindcss').Config} */
export default {
  // In v4, most configuration lives in globals.css via @theme and @plugin.
  // This file is kept only for the typography prose customization.
  theme: {
    extend: {
      typography: () => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'hsl(var(--foreground))',
              '--tw-prose-headings': 'hsl(var(--foreground))',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: { fontSize: '2.5rem' },
              h2: { fontSize: '1.25rem', fontWeight: 600 },
            },
          ],
        },
        md: {
          css: [
            {
              h1: { fontSize: '3.5rem' },
              h2: { fontSize: '1.5rem' },
            },
          ],
        },
      }),
    },
  },
}
