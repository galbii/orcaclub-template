/**
 * Flat, UI-shaped types.
 *
 * Shopify's GraphQL responses are deeply nested in `edges[].node[]` and
 * carry money as `{ amount, currencyCode }`. Rather than leak that shape
 * into every component, the helpers in this folder normalise into the
 * types below — so swapping Shopify for another backend later means
 * rewriting one folder, not every template that renders a price.
 */

export type Money = {
  amount: number
  currencyCode: string
  /** Preformatted for display, e.g. "$24.00". */
  formatted: string
}

export type ProductVariant = {
  id: string
  title: string
  available: boolean
  price: Money
  compareAtPrice: Money | null
  sku: string | null
  selectedOptions: Array<{ name: string; value: string }>
}

export type ProductImage = {
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

export type Product = {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  available: boolean
  featuredImage: ProductImage | null
  images: ProductImage[]
  /** Lowest variant price — what a card should show. */
  price: Money
  maxPrice: Money
  compareAtPrice: Money | null
  variants: ProductVariant[]
  options: Array<{ name: string; values: string[] }>
  tags: string[]
  vendor: string | null
  productType: string | null
}

export type Collection = {
  id: string
  handle: string
  title: string
  description: string
  image: ProductImage | null
}

export type CartLine = {
  id: string
  quantity: number
  merchandiseId: string
  title: string
  variantTitle: string | null
  image: ProductImage | null
  unitPrice: Money
  lineTotal: Money
}

export type Cart = {
  id: string
  /** Shopify-hosted checkout. Redirect here — never rebuild checkout. */
  checkoutUrl: string
  totalQuantity: number
  lines: CartLine[]
  subtotal: Money
  total: Money
}

/** A page of results plus the cursor needed to ask for the next one. */
export type Paginated<T> = {
  items: T[]
  hasNextPage: boolean
  endCursor: string | null
}
