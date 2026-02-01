# Payload CMS Development Rules

You are an expert Payload CMS developer. When working with Payload projects, follow these rules:

## Core Principles

1. **Bun Runtime**: Always use Bun (never npm) - mandatory for consistency
2. **TypeScript-First**: Always use TypeScript with proper types from Payload
3. **Strict Null Safety**: Follow comprehensive null checking patterns (see TypeScript Best Practices)
4. **Security-Critical**: Follow all security patterns, especially access control
5. **Type Generation**: Run `generate:types` script after schema changes
6. **Transaction Safety**: Always pass `req` to nested operations in hooks
7. **Access Control**: Understand Local API bypasses access control by default
8. **Access Control**: Ensure roles exist when modifying collection or globals with access controls
9. **Media Manager**: Use field utilities from `@/lib/payload/fields/media` for all upload fields
10. **Code Validation**: Always run `bun run build` before code is complete

## Environment

- **Runtime**: Bun (mandatory - never use npm)
- **Package Manager**: Bun (use `bun` instead of npm/yarn/pnpm)
- **Common Commands**:
  - `bun run dev` - Start development server
  - `bun run build` - Production build + type generation
  - `bun run lint` - ESLint + TypeScript checks
  - `bun run generate:types` - Generate Payload types
  - `bun run generate:importmap` - Generate import map

### Code Validation

```bash
# Validate TypeScript
bun run lint

# Build with type checking
bun run build

# Generate types after schema changes
bun run generate:types

# Regenerate import map after component changes
bun run generate:importmap
```

**Always run `bun run build` before considering code complete.**

## TypeScript Best Practices

### CRITICAL: Null Safety Rules

Always check for null/undefined when working with browser APIs or optional properties:

**❌ WRONG - TypeScript will error:**
```typescript
// 'window.visualViewport' is possibly 'null'
const height = window.visualViewport.height

// 'user.profile' is possibly 'undefined'
const name = result.user.profile.name
```

**✅ CORRECT - Proper null checks:**
```typescript
// Store in variable after null check
if (!window.visualViewport) return
const visualViewport = window.visualViewport
const height = visualViewport.height

// Optional chaining
const name = result.user?.profile?.name

// Nullish coalescing with default
const name = result.user?.profile?.name ?? 'Unknown'

// Type guard with early return
if (!result.user?.profile) return
const name = result.user.profile.name
```

### Common Null Safety Patterns

**1. Browser APIs (always check for null):**
```typescript
// window.visualViewport can be null
if (typeof window === 'undefined' || !window.visualViewport) return
const viewport = window.visualViewport

// localStorage can be null in some browsers
const data = typeof window !== 'undefined' && window.localStorage
  ? localStorage.getItem('key')
  : null

// IntersectionObserver can be null
if (!window.IntersectionObserver) return
const observer = new IntersectionObserver(callback)
```

**2. Relationship Fields (Media, Products, etc.):**
```typescript
// Media can be string (ID) or object
function isMediaObject(media: Media | string | null): media is Media {
  return typeof media === 'object' && media !== null && 'url' in media
}

if (isMediaObject(result.image)) {
  return <Image src={result.image.url} alt={result.image.alt || ''} />
}

// Product relationships
const productName = typeof result.product === 'string'
  ? result.product
  : result.product?.name ?? 'Unknown'
```

**3. Optional DOM References:**
```typescript
// useRef can be null
const inputRef = useRef<HTMLInputElement>(null)

// Always check before using
inputRef.current?.focus()
inputRef.current?.scrollIntoView()

// Or with guard
if (inputRef.current) {
  inputRef.current.value = ''
}
```

**4. Array Operations:**
```typescript
// Array access can be undefined
const firstItem = items[0] // Type: Item | undefined

// Safe access
const name = items[0]?.name ?? 'Default'

// With type guard
if (items.length > 0) {
  const name = items[0].name // Now safe
}
```

**5. Event Handlers:**
```typescript
// Event target can be null
const handleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) return

  // Now safe to use target
  target.classList.add('active')
}
```

### TypeScript Configuration

This project uses **strict TypeScript** settings:

```json
{
  "compilerOptions": {
    "strict": true,                      // Enable all strict checks
    "noImplicitReturns": true,           // All code paths must return a value
    "noFallthroughCasesInSwitch": true,  // Switch cases must have breaks
    "noImplicitOverride": true           // Override must be explicit
  }
}
```

**What this means:**
- All nullable types must be explicitly handled
- No implicit `any` types allowed
- Functions must return values on all code paths
- Switch statements must be exhaustive
- Proper null checking is enforced

### Quick Reference: Null Safety Checklist

Before writing code that accesses properties, ask:

1. ✅ **Is this a browser API?** → Add null check
2. ✅ **Is this an array access?** → Check length or use optional chaining
3. ✅ **Is this a relationship field?** → Type guard or optional chaining
4. ✅ **Is this a ref?** → Use `.current?.` or null check
5. ✅ **Is this optional in the type?** → Use `?.` or provide default

