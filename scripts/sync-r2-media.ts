/**
 * One-off migration: adopt files already sitting in the R2 bucket into Payload's
 * `media` collection by creating a document for each untracked object.
 *
 * Adoption is in place: Payload's getSafeFilename dedups only against the database
 * and local disk, never the bucket. With media's `disableLocalStorage`, an object
 * that exists in R2 but has no media doc keeps its original key (overwritten with
 * identical bytes on re-upload) while the derived image sizes
 * (`<name>-<width>x<height>.<ext>`) are written alongside it.
 *
 * Dry-run (prints what it would import, writes nothing):
 *   bun run scripts/sync-r2-media.ts
 * Commit for real:
 *   bun run scripts/sync-r2-media.ts --commit
 *
 * Requires STORAGE_MODE=r2 + the R2_* vars in .env.local, plus a reachable Mongo.
 */
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'
import configPromise from '@payload-config'
import { getPayload, type File } from 'payload'
import { env } from '@/lib/env'

const COMMIT = process.argv.includes('--commit')

// Payload names generated image sizes `<base>-<width>x<height>.<ext>`.
// Originals named like `screenshot-1920x1080.png` will be skipped too — the
// dry-run prints this list so you can spot a false positive before committing.
const DERIVED_SIZE_RE = /-\d+x\d+\.[a-z0-9]+$/i

function mediaTypeFor(contentType: string): 'image' | 'video' | 'audio' | 'document' {
  if (contentType.startsWith('image/')) return 'image'
  if (contentType.startsWith('video/')) return 'video'
  if (contentType.startsWith('audio/')) return 'audio'
  return 'document'
}

function altFromKey(key: string): string {
  const base = key.split('/').pop() ?? key
  return base
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function main(): Promise<void> {
  if (!env.R2) {
    throw new Error(
      'STORAGE_MODE must be "r2" (with R2_* vars set) to sync from the bucket. Check .env.local.',
    )
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: env.R2.endpoint,
    credentials: {
      accessKeyId: env.R2.accessKeyId,
      secretAccessKey: env.R2.secretAccessKey,
    },
  })

  const payload = await getPayload({ config: configPromise })

  // Existing media filenames → skip (idempotency; also stops Payload from
  // incrementing keys to `name-1.ext` on a re-run).
  const existing = await payload.find({
    collection: 'media',
    pagination: false,
    depth: 0,
  })
  const tracked = new Set(
    existing.docs
      .map((doc) => (doc as { filename?: string | null }).filename)
      .filter((name): name is string => Boolean(name)),
  )

  // Enumerate the bucket (paginated).
  const keys: string[] = []
  let continuationToken: string | undefined
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: env.R2.bucket, ContinuationToken: continuationToken }),
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key && !obj.Key.endsWith('/')) keys.push(obj.Key)
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)

  const skippedDerived: string[] = []
  const skippedTracked: string[] = []
  const toImport: string[] = []
  for (const key of keys) {
    if (DERIVED_SIZE_RE.test(key)) skippedDerived.push(key)
    else if (tracked.has(key)) skippedTracked.push(key)
    else toImport.push(key)
  }

  payload.logger.info(
    `R2 sync — bucket=${env.R2.bucket} objects=${keys.length} toImport=${toImport.length} ` +
      `alreadyTracked=${skippedTracked.length} derivedSizes=${skippedDerived.length} ` +
      `mode=${COMMIT ? 'COMMIT' : 'DRY-RUN'}`,
  )

  if (skippedDerived.length) {
    const preview = skippedDerived.slice(0, 20).join(', ')
    payload.logger.info(
      `Skipped as generated sizes (\`-WIDTHxHEIGHT.ext\`): ${preview}` +
        (skippedDerived.length > 20 ? ` …(+${skippedDerived.length - 20} more)` : ''),
    )
  }

  let imported = 0
  let failed = 0
  for (const key of toImport) {
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: env.R2.bucket, Key: key }))
      const contentType = head.ContentType ?? 'application/octet-stream'

      if (!COMMIT) {
        payload.logger.info(`[dry-run] would import ${key} (${contentType})`)
        continue
      }

      const got = await s3.send(new GetObjectCommand({ Bucket: env.R2.bucket, Key: key }))
      const data = await streamToBuffer(got.Body)
      const file: File = {
        data,
        mimetype: contentType,
        name: key,
        size: data.byteLength,
      }

      await payload.create({
        collection: 'media',
        file,
        data: {
          alt: altFromKey(key),
          mediaType: mediaTypeFor(contentType),
        },
      })
      imported++
      payload.logger.info(`imported ${key}`)
    } catch (err) {
      failed++
      payload.logger.error(`failed ${key}: ${(err as Error).message}`)
    }
  }

  payload.logger.info(
    `Done. imported=${imported} failed=${failed}` +
      (COMMIT ? '' : ' (dry-run — re-run with --commit to write)'),
  )

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
