import 'server-only'

import { shopify } from '@/lib/env'

/**
 * Thrown only for genuine transport/GraphQL failures. "Shopify is not
 * configured" is NOT an error — see `isShopifyEnabled()`; the public
 * helpers in this folder return empty results instead so that an
 * unconfigured clone renders an empty catalogue rather than a 500.
 */
export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly detail?: unknown,
  ) {
    super(message)
    this.name = 'ShopifyError'
  }
}

/** True when SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN are both set. */
export function isShopifyEnabled(): boolean {
  return shopify !== null
}

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message: string; path?: string[] }>
}

export type StorefrontOptions = {
  /**
   * Forwarded as `Shopify-Storefront-Buyer-IP`. Shopify uses it to tell
   * real buyers from bots; server-side calls all originate from one IP,
   * so without it a busy store looks like a scraper and starts getting
   * 430 Security Rejection responses.
   *
   * Pass it from a request context — see `buyerIpFromHeaders()`.
   */
  buyerIp?: string
  /**
   * Next fetch cache. Defaults to 60s revalidation, which suits a
   * catalogue. Cart calls override this with `{ cache: 'no-store' }`
   * because a cached cart is always wrong.
   */
  cache?: RequestCache
  revalidate?: number | false
  tags?: string[]
}

/**
 * Single choke point for every Storefront API call.
 *
 * Everything else in this folder is a thin typed wrapper around this, so
 * retries, auth, caching and error shape are defined in exactly one
 * place.
 */
export async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: StorefrontOptions = {},
): Promise<T> {
  if (!shopify) {
    throw new ShopifyError(
      'Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and ' +
        'SHOPIFY_STOREFRONT_ACCESS_TOKEN, or guard this call with isShopifyEnabled().',
    )
  }

  const { buyerIp, cache, revalidate = 60, tags } = options

  let response: Response
  try {
    response = await fetch(shopify.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopify.token,
        ...(buyerIp ? { 'Shopify-Storefront-Buyer-IP': buyerIp } : {}),
      },
      body: JSON.stringify({ query, variables }),
      ...(cache ? { cache } : { next: { revalidate, ...(tags ? { tags } : {}) } }),
    })
  } catch (cause) {
    throw new ShopifyError(`Could not reach Shopify at ${shopify.domain}.`, cause)
  }

  if (!response.ok) {
    // 401/403 is nearly always the wrong token type — an Admin API token
    // pasted into the Storefront slot fails exactly this way.
    const hint =
      response.status === 401 || response.status === 403
        ? ' Check that SHOPIFY_STOREFRONT_ACCESS_TOKEN is a Storefront API token, not an Admin API token.'
        : ''
    throw new ShopifyError(`Shopify returned ${response.status} ${response.statusText}.${hint}`)
  }

  const body = (await response.json()) as GraphQLResponse<T>

  // GraphQL reports failures inside a 200 response, so this must be
  // checked explicitly — `response.ok` above is not enough.
  if (body.errors?.length) {
    throw new ShopifyError(
      `Shopify GraphQL error: ${body.errors.map((e) => e.message).join('; ')}`,
      body.errors,
    )
  }

  if (!body.data) throw new ShopifyError('Shopify returned no data.')

  return body.data
}

/**
 * Pull the buyer's IP out of a request's headers.
 *
 * Kept as a helper taking `Headers` rather than calling `headers()`
 * internally, because that would force every caller — including cached
 * catalogue pages that do not need it — to become dynamic.
 */
export function buyerIpFromHeaders(headers: Headers): string | undefined {
  const forwarded = headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip') || undefined
}