### Error Prevention Workflow

When you see a TypeScript error:

1. **Read the error carefully** - TypeScript tells you exactly what's wrong
2. **Identify the nullable type** - Look at the variable's type
3. **Add appropriate check** - Use patterns above
4. **Verify with build** - Run `bun run build` to confirm

**Always run `bun run build` before considering code complete.**

## Project Structure

```
src/
├── app/
│   ├── (frontend)/          # Frontend routes
│   │   ├── page.tsx         # Homepage
│   │   └── api/             # Frontend API routes
│   │       └── revalidate/  # On-demand ISR revalidation
│   └── (payload)/           # CMS & API routes
│       ├── admin/           # Payload admin UI (/admin)
│       └── api/             # Payload REST/GraphQL APIs
├── collections/             # Payload CMS collections
├── globals/                 # Payload global configs
├── components/              # React components (organized by domain)
│   ├── ui/                  # Shared reusable UI components
│   ├── admin/               # Custom admin components
│   │   └── media-manager/   # Media Manager system
│   └── layout/              # Header, footer, navigation
├── lib/                     # Utilities and integrations
│   ├── payload/             # Payload CMS utilities
│   │   ├── fields/          # Field utilities (media.ts, etc.)
│   │   └── access/          # Access control functions
│   └── utils.ts             # General utilities (cn, etc.)
├── hooks/                   # Custom React hooks (consolidated)
├── types/                   # TypeScript type definitions
├── access/                  # Access control functions
└── payload.config.ts        # Main Payload configuration
```

## Code Organization Principles

### 1. Component Organization

**CRITICAL: Never duplicate UI components in page-specific folders**

```typescript
// ❌ WRONG: Duplicating shared components in page folders
src/app/(frontend)/[slug]/some-page/_components/ui/button.tsx  // DON'T DO THIS
src/app/(frontend)/[slug]/some-page/_components/ui/card.tsx    // DON'T DO THIS

// ✅ CORRECT: Use shared components from @/components/ui
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

**Component hierarchy:**
1. `@/components/ui/` - Shared, reusable UI primitives (Button, Card, Dialog, Input)
2. `@/components/{domain}/` - Domain-specific components
3. `page/_components/` - ONLY for truly page-specific, non-reusable components

### 2. Import Patterns

**Always use path aliases:**

```typescript
// ✅ Preferred imports
import { Button, Card, Dialog } from '@/components/ui'
import { useScrollAnimation } from '@/hooks'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

// ❌ Avoid relative imports across directories
import Button from '../../../components/ui/button'
```

### 3. Barrel Exports

**Every directory should have an index.ts barrel export:**

```typescript
// src/components/ui/index.ts
export { Button } from './button'
export { Card, CardHeader, CardContent } from './card'
export { Dialog, DialogContent, DialogTitle } from './dialog'
// ... etc
```

**Benefits:**
- Cleaner imports: `import { Button, Card } from '@/components/ui'`
- Easier refactoring
- Clear public API for each module

### 4. Integration Organization

**Each integration should be self-contained in its own folder:**

```
lib/integration-name/      # ✅ Good: Well-organized integration
├── index.ts               # Barrel export with documentation
├── client.ts              # API client
├── types.ts               # Type definitions
├── queries.ts             # Queries (if applicable)
└── operations.ts          # Core operations
```

**Rules for integrations:**
- Single folder per integration (`lib/shopify/`, `lib/stripe/`)
- Single API route prefix (`/api/integration-name/`)
- Types co-located with implementation
- Comprehensive barrel export

### 5. Hooks Organization

**All hooks live in `src/hooks/`:**

```typescript
// ✅ Correct: Import from centralized hooks
import { useScrollAnimation } from '@/hooks'

// ❌ Wrong: Page-specific hooks folder
import { useAnimation } from '../_components/hooks/useAnimation'
```

**Exception:** Hooks with tightly-coupled page dependencies may remain page-local, but this should be rare.

### 6. API Route Naming

**Use kebab-case for all API routes:**

```
/api/integration-name/    ✅ Correct
/api/integrationname/     ❌ Wrong (camelCase)
/api/IntegrationName/     ❌ Wrong (PascalCase)
```

## Configuration

### Minimal Config Pattern

```typescript
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL,
  }),
})
```

## Collections

### Basic Collection

```typescript
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'createdAt'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true },
    { name: 'content', type: 'richText' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
  timestamps: true,
}
```

### Auth Collection with RBAC

```typescript
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      defaultValue: ['user'],
      required: true,
      saveToJWT: true, // Include in JWT for fast access checks
      access: {
        update: ({ req: { user } }) => user?.roles?.includes('admin'),
      },
    },
  ],
}
```

## Fields

### Common Patterns

```typescript
// Auto-generate slugs
import { slugField } from 'payload'
slugField({ fieldToUse: 'title' })

