/**
 * The shapes the Storefront API actually returns, mirroring the
 * fragments in `queries.ts`.
 *
 * These exist so `normalize.ts` can map without `any`. They are
 * deliberately permissive about nullability — Shopify omits fields the
 * requesting token lacks scope for, so anything not guaranteed by the
 * schema is optional here and defaulted during normalisation.
 *
 * Nothing outside this folder should import these: the whole point is
 * that the rest of the app sees the flat types in `types.ts`.
 */

export type RawMoney = {
  amount: string
  currencyCode: string
}

export type RawImage = {
  url: string
  altText?: string | null
  width?: number | null
  height?: number | null
}

export type RawVariant = {
  id: string
  title: string
  availableForSale?: boolean
  sku?: string | null
  selectedOptions?: Array<{ name: string; value: string }>
  price?: RawMoney | null
  compareAtPrice?: RawMoney | null
}

export type RawProduct = {
  id: string
  handle: string
  title: string
  description?: string | null
  descriptionHtml?: string | null
  availableForSale?: boolean
  vendor?: string | null
  productType?: string | null
  tags?: string[]
  options?: Array<{ name: string; values: string[] }>
  featuredImage?: RawImage | null
  images?: { nodes: RawImage[] } | null
  priceRange?: {
    minVariantPrice?: RawMoney | null
    maxVariantPrice?: RawMoney | null
  } | null
  compareAtPriceRange?: { minVariantPrice?: RawMoney | null } | null
  variants?: { nodes: RawVariant[] } | null
}

export type RawCollection = {
  id: string
  handle: string
  title: string
  description?: string | null
  image?: RawImage | null
}

export type RawCartLine = {
  id: string
  quantity: number
  cost?: {
    amountPerQuantity?: RawMoney | null
    totalAmount?: RawMoney | null
  } | null
  merchandise?: {
    id: string
    title?: string | null
    image?: RawImage | null
    product?: { title?: string | null } | null
  } | null
}

export type RawCart = {
  id: string
  checkoutUrl: string
  totalQuantity?: number
  cost?: {
    subtotalAmount?: RawMoney | null
    totalAmount?: RawMoney | null
  } | null
  lines?: { nodes: RawCartLine[] } | null
}

/** Every cart mutation returns this envelope shape. */
export type RawCartMutation = {
  cart: RawCart | null
  userErrors?: Array<{ field?: string[] | null; message: string }>
}
