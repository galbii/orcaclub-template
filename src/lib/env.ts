function required(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing required env var: ${key}. Check .env.local (see .env.example).`)
  return v
}

const storageMode = (process.env.STORAGE_MODE ?? 'local') as 'local' | 'r2'
if (storageMode !== 'local' && storageMode !== 'r2') {
  throw new Error(`Invalid STORAGE_MODE: ${storageMode}. Must be 'local' or 'r2'.`)
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  PAYLOAD_SECRET: required('PAYLOAD_SECRET'),
  STORAGE_MODE: storageMode,
  R2:
    storageMode === 'r2'
      ? {
          bucket: required('R2_BUCKET'),
          accessKeyId: required('R2_ACCESS_KEY_ID'),
          secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
          endpoint: required('R2_ENDPOINT'),
          publicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? null,
        }
      : null,
}