// Relationship with filtering
{
  name: 'category',
  type: 'relationship',
  relationTo: 'categories',
  filterOptions: { active: { equals: true } },
}

// Conditional field
{
  name: 'featuredImage',
  type: 'upload',
  relationTo: 'media',
  admin: {
    condition: (data) => data.featured === true,
  },
}

// Virtual field
{
  name: 'fullName',
  type: 'text',
  virtual: true,
  hooks: {
    afterRead: [({ siblingData }) => `${siblingData.firstName} ${siblingData.lastName}`],
  },
}
```

## CRITICAL SECURITY PATTERNS

### 1. Local API Access Control (MOST IMPORTANT)

```typescript
// ❌ SECURITY BUG: Access control bypassed
await payload.find({
  collection: 'posts',
  user: someUser, // Ignored! Operation runs with ADMIN privileges
})

// ✅ SECURE: Enforces user permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false, // REQUIRED
})

// ✅ Administrative operation (intentional bypass)
await payload.find({
  collection: 'posts',
  // No user, overrideAccess defaults to true
})
```

**Rule**: When passing `user` to Local API, ALWAYS set `overrideAccess: false`

### 2. Transaction Safety in Hooks

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
        req, // Maintains atomicity
      })
    },
  ],
}
```

**Rule**: ALWAYS pass `req` to nested operations in hooks

### 3. Prevent Infinite Hook Loops

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
      }) // Triggers afterChange again!
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

## Access Control

### Collection-Level Access

```typescript
import type { Access } from 'payload'

// Boolean return
const authenticated: Access = ({ req: { user } }) => Boolean(user)

// Query constraint (row-level security)
const ownPostsOnly: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user?.roles?.includes('admin')) return true

  return {
    author: { equals: user.id },
  }
}

// Async access check
const projectMemberAccess: Access = async ({ req, id }) => {
  const { user, payload } = req

  if (!user) return false
  if (user.roles?.includes('admin')) return true

  const project = await payload.findByID({
    collection: 'projects',
    id: id as string,
    depth: 0,
  })

  return project.members?.includes(user.id)
}
```

### Field-Level Access

```typescript
// Field access ONLY returns boolean (no query constraints)
{
  name: 'salary',
  type: 'number',
  access: {
    read: ({ req: { user }, doc }) => {
      // Self can read own salary
      if (user?.id === doc?.id) return true
      // Admin can read all
      return user?.roles?.includes('admin')
    },
    update: ({ req: { user } }) => {
      // Only admins can update
      return user?.roles?.includes('admin')
    },
  },
}
```

### Common Access Patterns

```typescript
// Anyone
export const anyone: Access = () => true

// Authenticated only
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

// Admin only
export const adminOnly: Access = ({ req: { user } }) => {
  return user?.roles?.includes('admin')
}

// Admin or self
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  return { id: { equals: user?.id } }
}

// Published or authenticated
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```

## Hooks

### Common Hook Patterns

```typescript
import type { CollectionConfig } from 'payload'

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
      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'update' && data.status === 'published') {
          data.publishedAt = new Date()
        }
        return data
      },
    ],

    // After save - side effects
    afterChange: [
      async ({ doc, req, operation, previousDoc, context }) => {
        // Check context to prevent loops
        if (context.skipNotification) return

        if (operation === 'create') {
          await sendNotification(doc)
        }
        return doc
      },
    ],

    // After read - computed fields
    afterRead: [
      async ({ doc, req }) => {
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
          req, // Important for transaction
        })
      },
    ],
  },
}
```

## Queries

### Local API

```typescript
// Find with complex query
const posts = await payload.find({
  collection: 'posts',
  where: {
    and: [{ status: { equals: 'published' } }, { 'author.name': { contains: 'john' } }],
  },
  depth: 2, // Populate relationships
  limit: 10,
  sort: '-createdAt',
  select: {
    title: true,
    author: true,
  },
})

// Find by ID
const post = await payload.findByID({
  collection: 'posts',
  id: '123',
  depth: 2,
})

// Create
const newPost = await payload.create({
  collection: 'posts',
  data: {
    title: 'New Post',
    status: 'draft',
  },
})

// Update
await payload.update({
  collection: 'posts',
  id: '123',
  data: { status: 'published' },
})

// Delete
await payload.delete({
  collection: 'posts',
  id: '123',
})
```

### Query Operators

```typescript
// Equals
{ status: { equals: 'published' } }

// Not equals
{ status: { not_equals: 'draft' } }

// Greater than / less than
{ price: { greater_than: 100 } }
{ age: { less_than_equal: 65 } }

// Contains (case-insensitive)
{ title: { contains: 'payload' } }

// Like (all words present)
{ description: { like: 'cms headless' } }

// In array
{ category: { in: ['tech', 'news'] } }

// Exists
{ image: { exists: true } }

// Near (geospatial)
{ location: { near: [-122.4194, 37.7749, 10000] } }
```

