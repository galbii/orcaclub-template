# ORCA-WEB Development Guide

**Project Type:** Production-ready website builder and CMS platform built on Payload CMS v3.79.0

This guide focuses on project-specific patterns, critical security rules, and organization principles. For general Payload CMS documentation, query the official docs or use context7.

---

## Quick Reference

### Commands
```bash
bun run dev                  # Start development server
bun run build                # Production build + type generation (REQUIRED before code complete)
bun run lint                 # ESLint + TypeScript checks
bun run generate:types       # Generate Payload types after schema changes
bun run generate:importmap   # Regenerate import map after component changes
```

### Critical Rules
- ✅ **ALWAYS** use Bun (never npm)
- ✅ **ALWAYS** use field utilities from `@/lib/payload/fields/media` for upload fields
- ✅ **ALWAYS** set `overrideAccess: false` when passing `user` to Local API
- ✅ **ALWAYS** pass `req` in hooks for transaction safety
- ✅ **ALWAYS** run `bun run build` before code is complete
- ❌ **NEVER** duplicate UI components in page folders
- ❌ **NEVER** use raw `type: 'upload'` fields (use field utilities)
- ❌ **NEVER** skip null checks (strict TypeScript mode enabled)

---

## Core Principles

1. **Bun Runtime** - Mandatory for consistency (never use npm/yarn/pnpm)
2. **TypeScript Strict Mode** - All nullable types must be explicitly handled
3. **Security-Critical** - Local API bypasses access control by default unless `overrideAccess: false`
4. **Transaction Safety** - Always pass `req` to nested operations in hooks
5. **Media Manager** - Use field utilities, never raw upload fields
6. **Code Validation** - Always run `bun run build` before considering code complete
7. **Type Generation** - Run `generate:types` after schema changes
8. **Import Map** - Run `generate:importmap` after adding/modifying admin components

---

## Project Structure

```
src/
├── app/
│   ├── (frontend)/          # Frontend routes (pages, posts, search)
│   └── (payload)/           # Admin UI (/admin) & API routes
├── collections/             # Payload collections (Users, Media, Pages, Posts, Categories)
├── globals/                 # Global configs (Header, Footer)
├── components/
│   ├── ui/                  # Shared UI components (Button, Card, Dialog, etc.)
│   ├── admin/               # Admin components (Media Manager system)
│   ├── layout/              # Header, footer, navigation
│   └── {domain}/            # Domain-specific components
├── lib/
│   └── payload/fields/      # Field utilities (media.ts - CRITICAL)
├── utilities/               # General utilities (cn, formatters, data fetching, React hooks)
├── hooks/                   # Payload-level hooks shared across collections (beforeChange, afterChange, etc.)
├── access/                  # Access control functions
├── blocks/                  # Layout blocks (8 types: Archive, Banner, CTA, Code, Content, Form, MediaBlock, RelatedPosts)
├── heros/                   # Hero variants (4 types: HighImpact, MediumImpact, LowImpact, PostHero)
└── payload.config.ts        # Main Payload configuration
```

**Key Collections:**
- **Users** - Auth collection with admin access
- **Media** - Enhanced media library with comprehensive metadata, responsive variants, SEO fields
- **Pages** - Page builder with hero + layout blocks, drafts/versioning, SEO
- **Posts** - Blog posts with Lexical editor, categories, related posts, drafts/versioning
- **Categories** - Hierarchical taxonomy for posts

**Key Features:**
- Production-grade Media Manager (ported from KAWAI project)
- Layout builder with 8 block types
- 4 hero variants (High/Medium/Low Impact, PostHero)
- Draft/versioning with scheduled publishing
- Live preview with on-demand ISR revalidation

---

## Code Organization

### Component Tiers

Three tiers — always ask "how reusable is this?" before deciding where a component lives:

| Tier | Location | Rule |
|------|----------|------|
| **UI primitives** | `src/components/ui/` | No business logic. Pure props-driven design system components. |
| **Domain components** | `src/components/{domain}/` | Feature-specific logic, used across multiple routes (e.g. `Media/`, `Card/`, `RichText/`). |
| **Page-specific** | `src/app/(frontend)/_components/` | Used in exactly one route. If it ends up used elsewhere, promote it to a domain component. |

