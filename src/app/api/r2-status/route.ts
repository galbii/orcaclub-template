import { NextResponse } from 'next/server'

export async function GET() {
  const bucket = process.env.R2_BUCKET
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const endpoint = process.env.R2_ENDPOINT
  const accountId = process.env.R2_ACCOUNT_ID

  const hasAccessKey = Boolean(accessKeyId)
  const hasSecretKey = Boolean(secretAccessKey)
  const hasBucket = Boolean(bucket)
  const hasEndpoint = Boolean(endpoint)

  // Check if R2 is configured
  if (!hasBucket || !hasAccessKey || !hasSecretKey || !hasEndpoint) {
    return NextResponse.json({
      status: 'not-configured',
      message: 'R2 Storage is not configured. Using local storage.',
      config: {
        bucket: bucket ? '(set)' : '(not set)',
        endpoint: endpoint ? '(set)' : '(not set)',
        hasAccessKey,
        hasSecretKey,
        accountId: accountId ? '(set)' : '(not set)',
      },
    })
  }

  // All required environment variables are set
  return NextResponse.json({
    status: 'connected',
    message: 'R2 Storage is configured and ready.',
    config: {
      bucket: bucket ? '(set)' : '(not set)',
      endpoint: endpoint ? '(set)' : '(not set)',
      hasAccessKey,
      hasSecretKey,
      accountId: accountId ? '(set)' : '(not set)',
    },
  })
}