### AND/OR Logic

```typescript
{
  or: [
    { status: { equals: 'published' } },
    { author: { equals: user.id } },
  ],
}

{
  and: [
    { status: { equals: 'published' } },
    { featured: { equals: true } },
  ],
}
```

## Getting Payload Instance

```typescript
// In API routes (Next.js)
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'posts',
  })

  return Response.json(posts)
}

// In Server Components
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function Page() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'posts' })

  return <div>{docs.map(post => <h1 key={post.id}>{post.title}</h1>)}</div>
}
```

## Components

The Admin Panel can be extensively customized using React Components. Custom Components can be Server Components (default) or Client Components.

### Defining Components

Components are defined using **file paths** (not direct imports) in your config:

**Component Path Rules:**

- Paths are relative to project root or `config.admin.importMap.baseDir`
- Named exports: use `#ExportName` suffix or `exportName` property
- Default exports: no suffix needed
- File extensions can be omitted

```typescript
import { buildConfig } from 'payload'

export default buildConfig({
  admin: {
    components: {
      // Logo and branding
      graphics: {
        Logo: '/components/Logo',
        Icon: '/components/Icon',
      },

      // Navigation
      Nav: '/components/CustomNav',
      beforeNavLinks: ['/components/CustomNavItem'],
      afterNavLinks: ['/components/NavFooter'],

      // Header
      header: ['/components/AnnouncementBanner'],
      actions: ['/components/ClearCache', '/components/Preview'],

      // Dashboard
      beforeDashboard: ['/components/WelcomeMessage'],
      afterDashboard: ['/components/Analytics'],

      // Auth
      beforeLogin: ['/components/SSOButtons'],
      logout: { Button: '/components/LogoutButton' },

      // Settings
      settingsMenu: ['/components/SettingsMenu'],

      // Views
      views: {
        dashboard: { Component: '/components/CustomDashboard' },
      },
    },
  },
})
```

**Component Path Rules:**

- Paths are relative to project root or `config.admin.importMap.baseDir`
- Named exports: use `#ExportName` suffix or `exportName` property
- Default exports: no suffix needed
- File extensions can be omitted

### Component Types

1. **Root Components** - Global Admin Panel (logo, nav, header)
2. **Collection Components** - Collection-specific (edit view, list view)
3. **Global Components** - Global document views
4. **Field Components** - Custom field UI and cells

### Component Types

1. **Root Components** - Global Admin Panel (logo, nav, header)
2. **Collection Components** - Collection-specific (edit view, list view)
3. **Global Components** - Global document views
4. **Field Components** - Custom field UI and cells

### Server vs Client Components

**All components are Server Components by default** (can use Local API directly):

```tsx
// Server Component (default)
import type { Payload } from 'payload'

async function MyServerComponent({ payload }: { payload: Payload }) {
  const posts = await payload.find({ collection: 'posts' })
  return <div>{posts.totalDocs} posts</div>
}

export default MyServerComponent
```

**Client Components** need the `'use client'` directive:

```tsx
'use client'
import { useState } from 'react'
import { useAuth } from '@payloadcms/ui'

export function MyClientComponent() {
  const [count, setCount] = useState(0)
  const { user } = useAuth()

  return (
    <button onClick={() => setCount(count + 1)}>
      {user?.email}: Clicked {count} times
    </button>
  )
}
```

### Using Hooks (Client Components Only)

```tsx
'use client'
import {
  useAuth, // Current user
  useConfig, // Payload config (client-safe)
  useDocumentInfo, // Document info (id, collection, etc.)
  useField, // Field value and setter
  useForm, // Form state
  useFormFields, // Multiple field values (optimized)
  useLocale, // Current locale
  useTranslation, // i18n translations
  usePayload, // Local API methods
} from '@payloadcms/ui'

export function MyComponent() {
  const { user } = useAuth()
  const { config } = useConfig()
  const { id, collection } = useDocumentInfo()
  const locale = useLocale()
  const { t } = useTranslation()

  return <div>Hello {user?.email}</div>
}
```

### Collection/Global Components

```typescript
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    components: {
      // Edit view
      edit: {
        PreviewButton: '/components/PostPreview',
        SaveButton: '/components/CustomSave',
        SaveDraftButton: '/components/SaveDraft',
        PublishButton: '/components/Publish',
      },

      // List view
      list: {
        Header: '/components/ListHeader',
        beforeList: ['/components/BulkActions'],
        afterList: ['/components/ListFooter'],
      },
    },
  },
}
```

### Field Components

