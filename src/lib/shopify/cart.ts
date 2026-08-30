import 'server-only'

import { isShopifyEnabled, ShopifyError, storefront, type StorefrontOptions } from './client'
import { normalizeCart } from './normalize'
import type { RawCartMutation, RawCart } from './raw'
import {
  CART_CREATE,
  CART_GET,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
} from './queries'
import type { Cart } from './types'

/**
 * Cart operations.
 *
 * Checkout itself is never rebuilt — every cart carries a `checkoutUrl`
 * pointing at Shopify's hosted checkout. Redirect the buyer there and
 * Shopify owns payments, taxes, shipping and PCI compliance.
 *
 * Carts must never be cached: `no-store` is forced on every call below,
 * regardless of what the caller passes.
 */

const NO_CACHE: StorefrontOptions = { cache: 'no-store' }

export type CartLineInput = {
  /** A ProductVariant id — `gid://shopify/ProductVariant/…`, not a product id. */
  merchandiseId: string
  quantity?: number
}

/**
 * Shopify returns mutation failures in `userErrors` with a 200 status,
 * so each mutation has to be unwrapped explicitly or a failed add-to-cart
 * looks like a success that silently changed nothing.
 */
function unwrap(result: RawCartMutation): Cart {
  if (result.userErrors?.length) {
    throw new ShopifyError(
      `Shopify rejected the cart operation: ${result.userErrors.map((e) => e.message).join('; ')}`,
      result.userErrors,
    )
  }
  if (!result.cart) throw new ShopifyError('Shopify returned no cart.')
  return normalizeCart(result.cart)
}

function assertEnabled(): void {
  if (!isShopifyEnabled()) {
    throw new ShopifyError(
      'Cannot use the cart: Shopify is not configured. Guard checkout UI with isShopifyEnabled().',
    )
  }
}

export async function createCart(lines: CartLineInput[] = []): Promise<Cart> {
  assertEnabled()

  const data = await storefront<{ cartCreate: RawCartMutation }>(
    CART_CREATE,
    { lines: lines.map((l) => ({ merchandiseId: l.merchandiseId, quantity: l.quantity ?? 1 })) },
    NO_CACHE,
  )

  return unwrap(data.cartCreate)
}

/**
 * Returns null when the id is unknown or the cart has expired — Shopify
 * drops carts after a period of inactivity, and a stale id in a cookie
 * is routine rather than exceptional. Callers should create a new cart.
 */
export async function getCart(cartId: string): Promise<Cart | null> {
  if (!isShopifyEnabled()) return null

  const data = await storefront<{ cart: RawCart | null }>(CART_GET, { id: cartId }, NO_CACHE)

  return data.cart ? normalizeCart(data.cart) : null
}

export async function addCartLines(cartId: string, lines: CartLineInput[]): Promise<Cart> {
  assertEnabled()

  const data = await storefront<{ cartLinesAdd: RawCartMutation }>(
    CART_LINES_ADD,
    {
      cartId,
      lines: lines.map((l) => ({ merchandiseId: l.merchandiseId, quantity: l.quantity ?? 1 })),
    },
    NO_CACHE,
  )

  return unwrap(data.cartLinesAdd)
}

export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>,
): Promise<Cart> {
  assertEnabled()

  const data = await storefront<{ cartLinesUpdate: RawCartMutation }>(
    CART_LINES_UPDATE,
    { cartId, lines },
    NO_CACHE,
  )

  return unwrap(data.cartLinesUpdate)
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  assertEnabled()

  const data = await storefront<{ cartLinesRemove: RawCartMutation }>(
    CART_LINES_REMOVE,
    { cartId, lineIds },
    NO_CACHE,
  )

  return unwrap(data.cartLinesRemove)
}

/**
 * Add to an existing cart, or start one if the id is missing/expired.
 * This is the call a normal "Add to cart" button wants.
 */
export async function addToCart(
  cartId: string | null | undefined,
  lines: CartLineInput[],
): Promise<Cart> {
  assertEnabled()

  if (cartId) {
    try {
      return await addCartLines(cartId, lines)
    } catch {
      // Fall through and start fresh rather than dead-ending the buyer.
    }
  }

  return createCart(lines)
}
