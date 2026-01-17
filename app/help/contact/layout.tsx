import { Metadata } from 'next'
import { BreadcrumbSchema } from '@/components/seo'
import { createPageMetadata, BASE_URL } from '@/lib/seo'

export const metadata: Metadata = createPageMetadata({
  title: 'Contact Us',
  description: 'Get in touch with Minalesh customer support. We are here to help with orders, shipping, returns, and more.',
  path: '/help/contact'
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: BASE_URL },
          { name: 'Help', url: `${BASE_URL}/help` },
          { name: 'Contact Us', url: `${BASE_URL}/help/contact` }
        ]}
      />
      {children}
    </>
  )
}