```typescript
{
  name: 'status',
  type: 'select',
  options: ['draft', 'published'],
  admin: {
    components: {
      // Edit view field
      Field: '/components/StatusField',
      // List view cell
      Cell: '/components/StatusCell',
      // Field label
      Label: '/components/StatusLabel',
      // Field description
      Description: '/components/StatusDescription',
      // Error message
      Error: '/components/StatusError',
    },
  },
}
```

**UI Field** (presentational only, no data):

```typescript
{
  name: 'refundButton',
  type: 'ui',
  admin: {
    components: {
      Field: '/components/RefundButton',
    },
  },
}
```

### Performance Best Practices

1. **Import correctly:**

   - Admin Panel: `import { Button } from '@payloadcms/ui'`
   - Frontend: `import { Button } from '@payloadcms/ui/elements/Button'`

2. **Optimize re-renders:**

   ```tsx
   // ❌ BAD: Re-renders on every form change
   const { fields } = useForm()

   // ✅ GOOD: Only re-renders when specific field changes
   const value = useFormFields(([fields]) => fields[path])
   ```

3. **Prefer Server Components** - Only use Client Components when you need:

   - State (useState, useReducer)
   - Effects (useEffect)
   - Event handlers (onClick, onChange)
   - Browser APIs (localStorage, window)

4. **Minimize serialized props** - Server Components serialize props sent to client

### Styling Components

```tsx
import './styles.scss'

export function MyComponent() {
  return <div className="my-component">Content</div>
}
```

```scss
// Use Payload's CSS variables
.my-component {
  background-color: var(--theme-elevation-500);
  color: var(--theme-text);
  padding: var(--base);
  border-radius: var(--border-radius-m);
}

// Import Payload's SCSS library
@import '~@payloadcms/ui/scss';

.my-component {
  @include mid-break {
    background-color: var(--theme-elevation-900);
  }
}
```

### Type Safety

```tsx
import type {
  TextFieldServerComponent,
  TextFieldClientComponent,
  TextFieldCellComponent,
  SelectFieldServerComponent,
  // ... etc
} from 'payload'

export const MyField: TextFieldClientComponent = (props) => {
  // Fully typed props
}
```

### Import Map

Payload auto-generates `app/(payload)/admin/importMap.js` to resolve component paths.

**Regenerate manually:**

```bash
payload generate:importmap
```

**Set custom location:**

```typescript
export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, 'src'),
      importMapFile: path.resolve(dirname, 'app', 'custom-import-map.js'),
    },
  },
})
```

## Custom Endpoints

```typescript
import type { Endpoint } from 'payload'
import { APIError } from 'payload'

// Always check authentication
export const protectedEndpoint: Endpoint = {
  path: '/protected',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    // Use req.payload for database operations
    const data = await req.payload.find({
      collection: 'posts',
      where: { author: { equals: req.user.id } },
    })

    return Response.json(data)
  },
}

// Route parameters
export const trackingEndpoint: Endpoint = {
  path: '/:id/tracking',
  method: 'get',
  handler: async (req) => {
    const { id } = req.routeParams

    const tracking = await getTrackingInfo(id)

    if (!tracking) {
      return Response.json({ error: 'not found' }, { status: 404 })
    }

    return Response.json(tracking)
  },
}
```

## Drafts & Versions

```typescript
export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
      validate: false, // Don't validate drafts
    },
    maxPerDoc: 100,
  },
  access: {
    read: ({ req: { user } }) => {
      // Public sees only published
      if (!user) return { _status: { equals: 'published' } }
      // Authenticated sees all
      return true
    },
  },
}

// Create draft
await payload.create({
  collection: 'pages',
  data: { title: 'Draft Page' },
  draft: true, // Skips required field validation
})

// Read with drafts
const page = await payload.findByID({
  collection: 'pages',
  id: '123',
  draft: true, // Returns draft if available
})
```

## Field Type Guards

```typescript
import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsArrayType,
  fieldIsBlockType,
  fieldSupportsMany,
  fieldHasMaxDepth,
} from 'payload'

function processField(field: Field) {
  // Check if field stores data
  if (fieldAffectsData(field)) {
    console.log(field.name) // Safe to access
  }

  // Check if field has nested fields
  if (fieldHasSubFields(field)) {
    field.fields.forEach(processField) // Safe to access
  }

  // Check field type
  if (fieldIsArrayType(field)) {
    console.log(field.minRows, field.maxRows)
  }

  // Check capabilities
  if (fieldSupportsMany(field) && field.hasMany) {
    console.log('Multiple values supported')
  }
}
```

## Development Workflow

### Starting Development

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Start development
bun run dev

# Access points
# App: http://localhost:3000
# Admin: http://localhost:3000/admin
# GraphQL: http://localhost:3000/api/graphql-playground
```

### Environment Variables

```bash
# Database
DATABASE_URI=mongodb+srv://... # or postgresql://...

# Payload CMS
PAYLOAD_SECRET=your-secret-32-chars-minimum

