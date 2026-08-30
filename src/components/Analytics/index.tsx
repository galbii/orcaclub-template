import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'

import { analytics } from '@/lib/env'
import { MetaPixel } from './MetaPixel'

/**
 * Every tag this project ships, in one mount point.
 *
 * All three are driven by NEXT_PUBLIC_* vars and each renders nothing
 * when its ID is blank — so a fresh clone with an untouched .env.local
 * loads zero third-party scripts.
 *
 * Note these IDs are inlined at BUILD time. On Coolify they must be set
 * as Build Variables (and declared as ARGs in the Dockerfile), and any
 * change needs a rebuild rather than a restart.
 */
export function Analytics() {
  const { gaId, gtmId, fbPixelId } = analytics

  return (
    <>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {/* Skip the standalone GA tag when GA is already routed through GTM. */}
      {gaId && !gtmId && <GoogleAnalytics gaId={gaId} />}
      <MetaPixel pixelId={fbPixelId} />
    </>
  )
}