```
// ❌ WRONG: re-implementing what already exists
src/app/(frontend)/about/_components/Button.tsx

// ✅ CORRECT: use what's shared
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

### Import Patterns

**Always use `@` aliases — never relative paths that traverse up directories:**

```typescript
// ✅ CORRECT
import { Button } from '@/components/ui/button'
import { Button, Card } from '@/components/ui'       // via barrel
import { cn } from '@/utilities/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { useDebounce } from '@/hooks'                // via barrel
import { authenticated } from '@/access'
import type { Media, Page } from '@/payload-types'

// ❌ WRONG
import Button from '../../../components/ui/button'
import { cn } from '@/lib/utils'                     // doesn't exist
import { useDebounce } from '@/utilities/useDebounce' // hooks moved to @/hooks
```

### Barrel Exports

Barrels exist for `components/ui`, `hooks`, `utilities`, and `access`. `next.config.js` has `optimizePackageImports` configured so barrel imports are tree-shaken correctly.

**Direct import** (always safe, explicit):
```typescript
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/useDebounce'
```

**Barrel import** (fine with `optimizePackageImports`, cleaner for multi-imports):
```typescript
import { Button, Card, Input } from '@/components/ui'
import { useDebounce, useClickableCard } from '@/hooks'
```

**Never create a barrel for a folder with only 1-2 files** — it adds indirection with no benefit.

### Hooks Placement

| Hook type | Location | Examples |
|-----------|----------|---------|
| React hooks (`use*`) | `src/hooks/` | `useDebounce.ts`, `useClickableCard.ts` |
| Payload hooks shared across collections | `src/hooks/` | `populatePublishedAt.ts`, `revalidateRedirects.ts` |
| Payload hooks scoped to one collection | `src/collections/Name/hooks/` | `revalidatePost.ts`, `populateAuthors.ts` |

```typescript
// ✅ React hooks
import { useDebounce } from '@/hooks/useDebounce'

// ✅ Shared Payload hooks
import { populatePublishedAt } from '@/hooks/populatePublishedAt'

// ✅ Collection-scoped hooks (used internally, not exported)
import { revalidatePost } from './hooks/revalidatePost'
```

### Integration / External Service Organization

```
src/lib/{service-name}/
├── index.ts       # barrel export
├── client.ts      # API client setup
├── types.ts       # service-specific types
└── operations.ts  # core operations
```

### API Routes

Use kebab-case: `/api/integration-name/` ✅ (not camelCase or PascalCase)

---

## Building a Page

Follow this checklist in order when building any new page or route:

### 1. Decide the route location

```
src/app/(frontend)/
├── page.tsx              # home
├── [slug]/page.tsx       # dynamic pages (already exists)
├── about/page.tsx        # static route example
└── about/_components/    # page-specific components (if needed)
```

### 2. Split server / client

Every page starts as a **Server Component**. Only split to `.client.tsx` when you need state, effects, or browser APIs:

```typescript
// page.tsx — Server Component (data fetching, SEO)
import { AboutPageClient } from './_components/AboutPageClient'

export default async function AboutPage() {
  const data = await getCachedGlobal('header', 1)()
  return <AboutPageClient data={data} />
}

// _components/AboutPageClient.tsx — Client Component
'use client'
import { useState } from 'react'
export function AboutPageClient({ data }) { ... }
```

### 3. Fetch data with the Local API

```typescript
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'about' } },
    overrideAccess: false,  // ← ALWAYS set this
  })

  return <PageComponent page={page.docs[0]} />
}
```

Or use the cached utility helpers:
```typescript
import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedGlobal } from '@/utilities/getGlobals'
```

### 4. Place components correctly

Before creating a new component, ask:

- **Used in 2+ routes?** → `src/components/{domain}/ComponentName.tsx`
- **UI primitive (button, input, card)?** → `src/components/ui/component-name.tsx`
- **Only used on this page?** → `src/app/(frontend)/route/_components/ComponentName.tsx`

```typescript
// ✅ Building a page section with shared + local components
import { Button } from '@/components/ui/button'           // shared primitive
import { RichText } from '@/components/RichText'          // shared domain
import { AboutHero } from './_components/AboutHero'       // page-specific
```

### 5. Style with Tailwind + design tokens

```typescript
// ✅ Use CSS variable tokens — never hardcode colors
<div className="bg-background text-foreground border-border">

// ✅ Brand colors via token
<span className="text-[hsl(var(--orca-cyan))]">

// ✅ Dark mode
<div className="bg-white dark:bg-zinc-900">