# Storage (if using cloud storage)
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
S3_ENDPOINT=https://...
S3_BUCKET=your-bucket
NEXT_PUBLIC_S3_PUBLIC_URL=https://...

# Revalidation
REVALIDATION_SECRET=your-revalidation-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Plugins

### Using Plugins

```typescript
import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'

export default buildConfig({
  plugins: [
    seoPlugin({
      collections: ['posts', 'pages'],
    }),
    redirectsPlugin({
      collections: ['pages'],
    }),
  ],
})
```

### Creating Plugins

```typescript
import type { Config, Plugin } from 'payload'

interface MyPluginConfig {
  collections?: string[]
  enabled?: boolean
}

export const myPlugin =
  (options: MyPluginConfig): Plugin =>
  (config: Config): Config => ({
    ...config,
    collections: config.collections?.map((collection) => {
      if (options.collections?.includes(collection.slug)) {
        return {
          ...collection,
          fields: [...collection.fields, { name: 'pluginField', type: 'text' }],
        }
      }
      return collection
    }),
  })
```

## Best Practices

### Security

1. Always set `overrideAccess: false` when passing `user` to Local API
2. Field-level access only returns boolean (no query constraints)
3. Default to restrictive access, gradually add permissions
4. Never trust client-provided data
5. Use `saveToJWT: true` for roles to avoid database lookups

### Performance

1. Index frequently queried fields
2. Use `select` to limit returned fields
3. Set `maxDepth` on relationships to prevent over-fetching
4. Use query constraints over async operations in access control
5. Cache expensive operations in `req.context`

### Data Integrity

1. Always pass `req` to nested operations in hooks
2. Use context flags to prevent infinite hook loops
3. Enable transactions for MongoDB (requires replica set) and Postgres
4. Use `beforeValidate` for data formatting
5. Use `beforeChange` for business logic

### Type Safety

1. Run `generate:types` after schema changes
2. Import types from generated `payload-types.ts`
3. Type your user object: `import type { User } from '@/payload-types'`
4. Use `as const` for field options
5. Use field type guards for runtime type checking

### Organization

1. Keep collections in separate files
2. Extract access control to `access/` directory
3. Extract hooks to `hooks/` directory
4. Use reusable field factories for common patterns
5. Document complex access control with comments

## Additional Context Files

For deeper exploration of specific topics, refer to the context files located in `.cursor/rules/`:

### Available Context Files

1. **`payload-overview.md`** - High-level architecture and core concepts

   - Payload structure and initialization
   - Configuration fundamentals
   - Database adapters overview

2. **`security-critical.md`** - Critical security patterns (⚠️ IMPORTANT)

   - Local API access control
   - Transaction safety in hooks
   - Preventing infinite hook loops

3. **`collections.md`** - Collection configurations

   - Basic collection patterns
   - Auth collections with RBAC
   - Upload collections
   - Drafts and versioning
   - Globals

4. **`fields.md`** - Field types and patterns

   - All field types with examples
   - Conditional fields
   - Virtual fields
   - Field validation
   - Common field patterns

5. **`field-type-guards.md`** - TypeScript field type utilities

   - Field type checking utilities
   - Safe type narrowing
   - Runtime field validation

6. **`access-control.md`** - Permission patterns

   - Collection-level access
   - Field-level access
   - Row-level security
   - RBAC patterns
   - Multi-tenant access control

7. **`access-control-advanced.md`** - Complex access patterns

   - Nested document access
   - Cross-collection permissions
   - Dynamic role hierarchies
   - Performance optimization

8. **`hooks.md`** - Lifecycle hooks

   - Collection hooks
   - Field hooks
   - Hook context patterns
   - Common hook recipes

9. **`queries.md`** - Database operations

   - Local API usage
   - Query operators
   - Complex queries with AND/OR
   - Performance optimization

10. **`endpoints.md`** - Custom API endpoints

    - REST endpoint patterns
    - Authentication in endpoints
    - Error handling
    - Route parameters

11. **`adapters.md`** - Database and storage adapters

    - MongoDB, PostgreSQL, SQLite patterns
    - Storage adapter usage (S3, Azure, GCS, etc.)
    - Custom adapter development

12. **`plugin-development.md`** - Creating plugins

    - Plugin architecture
    - Modifying configuration
    - Plugin hooks
    - Best practices

13. **`components.md`** - Custom Components

    - Component types (Root, Collection, Global, Field)
    - Server vs Client Components
    - Component paths and definition
    - Default and custom props
    - Using hooks
    - Performance best practices
    - Styling components

## Common Gotchas

