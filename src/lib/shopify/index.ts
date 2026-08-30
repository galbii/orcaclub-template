/**
 * Shopify Storefront integration — server-only.
 *
 * Enable by setting SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN.
 * With them unset every catalogue helper returns empty results and
 * `isShopifyEnabled()` is false, so the template builds and runs
 * untouched on projects that sell nothing.
 *
 *   import { getProducts, isShopifyEnabled } from '@/lib/shopify'
 *
 *   const { items } = await getProducts({ first: 12 })
 *
 * Note these are runtime variables, not NEXT_PUBLIC_ ones: the token
 * never reaches the browser, so there is no Dockerfile ARG to add and
 * nothing to mark as a Build Variable on Coolify. The trade-off is that
 * routes reading the catalogue must not be statically prerendered at
 * build time — give them `export const revalidate = 60` or fetch them
 * from a route handler.
 */

export { buyerIpFromHeaders, isShopifyEnabled, ShopifyError, storefront } from './client'
export type { StorefrontOptions } from './client'

export {
  getCollectionProducts,
  getCollections,
  getProduct,
  getProducts,
  type GetProductsArgs,
  type ProductSort,
} from './products'

export {
  addCartLines,
  addToCart,
  createCart,
  getCart,
  removeCartLines,
  updateCartLines,
  type CartLineInput,
} from './cart'

export type {
  Cart,
  CartLine,
  Collection,
  Money,
  Paginated,
  Product,
  ProductImage,
  ProductVariant,
} from './types'