// ✅ Display headings use Syne font
<h1 className="font-display text-4xl font-bold">

// ✅ Conditional classes
import { cn } from '@/utilities/ui'
<div className={cn('base', isActive && 'ring-2 ring-primary', className)}>
```

### 6. Add metadata

```typescript
import type { Metadata } from 'next'
import { generateMeta } from '@/utilities/generateMeta'

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage()
  return generateMeta({ doc: page })
}
```

### 7. Run the build

```bash
bun run build   # mandatory — catches type errors and Payload schema issues
```

### Page Build Checklist

- [ ] Route in correct location under `src/app/(frontend)/`
- [ ] Server Component by default; `.client.tsx` only when needed
- [ ] `overrideAccess: false` on every Local API call with a user
- [ ] Components in the right tier (ui / domain / page-specific)
- [ ] Tailwind only — no inline styles except for non-theme fonts (see below)
- [ ] Colors via CSS variables, not hardcoded hex/rgb
- [ ] `cn()` from `@/utilities/ui` for conditional classes
- [ ] `generateMeta` / `generateMetadata` for SEO
- [ ] `bun run build` passes before marking done

---

## Styling System

### Stack

| Tool | Role |
|------|------|
| Tailwind CSS v4 | Utility classes, CSS-first configuration |
| `@theme {}` in globals.css | Design tokens — generates utilities AND CSS vars |
| `:root` / `[data-theme]` in globals.css | Runtime theme switching (HSL values) |
| `globals.css` | Single source of truth for all global styles |
| `custom.scss` | Admin-only overrides (Payload admin UI) |
| `src/providers/Theme/` | React context + `[data-theme]` attribute management |

### File Ownership

| File | What belongs here |
|------|-------------------|
| `src/app/(frontend)/globals.css` | `@import "tailwindcss"`, `@plugin`, `@custom-variant`, `@theme`, `:root` tokens, `@layer base` resets, `@source inline()` safelist |
| `src/app/(payload)/custom.scss` | Admin UI overrides only |
| Component files | Tailwind utility classes via `className` + `cn()` |

**Rules:**
- ✅ New design token → `:root` block in `globals.css`
- ✅ Component styles → Tailwind classes in JSX
- ✅ Admin overrides → `custom.scss` only
- ❌ Never add `<style>` blocks to components
- ❌ Never hardcode color hex/rgb values — use CSS vars
- ❌ Never add new CSS files without a clear scope reason
- ❌ Never duplicate token definitions outside `globals.css`

### Inline `style` Exception — Non-Theme Fonts

Some OrcaClub fonts are loaded via Google Fonts and are **not** registered in `@theme`, so they can't be used as Tailwind utilities. Use inline `style` props for these:

```tsx
// ✅ Acceptable — font not in @theme
<p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
  Orcaclub
</p>

// ✅ Acceptable — decorative font not in @theme
<p style={{ fontFamily: "'UnifrakturMaguntia', serif" }}>
  Built to Surface.
</p>
```

**Fonts and when to use them:**

| Font | Tailwind class | Use case |
|------|---------------|----------|
| Geist Sans | `font-sans` (default) | Body text |
| Geist Mono | `font-mono` | Code |
| Syne | `font-display` | UI headings, labels, nav |
| Cormorant Garamond | inline `style` only | Wordmark, editorial display text |
| UnifrakturMaguntia | inline `style` only | Gothic tagline accents |

If a font is needed in 3+ components, consider adding it to `@theme` as `--font-*` so it gets a utility class.

---

### Tailwind v4 — Key Differences from v3

This project runs **Tailwind CSS v4**. The main things to know:

**1. CSS import (not directives)**
```css
/* ✅ v4 — single import */
@import "tailwindcss";

/* ❌ v3 — don't use these */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**2. Plugins via `@plugin`**
```css
/* ✅ v4 */
@plugin "tailwindcss-animate";
@plugin "@tailwindcss/typography";

/* ❌ v3 (in tailwind.config.js) */
plugins: [tailwindcssAnimate, typography]
```

**3. PostCSS plugin**
```js
// postcss.config.js — v4 uses @tailwindcss/postcss (not tailwindcss)
export default {
  plugins: { '@tailwindcss/postcss': {} },
}
```

**4. No more `tailwind.config.js` for colors/fonts**
Theme tokens live in `globals.css` under `@theme {}` and `:root {}`. The `tailwind.config.mjs` is kept only for the typography prose customization.