1. **Local API Default**: Access control bypassed unless `overrideAccess: false`
2. **Transaction Safety**: Missing `req` in nested operations breaks atomicity
3. **Hook Loops**: Operations in hooks can trigger the same hooks
4. **Field Access**: Cannot use query constraints, only boolean
5. **Relationship Depth**: Default depth is 2, set to 0 for IDs only
6. **Type Generation**: Types auto-generate on build, not during dev
7. **MongoDB Transactions**: Require replica set configuration
8. **Revalidation**: Don't await fetch - use fire-and-forget pattern
9. **Bun Only**: npm causes dependency conflicts - always use bun
10. **Import Map**: Regenerate after adding/modifying components

## Media Manager System

This project includes a production-grade Media Manager ported from the KAWAI project. It provides comprehensive media management with folder organization, image editing, and advanced metadata.

### Architecture

The Media Manager consists of:

1. **Enhanced Media Collection** (`src/collections/Media.ts`)
2. **Field Utilities** (`src/lib/payload/fields/media.ts`)
3. **Admin Components** (`src/components/admin/media-manager/`)
4. **Global Provider** (`src/components/admin/AdminRootProvider.tsx`)

### Using Media Field Utilities

**ALWAYS use field utilities instead of raw upload fields:**

```typescript
import { imageField, videoField, mediaArrayField, responsiveImageGroup } from '@/lib/payload/fields/media'

export const Products: CollectionConfig = {
  slug: 'products',
  fields: [
    // ✅ CORRECT: Use imageField utility
    imageField('featuredImage', {
      required: true,
      admin: {
        description: 'Main product image (1200x800px recommended)',
      },
    }),

    // ✅ Gallery array
    mediaArrayField('gallery', {
      minRows: 3,
      maxRows: 12,
      admin: {
        description: 'Product image gallery',
      },
    }),

    // ✅ Video upload
    videoField('demoVideo', {
      admin: {
        description: 'Product demonstration video',
      },
    }),

    // ✅ Responsive images
    responsiveImageGroup('Hero Images'),

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

1. **`mediaField(name, options)`** - Standard media upload with library selector
2. **`imageField(name, options)`** - Image-only upload (filtered)
3. **`videoField(name, options)`** - Video-only upload (filtered)
4. **`mediaArrayField(name, options)`** - Array of media items for galleries
5. **`responsiveImageGroup(label)`** - Desktop + mobile image group

**Benefits:**
- Automatic "📂 Browse Media Library" button integration
- Consistent field configuration across collections
- Built-in filtering (images only, videos only, etc.)
- Cleaner, more maintainable code

### Media Collection Fields

The Media collection includes comprehensive metadata:

**Basic Information:**
- `alt` (required) - Alternative text for accessibility
- `caption` - Display caption
- `description` - Administrative description

**Classification:**
- `mediaType` - image | video | audio | document

**Video Metadata (conditional):**
- `videoMeta.duration` - Duration in seconds
- `videoMeta.thumbnail` - Custom thumbnail upload
- `videoMeta.autoplay` - Boolean
- `videoMeta.muted` - Boolean

**Responsive Variants (conditional for images):**
- `variants.mobile` - Mobile-optimized upload
- `variants.tablet` - Tablet-optimized upload
- `variants.desktop` - Desktop-optimized upload
- `variants.largeDesktop` - Large screen upload

**SEO Metadata:**
- `seoMeta.focusKeywords` - Keywords
- `seoMeta.photographerCredit` - Attribution
- `seoMeta.copyrightInfo` - Copyright/licensing
- `seoMeta.originalSource` - External source URL

**Organization:**
- `featured` - Featured media flag
- `tags` - Array of tags for categorization
- `folder` - Folder organization (built-in Payload feature)

### Media Manager Features

**Upload Workflow:**
1. Drag & drop files into the modal
2. Images automatically open in editor
3. Crop, rotate, adjust quality
4. Add comprehensive metadata
5. Upload to storage

**Library Management:**
- Folder organization with tree navigation
- Search by filename or alt text
- Pagination (24 items per page)
- Copy public URLs
- Edit metadata after upload
- Move media between folders
- Delete media

**Dual-Mode Operation:**
- **Browse Mode**: General library management (floating button)
- **Select Mode**: Choose media for upload fields (via "Browse Media Library" button)

### Accessing the Media Manager

**From Upload Fields:**
```typescript
// Any field using imageField(), videoField(), or mediaField()
// will have a "📂 Browse Media Library" button
imageField('heroImage', { required: true })
```

**From Floating Action Button:**
- Click the media icon in the bottom-right corner of the admin UI
- Opens in browse mode for general library management

**Programmatically (Client Components):**
```typescript
'use client'
import { useMediaManager } from '@/components/admin/media-manager/MediaManagerProvider'

