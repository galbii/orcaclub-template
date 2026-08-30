# Payload Starter — AI Agent Guide

Payload CMS v3.88.0 + Next.js 15 App Router + MongoDB + Bun + Tailwind v4. Goals: drop-in env vars, develop pages in `/admin` without code changes, layout-builder pattern for blocks/heros, local-or-R2 storage with no code switch.

## Setup (~2 min)

```bash
bun install
cp .env.example .env.local
bun run setup            # generates the three secrets in .env.local
# fill in the values marked "<-- FILL IN" in .env.local
docker compose up -d     # optional: local mongo:7 on 27017
bun dev                  # → http://localhost:3000/admin
```

`.env.example` is the single source of truth for configuration. Every
integration (Mongo, Resend, GA, GTM, Meta Pixel, R2, Shopify) is a commented,
grouped block there — substitute values, nothing else to wire up.

First run: create the admin user on the signup screen, then create a Page with slug `home`. Until that Page exists, the `homeStatic` fallback in `src/endpoints/seed/home-static.ts` renders.

## Commands

| Command | Use |
|---------|-----|
| `bun dev` | Dev server (turbopack) |
| `bun run build` | Production build + type generation. MUST PASS before code is complete. |
| `bun run lint` | ESLint only — does NOT typecheck. Run `typecheck` separately. |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test:int` | Integration tests via `bun test` (no vitest — this repo is bun-only) |
| `bun run generate:types` | Regenerate `src/payload-types.ts` after schema changes |
| `bun run generate:importmap` | Regenerate after adding/changing admin components |
| `bun run setup` | Generate secrets into `.env.local` (idempotent) |

## Environment

All config flows through `.env.local`, validated at boot by `src/lib/env.ts`.
Import `env` / `analytics` from `@/lib/env` — never read `process.env` directly
(except for `NEXT_PUBLIC_*` inside `src/lib/env.ts` itself, where Next's build-time
string substitution requires full literal names).

**Two things bite repeatedly:**

1. **Atlas connection strings have no database name.** `env.ts` throws a specific
   error if one is missing, because mongoose would otherwise silently use a db
   called `test`.
2. **`NEXT_PUBLIC_*` is inlined at BUILD time.** On Coolify each must be a *Build
   Variable* and have a matching `ARG`+`ENV` pair in the `Dockerfile`. Adding a new
   public var means editing the Dockerfile too, or it compiles to an empty string.

### Analytics

`src/components/Analytics/` mounts GTM, GA, and the Meta Pixel from
`NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_FB_PIXEL_ID`. Each is
inert when blank. GA is skipped when GTM is set, on the assumption GA is routed
through the container.

### Email

`RESEND_API_KEY` activates the Resend adapter in `payload.config.ts`. Without it
Payload logs mail to the console instead of sending — so contact-form
notifications and admin password resets are no-ops locally by design.

### Environment invariants

1. **Import `env` / `analytics` / `shopify` from `@/lib/env`.** Never read
   `process.env` in a component or collection. The one exception is inside
   `src/lib/env.ts` itself, where `NEXT_PUBLIC_*` must be written as full
   literals — Next substitutes them by static text match, so `process.env[key]`
   would never be replaced.
2. **Use `||`, never `??`, for optional vars.** An unfilled `.env.local` leaves a
   var as an empty string, not `undefined`. `??` passes `""` straight through —
   this already shipped a bug where every page title rendered as `"About | "`.
3. **Never throw at module load for an optional integration.** A top-level
   `if (!process.env.X) throw` breaks `next build` for anyone without that
   credential. Construct lazily and export `null` when disabled.
4. **Half-configured is an error.** If a feature's primary key is set but a
   dependent value is missing, throw. Silent partial behavior is worse than a
   clear failure.
5. **Secrets never get a `NEXT_PUBLIC_` prefix.** That prefix means "compile this
   into the browser bundle". `SHOPIFY_STOREFRONT_ACCESS_TOKEN` and every `R2_*`
   secret are server-only and must stay that way.

## Adding a New Integration

Five places, every time. Miss step 3 and it works locally and is silently empty
in production.

1. **`.env.example`** — add a commented block: what it does, where to get the
   value, what happens when blank.
2. **`src/lib/env.ts`** — parse it. `optional()` for opt-in features,
   `required()` only inside an enabled branch. Export `null` when off.
3. **`Dockerfile`** — **only if the var is `NEXT_PUBLIC_*`**, add a matching
   `ARG` *and* `ENV` pair in the builder stage. Skipping this is the #1
   production bug in this template: the value compiles to an empty string with no
   error anywhere. Server-only vars need nothing here.
4. **Consume it** — gate the feature on the null check. Render nothing, or return
   an empty result, when disabled.
5. **`README.md`** — add a row to the integrations table.

Verify with a blank-env build:

```bash
rm -rf .next && bun run build
grep -rc "your-vendor-domain" .next/static   # expect 0
```

For anything carrying a secret, also confirm it is absent from the client
bundle — build with a sentinel value and grep `.next/static` for it.

## Commerce (Shopify)

`src/lib/shopify/` wraps the **Storefront API** (never the Admin API — it holds
destructive scopes). Server-only; every file starts with `import 'server-only'`.

| File | Role |
|------|------|
| `client.ts` | The only place that calls `fetch`. Auth, caching, error shape. |
| `queries.ts` | GraphQL documents and shared fragments. |
| `raw.ts` | Shapes Shopify returns. Never import outside this folder. |
| `normalize.ts` | Raw → flat `types.ts` shapes. One mapper per entity. |
| `products.ts` / `cart.ts` | Public API. |
| `index.ts` | Barrel — import from `@/lib/shopify`, not deep paths. |

Rules when extending it:

- Add a query to `queries.ts` and a typed wrapper — do not call `storefront()`
  from a component.
- Catalog reads must return empty results when `isShopifyEnabled()` is false, so
  an unconfigured clone still builds.
- Cart calls are always `cache: 'no-store'`.
- Shopify returns mutation failures in `userErrors` with an HTTP **200**. Always
  unwrap them, or a failed write looks like a success.
- Never rebuild checkout. Redirect to the cart's `checkoutUrl`.
- Routes reading the catalog need `revalidate` or `force-dynamic` — the
  credentials are runtime-only, so a build-time prerender bakes in an empty page.

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
- **Transactions differ between local and prod.** The docker-compose mongo is
  standalone, so Payload transactions are OFF locally; Atlas is a replica set, so
  they are ON in production. A hook that forgets to pass `req` therefore looks
  fine locally and can leave partial writes in prod. Test transactional hooks
  against a replica set before shipping.
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