**5. Safelist → `@source inline()`**
```css
/* ✅ v4 */
@source inline("{lg:col-span-4,lg:col-span-6,lg:col-span-8,lg:col-span-12}");

/* ❌ v3 */
safelist: ['lg:col-span-4', ...]
```

**6. Renamed classes**
| v3 | v4 |
|----|----|
| `flex-shrink-0` | `shrink-0` |
| `flex-grow` | `grow` |
| `overflow-ellipsis` | `text-ellipsis` |
| `outline-none` | `outline-hidden` |
| `bg-opacity-50` | `bg-black/50` (opacity modifier) |
| `text-opacity-75` | `text-white/75` |

---

### CSS Variables & Tokens

All theme tokens are defined as HSL channel values (no `hsl()` wrapper in the variable itself):

```css
/* Definition in globals.css :root */
--primary: 195 100% 40%;

/* Usage in CSS */
color: hsl(var(--primary));

/* Usage in Tailwind (wired via tailwind.config.mjs) */
className="bg-primary text-primary-foreground"
```

**Token reference:**

| Token | Light | Dark | Tailwind class |
|-------|-------|------|----------------|
| `--background` | slate-50 | deep navy | `bg-background` |
| `--foreground` | near-black | off-white | `text-foreground` |
| `--primary` | teal | electric cyan | `bg-primary`, `text-primary` |
| `--secondary` | light slate | dark navy | `bg-secondary` |
| `--muted` | very light slate | dark navy | `bg-muted` |
| `--muted-foreground` | mid grey | mid grey | `text-muted-foreground` |
| `--accent` | green | green | `bg-accent` |
| `--card` | white-ish | dark navy | `bg-card` |
| `--border` | light grey | dark navy | `border-border` |
| `--destructive` | red | dark red | `bg-destructive` |
| `--success` | green | dark green | `border-success`, `bg-success/30` |
| `--warning` | amber | dark amber | `border-warning`, `bg-warning/30` |
| `--error` | red | dark red | `border-error`, `bg-error/30` |

**OrcaClub brand tokens** — wired into `@theme` so they generate full Tailwind utilities:

| Token | Value | Tailwind utilities |
|-------|-------|-------------------|
| `--color-orca-cyan` | `hsl(195 100% 50%)` | `bg-orca-cyan` `text-orca-cyan` `border-orca-cyan` |
| `--color-orca-green` | `hsl(160 100% 50%)` | `bg-orca-green` `text-orca-green` `border-orca-green` |
| `--color-orca-deep` | `hsl(220 40% 6%)` | `bg-orca-deep` `text-orca-deep` |
| `--color-orca-navy` | `hsl(220 35% 10%)` | `bg-orca-navy` `text-orca-navy` |
| `--color-orca-surface` | `hsl(220 30% 14%)` | `bg-orca-surface` `text-orca-surface` |

```typescript
// ✅ Use Tailwind utilities — never hardcode hsl() values inline
<span className="text-orca-cyan">Electric teal</span>
<div className="bg-orca-deep text-orca-cyan border border-orca-navy">
// With opacity modifier
<div className="bg-orca-cyan/10 hover:bg-orca-cyan/20">
```

---

### Dark Mode

Dark mode uses a `[data-theme='dark']` **attribute selector** managed by `@custom-variant`:

```css
/* globals.css */
@custom-variant dark (&:is([data-theme="dark"] *));
```

```typescript
// In components — dark: variant works automatically
className="bg-white dark:bg-card"
className="text-foreground dark:text-foreground"  // tokens handle this automatically
```

**FOUC prevention:** `html { opacity: 0 }` until `data-theme` is set by `src/providers/Theme/`. **Never remove this.**

The theme provider sets `data-theme="light"` or `data-theme="dark"` on `<html>`. Components built with token classes (`bg-background`, `text-foreground`) automatically adapt — no `dark:` needed for those.

---

### Typography / Fonts

Three font families are available:

```typescript
// Available as CSS variables (set by Next.js font loader in layout.tsx)
var(--font-geist-sans)   // body text — loaded via geist package
var(--font-geist-mono)   // code — loaded via geist package
// Syne, Cormorant Garamond, UnifrakturMaguntia — loaded via Google Fonts in globals.css
```

```typescript
// Via Tailwind
className="font-sans"     // Geist Sans (body default)
className="font-mono"     // Geist Mono
className="font-display"  // Syne (headings) — defined as .font-display in @layer base
```

