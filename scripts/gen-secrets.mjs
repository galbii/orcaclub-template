#!/usr/bin/env node
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const envFile = resolve(process.cwd(), '.env.local')

if (!existsSync(envFile)) {
  console.error('.env.local not found. Run: cp .env.example .env.local')
  process.exit(1)
}

const secrets = ['PAYLOAD_SECRET', 'CRON_SECRET', 'PREVIEW_SECRET']
let contents = readFileSync(envFile, 'utf8')
let changed = false

for (const key of secrets) {
  const re = new RegExp(`^${key}=(.*)$`, 'm')
  const match = contents.match(re)
  if (!match) {
    contents += `\n${key}=${randomBytes(32).toString('hex')}\n`
    changed = true
    console.log(`Added ${key}`)
  } else if (!match[1] || match[1].trim() === '') {
    contents = contents.replace(re, `${key}=${randomBytes(32).toString('hex')}`)
    changed = true
    console.log(`Generated ${key}`)
  } else {
    console.log(`Kept existing ${key}`)
  }
}

if (changed) {
  writeFileSync(envFile, contents)
  console.log('Wrote .env.local')
} else {
  console.log('No changes needed')
}
