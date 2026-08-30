/**
 * Liveness probe for Coolify / any container orchestrator.
 * Deliberately does NOT touch the database: this answers "is the process
 * up", and coupling it to Mongo would make a transient DB blip restart
 * an otherwise healthy container.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ status: 'ok', uptime: process.uptime() })
}