```tsx
// Inline for Cormorant Garamond (logo / hero wordmark)
style={{ fontFamily: "'Cormorant Garamond', serif" }}

// Inline for UnifrakturMaguntia (gothic accent)
style={{ fontFamily: "'UnifrakturMaguntia', serif" }}
```

---

### `cn()` Utility

Always use `cn()` for conditional or merged class names:

```typescript
// ✅ CORRECT import path
import { cn } from '@/utilities/ui'

// Usage: merges clsx + tailwind-merge (resolves conflicts)
className={cn('base-classes', condition && 'conditional-class', className)}
className={cn(buttonVariants({ size, variant }), className)}
```

**Never concatenate class strings manually** — always use `cn()` to avoid specificity conflicts with Tailwind.

---

### Container

```typescript
// Standard page container — auto-centered, responsive padding
className="container"

// Defined via @utility container in globals.css (Tailwind v4 CSS-first):
// - margin-inline: auto (centered)
// - padding-inline: 1rem mobile, 2rem md+
// - max-width: 40rem (sm) → 48rem (md) → 64rem (lg) → 80rem (xl) → 86rem (2xl)
// Do NOT add mx-auto alongside container — it's already built in
```

---

### Typography Plugin (Prose)

```typescript
// Basic prose for rich text
className="prose"

// Responsive size variant
className="prose md:prose-md"

// Dark mode inversion
className="prose dark:prose-invert"

// Disable max-width constraint
className="prose max-w-none"
```

---

### Quick Checklist

- ✅ New color? → Add to `:root` and `[data-theme='dark']` in `globals.css`
- ✅ Component style? → Tailwind classes via `cn()`
- ✅ Need dark mode? → Either use token classes (auto) or add `dark:` variant
- ✅ Forced class (dynamic)? → Add to `@source inline()` in `globals.css`
- ✅ Admin UI tweak? → `custom.scss` only
- ✅ New font? → Add Google Fonts `@import` at top of `globals.css`
- ❌ Never use `@apply` for new code — use Tailwind classes in JSX instead
- ❌ Never hardcode colors
- ❌ Never add `<style>` tags to components
- ❌ Never use `dark` class strategy — this project uses `[data-theme]` attribute

---

## TypeScript Best Practices

### Strict Mode (CRITICAL)

This project uses **strict TypeScript** - all nullable types must be explicitly handled.

**Common Null Safety Patterns:**

```typescript
// ❌ WRONG
const height = window.visualViewport.height  // Error: possibly null

// ✅ CORRECT
if (!window.visualViewport) return
const visualViewport = window.visualViewport
const height = visualViewport.height

// ✅ Optional chaining
const name = result.user?.profile?.name

// ✅ Nullish coalescing
const name = result.user?.profile?.name ?? 'Unknown'

// ✅ Array access
const firstName = items[0]?.name ?? 'Default'
```

**Relationship Fields:**

```typescript
// Media can be string (ID) or object
function isMediaObject(media: Media | string | null): media is Media {
  return typeof media === 'object' && media !== null && 'url' in media
}

if (isMediaObject(result.image)) {
  return <Image src={result.image.url} alt={result.image.alt || ''} />
}
```

**Null Safety Checklist:**
1. ✅ Browser API? → Add null check
2. ✅ Array access? → Check length or use `?.`
3. ✅ Relationship field? → Type guard or `?.`
4. ✅ Ref? → Use `.current?.` or null check
5. ✅ Optional in type? → Use `?.` or provide default

---

## CRITICAL SECURITY PATTERNS

### 1. Local API Access Control (MOST IMPORTANT)

**By default, Local API bypasses access control. You MUST set `overrideAccess: false` when passing `user`.**

```typescript
// ❌ SECURITY BUG: Access control bypassed
await payload.find({
  collection: 'posts',
  user: someUser,  // Ignored! Runs with ADMIN privileges
})

// ✅ SECURE: Enforces user permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false,  // REQUIRED
})

// ✅ Administrative operation (intentional bypass)
await payload.find({
  collection: 'posts',
  // No user parameter = admin access
})
```

### 2. Transaction Safety in Hooks

**Always pass `req` to nested operations to maintain atomicity.**

```typescript
// ❌ DATA CORRUPTION RISK: Separate transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        // Missing req - runs in separate transaction!
      })
    },
  ],
}

// ✅ ATOMIC: Same transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req,  // Maintains atomicity
      })
    },
  ],
}
```

