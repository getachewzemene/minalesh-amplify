/**
 * JSON-LD Structured Data Components for SEO
 * 
 * These components render schema.org structured data for search engine optimization.
 * They support Product, Organization, Breadcrumb, Review, and FAQPage schemas.
 */

import React from 'react'

interface JsonLdProps {
  data: Record<string, unknown>
}

/**
 * Base component for rendering JSON-LD structured data
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Organization Schema
export interface OrganizationSchemaProps {
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[]
  contactPoint?: {
    telephone?: string
    email?: string
    contactType?: string
  }
}

export function OrganizationSchema({
  name,
  url,
  logo,
  description,
  sameAs,
  contactPoint
}: OrganizationSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
  }

  if (logo) data.logo = logo
  if (description) data.description = description
  if (sameAs && sameAs.length > 0) data.sameAs = sameAs
  if (contactPoint) {
    data.contactPoint = {
      '@type': 'ContactPoint',
      ...contactPoint
    }
  }

  return <JsonLd data={data} />
}

// Product Schema
export interface ProductSchemaProps {
  name: string
  description?: string
  image?: string | string[]
  sku?: string
  brand?: string
  offers: {
    price: number
    priceCurrency?: string
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
    url?: string
    seller?: {
      name: string
    }
  }
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
  }
  category?: string
}

export function ProductSchema({
  name,
  description,
  image,
  sku,
  brand,
  offers,
  aggregateRating,
  category
}: ProductSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
  }

  if (description) data.description = description
  if (image) data.image = image
  if (sku) data.sku = sku
  if (brand) {
    data.brand = {
      '@type': 'Brand',
      name: brand
    }
  }
  if (category) data.category = category

  data.offers = {
    '@type': 'Offer',
    price: offers.price,
    priceCurrency: offers.priceCurrency || 'ETB',
    availability: `https://schema.org/${offers.availability || 'InStock'}`,
    ...(offers.url && { url: offers.url }),
    ...(offers.seller && {
      seller: {
        '@type': 'Organization',
        name: offers.seller.name
      }
    })
  }

  if (aggregateRating && aggregateRating.reviewCount > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: 5,
      worstRating: 1
    }
  }

  return <JsonLd data={data} />
}

// Breadcrumb Schema
export interface BreadcrumbItem {
  name: string
  url: string
}

export interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: { '@id': item.url }
    }))
  }

  return <JsonLd data={data} />
}

// Review Schema (for individual reviews)
export interface ReviewSchemaProps {
  itemReviewed: {
    type: 'Product' | 'Organization' | 'LocalBusiness'
    name: string
  }
  reviewRating: {
    ratingValue: number
    bestRating?: number
    worstRating?: number
  }
  author: {
    name: string
  }
  reviewBody?: string
  datePublished?: string
}

export function ReviewSchema({
  itemReviewed,
  reviewRating,
  author,
  reviewBody,
  datePublished
}: ReviewSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': itemReviewed.type,
      name: itemReviewed.name
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviewRating.ratingValue,
      bestRating: reviewRating.bestRating || 5,
      worstRating: reviewRating.worstRating || 1
    },
    author: {
      '@type': 'Person',
      name: author.name
    }
  }

  if (reviewBody) data.reviewBody = reviewBody
  if (datePublished) data.datePublished = datePublished

  return <JsonLd data={data} />
}

// FAQ Page Schema
export interface FAQItem {
  question: string
  answer: string
}

export interface FAQPageSchemaProps {
  questions: FAQItem[]
}

export function FAQPageSchema({ questions }: FAQPageSchemaProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return <JsonLd data={data} />
}

// WebSite Schema with SearchAction
export interface WebSiteSchemaProps {
  name: string
  url: string
  description?: string
  searchUrl?: string
}

export function WebSiteSchema({
  name,
  url,
  description,
  searchUrl
}: WebSiteSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url
  }

  if (description) data.description = description

  if (searchUrl) {
    data.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrl
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return <JsonLd data={data} />
}

// LocalBusiness Schema (for marketplace context)
export interface LocalBusinessSchemaProps {
  name: string
  url: string
  logo?: string
  description?: string
  address?: {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  telephone?: string
  email?: string
  priceRange?: string
  openingHours?: string[]
}

export function LocalBusinessSchema({
  name,
  url,
  logo,
  description,
  address,
  telephone,
  email,
  priceRange,
  openingHours
}: LocalBusinessSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    url
  }

  if (logo) data.logo = logo
  if (description) data.description = description
  if (telephone) data.telephone = telephone
  if (email) data.email = email
  if (priceRange) data.priceRange = priceRange
  if (openingHours) data.openingHours = openingHours

  if (address) {
    data.address = {
      '@type': 'PostalAddress',
      ...address
    }
  }

  return <JsonLd data={data} />
}
