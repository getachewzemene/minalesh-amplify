import { Metadata } from 'next'
import { createCategoryMetadata, BASE_URL } from '@/lib/seo'
import { BreadcrumbSchema } from '@/components/seo'

export const metadata: Metadata = createCategoryMetadata()

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Breadcrumb structured data for products page */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: BASE_URL },
          { name: 'Products', url: `${BASE_URL}/products` }
        ]}
      />
      {children}
    </>
  )
}