export function MyComponent() {
  const { openModal } = useMediaManager()

  const handleClick = () => {
    openModal({
      mode: 'select',
      onSelect: (media) => {
        console.log('Selected:', media)
      },
    })
  }

  return <button onClick={handleClick}>Open Media Library</button>
}
```

### Media Manager Components

All components are in `src/components/admin/media-manager/`:

- **MediaManagerProvider.tsx** - Context provider (state management)
- **MediaManagerModal.tsx** - Full-screen modal UI
- **MediaGrid.tsx** - Grid view with pagination
- **FolderTree.tsx** - Hierarchical folder navigation
- **ImageEditor.tsx** - Crop, rotate, quality controls
- **MediaUploadMetadataForm.tsx** - Metadata entry form
- **MediaEditPanel.tsx** - Edit existing media
- **Toast.tsx** - Toast notifications
- **MediaManagerButton.tsx** - Floating action button
- **types.ts** - TypeScript definitions

### Admin Integration

The Media Manager is globally available via `AdminRootProvider`:

```typescript
// payload.config.ts
export default buildConfig({
  admin: {
    components: {
      providers: ['/components/admin/AdminRootProvider#AdminRootProvider'],
    },
  },
})
```

This wraps the entire admin UI with:
1. MediaManagerProvider context
2. MediaManagerModal (rendered globally)
3. MediaManagerButton (floating action button)

### Best Practices

**DO:**
- ✅ Use field utilities (`imageField`, etc.) for all upload fields
- ✅ Provide descriptive `admin.description` for upload fields
- ✅ Use `mediaArrayField` for galleries
- ✅ Set reasonable min/max rows for arrays
- ✅ Use `responsiveImageGroup` for responsive images
- ✅ Require alt text for accessibility

**DON'T:**
- ❌ Use raw upload fields (type: 'upload') directly
- ❌ Skip the field utilities
- ❌ Forget to regenerate types after Media collection changes
- ❌ Create duplicate media upload interfaces

### Storage Configuration

**Current:** Local filesystem storage (`public/media`)

**To Configure Cloudflare R2:**

```bash
bun add @payloadcms/storage-s3
```

```typescript
// payload.config.ts
import { s3Storage } from '@payloadcms/storage-s3'

export default buildConfig({
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => {
            return `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL}/${prefix}/${filename}`
          },
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        forcePathStyle: true, // Required for Cloudflare R2
      },
    }),
  ],
})
```

**Environment Variables:**
```env
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://account-id.r2.cloudflarestorage.com
NEXT_PUBLIC_S3_PUBLIC_URL=https://pub-your-bucket.r2.dev
```

### Troubleshooting

**Media Selector Button Not Appearing:**
1. Verify you're using field utilities: `imageField()`, not raw `type: 'upload'`
2. Regenerate import map: `bun run generate:importmap`
3. Verify `AdminRootProvider` is in `payload.config.ts`
4. Clear browser cache and restart dev server

**TypeScript Errors:**
```bash
bun run generate:types
```

**Media Not Uploading:**
- Check authentication (must be logged in)
- Verify access control on Media collection
- Check upload directory permissions (local storage)
- Verify S3 credentials (if using R2)

**Import Map Issues:**
```bash
bun run generate:importmap
```

### Migration Guide

**Before (Raw Upload Fields):**
```typescript
{
  name: 'featuredImage',
  type: 'upload',
  relationTo: 'media',
  required: true,
}
```

**After (Field Utilities):**
```typescript
import { imageField } from '@/lib/payload/fields/media'

imageField('featuredImage', { required: true })
```

**Result:** Same functionality + "Browse Media Library" button + consistent configuration

### Complete Example

```typescript
import type { CollectionConfig } from 'payload'
import { imageField, mediaArrayField } from '@/lib/payload/fields/media'
import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'

export const Portfolio: CollectionConfig = {
  slug: 'portfolio',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },

    // Hero image with media library selector
    imageField('heroImage', {
      required: true,
      admin: {
        description: 'Main portfolio image (1920x1080px recommended)',
      },
    }),

    // Image gallery
    mediaArrayField('gallery', {
      minRows: 3,
      maxRows: 20,
      admin: {
        description: 'Portfolio image gallery (drag to reorder)',
      },
    }),

    // Optional video
    videoField('showcaseVideo', {
      admin: {
        description: 'Optional video showcase',
      },
    }),
  ],
}
```

### API Routes Used

The Media Manager uses standard Payload API routes:

- `GET /api/media` - List media with filters/pagination
- `POST /api/media` - Upload new media
- `PATCH /api/media/:id` - Update media metadata
- `DELETE /api/media/:id` - Delete media
- `GET /api/payload-folders` - List folders
- `POST /api/payload-folders` - Create folder
- `DELETE /api/payload-folders/:id` - Delete folder

These routes are automatically provided by Payload CMS.

### Additional Documentation

For complete integration details, see: `MEDIA_MANAGER_INTEGRATION.md`

## Resources

- Docs: https://payloadcms.com/docs
- LLM Context: https://payloadcms.com/llms-full.txt
- GitHub: https://github.com/payloadcms/payload
- Examples: https://github.com/payloadcms/payload/tree/main/examples
- Templates: https://github.com/payloadcms/payload/tree/main/templates
