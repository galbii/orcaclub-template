# Payload Starter — AI Agent Guide

Payload CMS v3.79.0 + Next.js 15 App Router + MongoDB + Bun + Tailwind v4. Goals: drop-in env vars, develop pages in `/admin` without code changes, layout-builder pattern for blocks/heros, local-or-R2 storage with no code switch.

## Setup (~2 min)

```bash
bun install
bun run setup            # copies .env.example → .env.local, generates secrets
docker compose up -d     # starts mongo:7 on 27017
bun dev                  # → http://localhost:3000/admin
```

First run: create the admin user on the signup screen, then create a Page with slug `home`. Until that Page exists, the `homeStatic` fallback in `src/endpoints/seed/home-static.ts` renders.

## Commands

| Command | Use |
|---------|-----|
| `bun dev` | Dev server (turbopack) |
| `bun run build` | Production build + type generation. MUST PASS before code is complete. |
| `bun run lint` | ESLint + TypeScript check |
| `bun run generate:types` | Regenerate `src/payload-types.ts` after schema changes |
| `bun run generate:importmap` | Regenerate after adding/changing admin components |
| `bun run setup` | Generate secrets into `.env.local` (idempotent) |

## Critical Rules

### 1. Local API access control

The Local API bypasses access control by default. Pass `overrideAccess: false` whenever a `user` is involved.

```ts
// WRONG — admin-level bypass even though a user was supplied
await payload.find({ collection: 'posts', user })

// RIGHT
await payload.find({ collection: 'posts', user, overrideAccess: false })
```

### 2. Transaction safety in hooks

Pass `req` to every nested `payload.create/update/delete` call inside hooks so they share the parent transaction.

```ts
afterChange: [async ({ doc, req }) => {
  await req.payload.create({ collection: 'audit', data: { id: doc.id }, req })
}]
```

### 3. Prevent hook loops

Use a `context` flag and short-circuit at the top of the hook.

```ts
afterChange: [async ({ doc, req, context }) => {
  if (context.skipHooks) return
  await req.payload.update({ collection: 'posts', id: doc.id, data: { views: doc.views + 1 }, context: { skipHooks: true }, req })
}]
```

## Adding a Page

```
1. /admin → Pages → New
2. Set title and slug
3. Pick a Hero type, drop in Layout blocks
4. Save (drafts autosave every 100ms via versions config)
5. Frontend route: /<slug>   (or just / when slug='home')
```

No code edits required unless adding a custom block or hero variant.

## Adding a Block

```
1. Create src/blocks/MyBlock/config.ts        # Block type: slug, fields
2. Create src/blocks/MyBlock/Component.tsx    # React Server Component
3. Register in src/collections/Pages/index.ts → layout blocks: [..., MyBlock]
4. Register in src/blocks/RenderBlocks.tsx → blockComponents['myBlock'] = MyBlockComponent
5. bun run generate:types && bun run build
```

Existing registered layout blocks (see `RenderBlocks.tsx`): `archive`, `content`, `cta`, `formBlock`, `mediaBlock`. Other folders (`Banner`, `Code`, `RelatedPosts`) are used inside the Lexical editor, not as layout blocks.

## Adding a Hero Variant

```
1. Add a value to the 'type' select options in src/heros/config.ts
2. Create src/heros/MyVariant/index.tsx (default export, props: Page['hero'])
3. Register in src/heros/RenderHero.tsx → heroes['myVariant'] = MyVariantHero
4. Adjust any field's admin.condition in src/heros/config.ts if needed
5. bun run generate:types && bun run build
```

Existing variants: `highImpact`, `mediumImpact`, `lowImpact`. `PostHero` is used only by posts.

## Where Things Go

| Tier | Path | Rule |
|------|------|------|
| UI primitive | `src/components/ui/` | No business logic |
| Domain component | `src/components/{Domain}/` | Used across multiple routes |
| Page-specific | `src/app/(frontend)/<route>/_components/` | Used in one route only |

| Hook type | Location |
|-----------|----------|
| React hooks | `src/hooks/` |
| Cross-collection Payload hooks | `src/hooks/` |
| Collection-scoped Payload hooks | `src/collections/<Name>/hooks/` |

Imports: always use `@/` aliases. Barrels exist for `components/ui`, `hooks`, `utilities`, `access` (wired through `optimizePackageImports` in `next.config.js`).

## Media Manager (Payload Field ↔ Library)

