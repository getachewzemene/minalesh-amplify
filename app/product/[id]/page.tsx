import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { createProductMetadata, BASE_URL } from '@/lib/seo'
import { ProductSchema, BreadcrumbSchema } from '@/components/seo'
import ProductClient from '@/page-components/Product'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

// Generate dynamic metadata for product pages
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        shortDescription: true,
        price: true,
        salePrice: true,
        images: true,
        brand: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.'
      }
    }

    // Parse images
    let images: string[] = []
    if (product.images) {
      if (Array.isArray(product.images)) {
        images = product.images as string[]
      } else if (typeof product.images === 'string') {
        try {
          const parsed = JSON.parse(product.images)
          if (Array.isArray(parsed)) images = parsed
        } catch {
          // If parsing fails, use empty array
        }
      }
    }

    return createProductMetadata({
      id: product.id,
      name: product.name,
      description: product.description || product.shortDescription || undefined,
      price: Number(product.salePrice || product.price),
      images,
      category: product.category?.name,
      brand: product.brand || undefined
    })
  } catch (error) {
    console.error('Error generating product metadata:', error)
    return {
      title: 'Product',
      description: 'View product details on Minalesh'
    }
  }
}

// Helper to parse images for structured data
function parseImages(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images as string[]
  } else if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // If parsing fails, return empty array
    }
  }
  return []
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params

  // Fetch product data for structured data
  let structuredData = null
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        shortDescription: true,
        price: true,
        salePrice: true,
        images: true,
        sku: true,
        brand: true,
        stockQuantity: true,
        ratingAverage: true,
        ratingCount: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        vendor: {
          select: {
            displayName: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (product) {
      const images = parseImages(product.images)
      const vendorName = product.vendor?.displayName || 
        `${product.vendor?.firstName || ''} ${product.vendor?.lastName || ''}`.trim() || 
        'Minalesh Vendor'
      const effectivePrice = Number(product.salePrice || product.price)

      structuredData = {
        product: {
          name: product.name,
          description: product.description || product.shortDescription || undefined,
          image: images.length > 0 
            ? images.map(img => img.startsWith('http') ? img : `${BASE_URL}${img}`)
            : undefined,
          sku: product.sku || undefined,
          brand: product.brand || undefined,
          category: product.category?.name,
          offers: {
            price: effectivePrice,
            priceCurrency: 'ETB',
            availability: product.stockQuantity > 0 ? 'InStock' as const : 'OutOfStock' as const,
            url: `${BASE_URL}/product/${product.id}`,
            seller: { name: vendorName }
          },
          aggregateRating: product.ratingCount > 0 ? {
            ratingValue: Number(product.ratingAverage),
            reviewCount: product.ratingCount
          } : undefined
        },
        breadcrumbs: [
          { name: 'Home', url: BASE_URL },
          { name: 'Products', url: `${BASE_URL}/products` },
          ...(product.category ? [{ 
            name: product.category.name, 
            url: `${BASE_URL}/products?category=${product.category.slug}` 
          }] : []),
          { name: product.name, url: `${BASE_URL}/product/${product.id}` }
        ]
      }
    }
  } catch (error) {
    console.error('Error fetching product for structured data:', error)
  }

  return (
    <>
      {/* Structured Data for Product Page */}
      {structuredData && (
        <>
          <ProductSchema {...structuredData.product} />
          <BreadcrumbSchema items={structuredData.breadcrumbs} />
        </>
      )}
      <ProductClient />
    </>
  )
}
