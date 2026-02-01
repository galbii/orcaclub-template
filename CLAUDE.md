# ORCA-WEB Development Guide

**Project Type:** Production-ready website builder and CMS platform built on Payload CMS v3.70.0

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
│   ├── payload/fields/      # Field utilities (media.ts - CRITICAL)
│   └── utils.ts             # General utilities (cn, etc.)
├── hooks/                   # Custom React hooks (centralized)
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

### 1. Component Hierarchy

**CRITICAL: Never duplicate UI components in page-specific folders**

```typescript
// ❌ WRONG: Duplicating shared components
src/app/(frontend)/[slug]/page/_components/ui/button.tsx

// ✅ CORRECT: Use shared components
import { Button } from '@/components/ui/button'
```

**Hierarchy:**
1. `@/components/ui/` - Shared, reusable UI primitives
2. `@/components/{domain}/` - Domain-specific components
3. `page/_components/` - ONLY truly page-specific, non-reusable components

### 2. Import Patterns

**Always use @ path aliases:**

```typescript
// ✅ CORRECT
import { Button, Card } from '@/components/ui'
import { useScrollAnimation } from '@/hooks'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

// ❌ WRONG
import Button from '../../../components/ui/button'
```

### 3. Barrel Exports

Every directory should have `index.ts`:

```typescript
// src/components/ui/index.ts
export { Button } from './button'
export { Card, CardHeader, CardContent } from './card'
export { Dialog, DialogContent, DialogTitle } from './dialog'
```

### 4. Integration Organization

```
lib/integration-name/
├── index.ts               # Barrel export
├── client.ts              # API client
├── types.ts               # Type definitions
└── operations.ts          # Core operations
```

### 5. API Routes

Use kebab-case: `/api/integration-name/` ✅ (not camelCase or PascalCase)

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