The Media Manager is rendered globally by `src/components/admin/AdminRootProvider.tsx`, registered as a provider in `payload.config.ts`. It exposes a floating button on every admin page and an in-field "Browse Media Library" button on upload fields that opt in.

### Field factories

Prefer the factories in `@/lib/payload/fields/media` for non-rich-text upload fields. They inject the "Browse Media Library" button via `admin.components.beforeInput`.

```ts
import { imageField, videoField, mediaField, mediaArrayField } from '@/lib/payload/fields/media'

fields: [
  imageField('hero', { required: true }),
  videoField('demo'),
  mediaField('attachment'),
  mediaArrayField('gallery', { maxRows: 12 }),
]
```

Raw `type: 'upload'` fields still work (the `hero.media` field in `src/heros/config.ts` is one) — they just won't get the in-field selector button.

### The handshake

```
upload field renders → MediaSelectorButton (beforeInput) opens modal in 'select' mode
                    → user picks a media doc in the modal
                    → onSelect(media) callback fires
                    → useField().setValue(media.id) writes the relationship
```

### Programmatic open from custom UI

```tsx
'use client'
import { useMediaManager } from '@/components/admin/media-manager/MediaManagerProvider'

const { openModal } = useMediaManager()
openModal({ mode: 'select', onSelect: (media) => { /* do something */ } })
```

The Manager is storage-agnostic — it talks to `/api/media` REST. Switching local↔R2 needs zero code changes.

## Storage: Local vs Cloudflare R2

### Local (default)

Files live in `public/media`, served by Next.js. Set `STORAGE_MODE=local` (or leave unset).

### R2

```
1. Cloudflare → R2 → create bucket; enable Public Access on it
2. R2 → API tokens → create Object Read & Write token scoped to the bucket
3. Bucket CORS: allow PUT, POST, GET from NEXT_PUBLIC_SERVER_URL
4. .env.local:
     STORAGE_MODE=r2
     R2_BUCKET=...
     R2_ACCESS_KEY_ID=...
     R2_SECRET_ACCESS_KEY=...
     R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
     # Optional — set to serve direct from R2's CDN (faster). Unset = Payload proxies.
     NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-<id>.r2.dev
5. Restart bun dev
```

`src/lib/env.ts` validates these vars at boot and throws if any are missing. `next.config.js` auto-adds the R2 public URL to `images.remotePatterns`. The plugin (`src/plugins/index.ts`) sets `disableLocalStorage: true` on the media collection so writes don't double up.

## Styling (Tailwind v4)

- Tailwind v4 is CSS-first. All tokens live in `src/app/(frontend)/globals.css` under `@theme` and `:root` blocks — that file is the source of truth.
- Use semantic tokens via utilities: `bg-background`, `text-foreground`, `border-border`, `bg-primary`, `bg-muted`, `text-muted-foreground`, etc.
- Dark mode is attribute-based: `[data-theme="dark"]` is set by `src/providers/Theme/`. Use `dark:` variants or rely on token classes that already adapt.
- Conditional classes: `cn()` from `@/utilities/ui` (NOT `@/lib/utils`).
- Forced dynamic classes: add to `@source inline("...")` in `globals.css`.
- Admin UI tweaks: `src/app/(payload)/custom.scss` only.
- Never hardcode hex/rgb; never add `<style>` blocks to components; never add new global CSS files.

## Gotchas

- Bun only — `npm`/`pnpm`/`yarn` will desync `bun.lock`.
- Strict TypeScript — handle nullables explicitly. No silent `as any`.
- After schema changes: `bun run generate:types`. After admin component changes: `bun run generate:importmap`.
- Home route IS CMS-driven. Create a Page with slug `home` in `/admin`. The `homeStatic` fallback only renders when no home page exists.
- `bun run build` is mandatory before declaring work done, and it boots Payload (requires a running mongo: `docker compose up -d`).
- Live preview uses `<LivePreviewListener />` + Payload's iframe `postMessage` protocol — already wired in `src/app/(frontend)/[slug]/page.tsx` and `src/app/(frontend)/page.tsx`.
- `overrideAccess: draft` in page queries is intentional: drafts require the admin bypass; published reads do not.

## References

- Payload docs: https://payloadcms.com/docs
- Payload LLM context: query context7 with library `/payloadcms/payload`
- Tailwind v4: https://tailwindcss.com/docs
