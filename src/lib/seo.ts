/**
 * SEO Metadata Utilities
 * 
 * Provides helper functions and constants for generating SEO metadata
 * across the application.
 */

import { Metadata } from 'next'

// Base URL for the site
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://minalesh.et'

// Site-wide defaults
export const SITE_NAME = 'Minalesh'
export const SITE_DESCRIPTION = "Ethiopia's intelligent e-commerce marketplace connecting buyers and sellers across the nation"
export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'am', 'om', 'ti'] as const

// Default Open Graph image
export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`

// Organization info for structured data
export const ORGANIZATION_INFO = {
  name: SITE_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: SITE_DESCRIPTION,
  contactPoint: {
    telephone: '+251-XXX-XXX-XXX',
    email: 'support@minalesh.et',
    contactType: 'customer service'
  },
  address: {
    streetAddress: 'Bole, Addis Ababa',
    addressLocality: 'Addis Ababa',
    addressRegion: 'Addis Ababa',
    postalCode: '1000',
    addressCountry: 'ET'
  }
}

/**
 * Creates base metadata with common defaults
 */
export function createBaseMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: `${SITE_NAME} - Ethiopia's Intelligent Marketplace`,
      template: `%s | ${SITE_NAME}`
    },
    description: SITE_DESCRIPTION,
    keywords: [
      'Ethiopian marketplace',
      'e-commerce Ethiopia',
      'buy online Ethiopia',
      'sell online Ethiopia',
      'Ethiopian products',
      'Minalesh',
      'Ethiopian Birr',
      'ETB',
      'online shopping Ethiopia',
      'Ethiopian coffee',
      'Ethiopian spices',
      'Habesha',
      'traditional Ethiopian',
      'electronics Ethiopia',
      'fashion Ethiopia'
    ],
    authors: [{ name: SITE_NAME, url: BASE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: BASE_URL,
      siteName: SITE_NAME,
      title: `${SITE_NAME} - Ethiopia's Intelligent Marketplace`,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - Ethiopia's Intelligent Marketplace`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} - Ethiopia's Intelligent Marketplace`,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
      creator: '@minalesh',
      site: '@minalesh'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: BASE_URL,
      languages: {
        'en': `${BASE_URL}/en`,
        'am': `${BASE_URL}/am`,
        'om': `${BASE_URL}/om`,
        'ti': `${BASE_URL}/ti`
      }
    },
    ...overrides
  }
}

/**
 * Creates metadata for a product page
 */
export function createProductMetadata(product: {
  id: string
  name: string
  description?: string
  price: number
  images?: string[]
  category?: string
  brand?: string
}): Metadata {
  const productUrl = `${BASE_URL}/product/${product.id}`
  const productImage = product.images?.[0] || DEFAULT_OG_IMAGE
  const productDescription = product.description 
    ? product.description.slice(0, 160) 
    : `Buy ${product.name} on ${SITE_NAME}. Best prices in Ethiopian Birr (ETB).`

  return {
    title: product.name,
    description: productDescription,
    keywords: [
      product.name,
      product.category || 'products',
      product.brand || '',
      'buy online Ethiopia',
      'Ethiopian marketplace',
      SITE_NAME
    ].filter(Boolean),
    openGraph: {
      type: 'website',
      url: productUrl,
      title: product.name,
      description: productDescription,
      siteName: SITE_NAME,
      images: [
        {
          url: productImage.startsWith('http') ? productImage : `${BASE_URL}${productImage}`,
          width: 800,
          height: 800,
          alt: product.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: productDescription,
      images: [productImage.startsWith('http') ? productImage : `${BASE_URL}${productImage}`]
    },
    alternates: {
      canonical: productUrl
    }
  }
}

/**
 * Creates metadata for a category/products page
 */
export function createCategoryMetadata(category?: {
  name: string
  slug: string
  description?: string
}): Metadata {
  const baseTitle = category 
    ? `${category.name} Products` 
    : 'All Products'
  const baseDescription = category?.description 
    || `Browse ${category?.name || 'all'} products on ${SITE_NAME}. Best selection at competitive prices in Ethiopian Birr.`
  const categoryUrl = category 
    ? `${BASE_URL}/products?category=${category.slug}` 
    : `${BASE_URL}/products`

  return {
    title: baseTitle,
    description: baseDescription,
    openGraph: {
      type: 'website',
      url: categoryUrl,
      title: `${baseTitle} | ${SITE_NAME}`,
      description: baseDescription,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${baseTitle} | ${SITE_NAME}`,
      description: baseDescription
    },
    alternates: {
      canonical: categoryUrl
    }
  }
}

/**
 * Creates metadata for static pages (About, Contact, etc.)
 */
export function createPageMetadata(page: {
  title: string
  description: string
  path: string
  noIndex?: boolean
}): Metadata {
  const pageUrl = `${BASE_URL}${page.path}`

  return {
    title: page.title,
    description: page.description,
    openGraph: {
      type: 'website',
      url: pageUrl,
      title: `${page.title} | ${SITE_NAME}`,
      description: page.description,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary',
      title: `${page.title} | ${SITE_NAME}`,
      description: page.description
    },
    alternates: {
      canonical: pageUrl
    },
    ...(page.noIndex && {
      robots: {
        index: false,
        follow: false
      }
    })
  }
}

/**
 * Utility to truncate text for meta descriptions
 */
export function truncateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + '...'
}
