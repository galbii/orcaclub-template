import 'server-only'

import { isShopifyEnabled, storefront, type StorefrontOptions } from './client'
import { normalizeCollection, normalizeProduct } from './normalize'
import type { RawCollection, RawProduct } from './raw'
import {
  GET_COLLECTION_PRODUCTS,
  GET_COLLECTIONS,
  GET_PRODUCT_BY_HANDLE,
  GET_PRODUCTS,
} from './queries'
import type { Collection, Paginated, Product } from './types'

/**
 * Catalogue reads.
 *
 * Every function here is safe to call whether or not Shopify is
 * configured: with no credentials they return empty results, so a page
 * that lists products renders an empty state instead of crashing the
 * build. That is what makes the integration drop-in.
 */

const EMPTY_PAGE = { items: [], hasNextPage: false, endCursor: null }

export type ProductSort = 'BEST_SELLING' | 'CREATED_AT' | 'PRICE' | 'TITLE' | 'RELEVANCE'

export type GetProductsArgs = {
  first?: number
  after?: string
  /** Shopify search syntax, e.g. `tag:new AND available_for_sale:true`. */
  query?: string
  sortKey?: ProductSort
  reverse?: boolean
} & StorefrontOptions

export async function getProducts({
  first = 24,
  after,
  query,
  sortKey,
  reverse,
  ...options
}: GetProductsArgs = {}): Promise<Paginated<Product>> {
  if (!isShopifyEnabled()) return EMPTY_PAGE

  const data = await storefront<{
    products: { nodes: RawProduct[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }
  }>(
    GET_PRODUCTS,
    { first, after, query, sortKey, reverse },
    { tags: ['shopify-products'], ...options },
  )

  return {
    items: data.products.nodes.map(normalizeProduct),
    hasNextPage: data.products.pageInfo.hasNextPage,
    endCursor: data.products.pageInfo.endCursor,
  }
}

/** Returns null when the handle does not exist — pair with `notFound()`. */
export async function getProduct(
  handle: string,
  options: StorefrontOptions = {},
): Promise<Product | null> {
  if (!isShopifyEnabled()) return null

  const data = await storefront<{ product: RawProduct | null }>(
    GET_PRODUCT_BY_HANDLE,
    { handle },
    { tags: ['shopify-products', `shopify-product-${handle}`], ...options },
  )

  return data.product ? normalizeProduct(data.product) : null
}

export async function getCollections(
  { first = 50, ...options }: { first?: number } & StorefrontOptions = {},
): Promise<Collection[]> {
  if (!isShopifyEnabled()) return []

  const data = await storefront<{ collections: { nodes: RawCollection[] } }>(
    GET_COLLECTIONS,
    { first },
    { tags: ['shopify-collections'], ...options },
  )

  return data.collections.nodes.map(normalizeCollection)
}

export async function getCollectionProducts({
  handle,
  first = 24,
  after,
  ...options
}: { handle: string; first?: number; after?: string } & StorefrontOptions): Promise<
  Paginated<Product>
> {
  if (!isShopifyEnabled()) return EMPTY_PAGE

  const data = await storefront<{
    collection: {
      products: { nodes: RawProduct[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }
    } | null
  }>(
    GET_COLLECTION_PRODUCTS,
    { handle, first, after },
    { tags: ['shopify-products', `shopify-collection-${handle}`], ...options },
  )

  if (!data.collection) return EMPTY_PAGE

  return {
    items: data.collection.products.nodes.map(normalizeProduct),
    hasNextPage: data.collection.products.pageInfo.hasNextPage,
    endCursor: data.collection.products.pageInfo.endCursor,
  }
}