### 3. Prevent Infinite Hook Loops

**Use context flags to prevent recursive hook triggers.**

```typescript
// ❌ INFINITE LOOP
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        req,
      })  // Triggers afterChange again!
    },
  ],
}

// ✅ SAFE: Use context flag
hooks: {
  afterChange: [
    async ({ doc, req, context }) => {
      if (context.skipHooks) return

      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        context: { skipHooks: true },
        req,
      })
    },
  ],
}
```

---

## Access Control Patterns

This project uses three access patterns (defined in `src/access/`):

```typescript
// Anyone (public)
export const anyone: Access = () => true

// Authenticated only
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

// Authenticated users see all, public sees only published
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```

**Usage:**

```typescript
import { authenticated, anyone, authenticatedOrPublished } from '@/access'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
    delete: authenticated,
  },
}
```

**Field-Level Access (Boolean Only):**

```typescript
{
  name: 'salary',
  type: 'number',
  access: {
    read: ({ req: { user }, doc }) => {
      if (user?.id === doc?.id) return true  // Self
      return user?.roles?.includes('admin')  // Admin
    },
  },
}
```

---

## Media Manager System

**The most important project-specific feature.** This is a production-grade media library ported from KAWAI project.

### Architecture

1. **Enhanced Media Collection** (`src/collections/Media.ts`)
   - Comprehensive metadata (alt, caption, description, SEO, copyright)
   - Responsive variants (mobile, tablet, desktop, largeDesktop)
   - Video metadata (duration, thumbnail, autoplay, muted)
   - Folder organization, tags, featured flag

2. **Field Utilities** (`src/lib/payload/fields/media.ts`)
   - Factory functions for consistent field configuration
   - Automatic "Browse Media Library" button integration

3. **Admin Components** (`src/components/admin/media-manager/`)
   - MediaManagerModal, MediaGrid, FolderTree, ImageEditor, etc.

4. **Global Provider** (`src/components/admin/AdminRootProvider.tsx`)
   - Wraps entire admin UI with context + floating button

### Using Field Utilities (MANDATORY)

**ALWAYS use field utilities, NEVER raw upload fields:**

```typescript
import { imageField, videoField, mediaArrayField } from '@/lib/payload/fields/media'

export const Products: CollectionConfig = {
  slug: 'products',
  fields: [
    // ✅ CORRECT
    imageField('featuredImage', {
      required: true,
      admin: { description: 'Main product image (1200x800px recommended)' },
    }),

    // ✅ Gallery
    mediaArrayField('gallery', {
      minRows: 3,
      maxRows: 12,
      admin: { description: 'Product image gallery' },
    }),

    // ✅ Video
    videoField('demoVideo', {
      admin: { description: 'Product demo video' },
    }),

    // ❌ WRONG: Don't use raw upload fields
    // {
    //   name: 'image',
    //   type: 'upload',
    //   relationTo: 'media',
    // },
  ],
}
```

### Available Field Utilities

1. `mediaField(name, options)` - Standard media upload (all types)
2. `imageField(name, options)` - Image-only upload (filtered)
3. `videoField(name, options)` - Video-only upload (filtered)
4. `mediaArrayField(name, options)` - Array for galleries
5. `responsiveImageGroup(label)` - Desktop + mobile image group

**Benefits:**
- Automatic "📂 Browse Media Library" button
- Consistent configuration across collections
- Built-in filtering by media type
- Cleaner, more maintainable code

### Accessing the Media Manager

**From Upload Fields:**
Any field using `imageField()`, `videoField()`, or `mediaField()` will have a "Browse Media Library" button.

**From Floating Button:**
Click the media icon in bottom-right corner of admin UI.

**Programmatically:**
```typescript
'use client'
import { useMediaManager } from '@/components/admin/media-manager/MediaManagerProvider'

export function MyComponent() {
  const { openModal } = useMediaManager()

  const handleClick = () => {
    openModal({
      mode: 'select',
      onSelect: (media) => console.log('Selected:', media),
    })
  }

  return <button onClick={handleClick}>Open Media Library</button>
}
```

### Troubleshooting

**Media Selector Button Not Appearing:**
1. Verify you're using field utilities (`imageField()`, not raw `type: 'upload'`)
2. Run `bun run generate:importmap`
3. Verify `AdminRootProvider` is in `payload.config.ts`
4. Clear browser cache and restart dev server

