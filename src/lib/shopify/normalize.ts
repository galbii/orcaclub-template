import type {
  RawCart,
  RawCartLine,
  RawCollection,
  RawImage,
  RawMoney,
  RawProduct,
} from './raw'
import type { Cart, CartLine, Collection, Money, Product, ProductImage } from './types'

/**
 * Shopify → template shape.
 *
 * Everything past this file uses the flat types in `types.ts`, so the
 * nested `edges`/`nodes` structure and Shopify's string-encoded money
 * never leak into components. Swapping in another commerce backend
 * later means rewriting this folder, not every product card.
 */

function money(raw: RawMoney | null | undefined): Money {
  const amount = Number.parseFloat(raw?.amount ?? '0')
  const currencyCode = raw?.currencyCode ?? 'USD'

  return {
    amount,
    currencyCode,
    // Shopify sends amounts as strings ("24.0") to avoid float drift.
    // Intl gives the correct symbol and separators per currency.
    formatted: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount),
  }
}

function image(raw: RawImage | null | undefined): ProductImage | null {
  if (!raw?.url) return null

  return {
    url: raw.url,
    altText: raw.altText ?? null,
    width: raw.width ?? null,
    height: raw.height ?? null,
  }
}

function images(raw: RawImage[] | undefined): ProductImage[] {
  return (raw ?? []).map(image).filter((img): img is ProductImage => img !== null)
}

export function normalizeProduct(raw: RawProduct): Product {
  const minPrice = raw.priceRange?.minVariantPrice
  const compareAt = raw.compareAtPriceRange?.minVariantPrice

  const priceAmount = Number.parseFloat(minPrice?.amount ?? '0')
  const compareAtAmount = Number.parseFloat(compareAt?.amount ?? '0')

  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description ?? '',
    descriptionHtml: raw.descriptionHtml ?? '',
    available: Boolean(raw.availableForSale),
    featuredImage: image(raw.featuredImage),
    images: images(raw.images?.nodes),
    price: money(minPrice),
    maxPrice: money(raw.priceRange?.maxVariantPrice),
    // Shopify reports a compare-at price of 0 (not null) when a product
    // is not on sale, which would otherwise render as a struck-through
    // "$0.00" next to the real price.
    compareAtPrice: compareAtAmount > priceAmount ? money(compareAt) : null,
    variants: (raw.variants?.nodes ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      available: Boolean(v.availableForSale),
      price: money(v.price),
      compareAtPrice: v.compareAtPrice ? money(v.compareAtPrice) : null,
      sku: v.sku || null,
      selectedOptions: v.selectedOptions ?? [],
    })),
    options: raw.options ?? [],
    tags: raw.tags ?? [],
    vendor: raw.vendor || null,
    productType: raw.productType || null,
  }
}

export function normalizeCollection(raw: RawCollection): Collection {
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description ?? '',
    image: image(raw.image),
  }
}

function normalizeCartLine(line: RawCartLine): CartLine {
  const variantTitle = line.merchandise?.title

  return {
    id: line.id,
    quantity: line.quantity,
    merchandiseId: line.merchandise?.id ?? '',
    title: line.merchandise?.product?.title ?? '',
    // Shopify names the sole variant of a simple product "Default
    // Title"; surfacing that in a cart row looks like a bug.
    variantTitle: variantTitle && variantTitle !== 'Default Title' ? variantTitle : null,
    image: image(line.merchandise?.image),
    unitPrice: money(line.cost?.amountPerQuantity),
    lineTotal: money(line.cost?.totalAmount),
  }
}

export function normalizeCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity ?? 0,
    subtotal: money(raw.cost?.subtotalAmount),
    total: money(raw.cost?.totalAmount),
    lines: (raw.lines?.nodes ?? []).map(normalizeCartLine),
  }
}