**TypeScript Errors:**
```bash
bun run generate:types
```

**Import Map Issues:**
```bash
bun run generate:importmap
```

---

## Custom Admin Components

Components are defined using **file paths** (not imports) in `payload.config.ts`:

```typescript
export default buildConfig({
  admin: {
    components: {
      providers: ['/components/admin/AdminRootProvider#AdminRootProvider'],
    },
  },
})
```

**Component Path Rules:**
- Paths relative to project root or `config.admin.importMap.baseDir`
- Named exports: use `#ExportName` suffix
- Default exports: no suffix needed
- File extensions can be omitted

**Server vs Client Components:**

All components are **Server Components by default**. Use `'use client'` directive for client components.

```tsx
// Server Component (default) - can use Local API directly
import type { Payload } from 'payload'

async function MyServerComponent({ payload }: { payload: Payload }) {
  const posts = await payload.find({ collection: 'posts' })
  return <div>{posts.totalDocs} posts</div>
}

export default MyServerComponent
```

```tsx
// Client Component - needs 'use client' directive
'use client'
import { useState } from 'react'
import { useAuth } from '@payloadcms/ui'

export function MyClientComponent() {
  const [count, setCount] = useState(0)
  const { user } = useAuth()
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
}
```

**When to use Client Components:**
- State (useState, useReducer)
- Effects (useEffect)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)

**Regenerate Import Map:**
After adding/modifying admin components, run:
```bash
bun run generate:importmap
```

---

## Hook Patterns

```typescript
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    // Before validation - format data
    beforeValidate: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],

    // Before save - business logic
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'update' && data.status === 'published') {
          data.publishedAt = new Date()
        }
        return data
      },
    ],

    // After save - side effects (with loop prevention)
    afterChange: [
      async ({ doc, req, context }) => {
        if (context.skipNotification) return
        await sendNotification(doc)
      },
    ],

    // After read - computed fields
    afterRead: [
      async ({ doc }) => {
        doc.viewCount = await getViewCount(doc.id)
        return doc
      },
    ],

    // Before delete - cascading deletes
    beforeDelete: [
      async ({ req, id }) => {
        await req.payload.delete({
          collection: 'comments',
          where: { post: { equals: id } },
          req,  // IMPORTANT for transaction
        })
      },
    ],
  },
}
```

---

## Development Workflow

### Starting Development

```bash
bun install
cp .env.example .env.local
# Edit .env.local with your values
bun run dev
```

**Access Points:**
- App: http://localhost:3000
- Admin: http://localhost:3000/admin
- GraphQL: http://localhost:3000/api/graphql-playground

### Environment Variables

```bash
# Database (MongoDB)
DATABASE_URL=mongodb+srv://...

# Payload CMS
PAYLOAD_SECRET=your-secret-32-chars-minimum

# Site URL
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Revalidation
REVALIDATION_SECRET=your-revalidation-secret

# Storage (optional - Cloudflare R2)
S3_BUCKET=your-bucket
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
S3_ENDPOINT=https://account-id.r2.cloudflarestorage.com
NEXT_PUBLIC_S3_PUBLIC_URL=https://pub-your-bucket.r2.dev
```

### Code Validation Workflow

**Before code is considered complete:**

```bash
# 1. Lint TypeScript
bun run lint

# 2. Build with type checking (MANDATORY)
bun run build

# 3. Generate types after schema changes
bun run generate:types

# 4. Regenerate import map after component changes
bun run generate:importmap
```

---

## Project-Specific Gotchas

1. **Bun Only** - npm causes dependency conflicts, always use bun
2. **Import Map** - Regenerate after adding/modifying admin components
3. **Field Utilities** - Never use raw upload fields, always use utilities from `@/lib/payload/fields/media`
4. **Type Generation** - Types auto-generate on build, run manually after schema changes
5. **Local API Access** - Bypassed by default unless `overrideAccess: false`
6. **Transaction Safety** - Always pass `req` in hooks
7. **Strict TypeScript** - All nullable types must be explicitly handled
8. **AdminRootProvider** - Required for Media Manager to work globally

---

## Resources

- **Payload Docs**: https://payloadcms.com/docs
- **LLM Context**: https://payloadcms.com/llms-full.txt (use context7 to query)
- **GitHub**: https://github.com/payloadcms/payload
- **This Project**: Based on official Payload Website Template with enhanced Media Manager
