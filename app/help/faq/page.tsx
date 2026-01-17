import { Metadata } from 'next'
import { FAQClient } from '@/components/help/FAQClient'
import { FAQPageSchema, BreadcrumbSchema } from '@/components/seo'
import { getAllFAQQuestions } from '@/data/faq'
import { createPageMetadata, BASE_URL } from '@/lib/seo'

export const metadata: Metadata = createPageMetadata({
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about Minalesh marketplace - shipping, returns, payments, selling, and more.',
  path: '/help/faq'
})

export default function FAQPage() {
  const allQuestions = getAllFAQQuestions()

  return (
    <>
      {/* Structured Data for FAQ Page */}
      <FAQPageSchema questions={allQuestions} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: BASE_URL },
          { name: 'Help', url: `${BASE_URL}/help` },
          { name: 'FAQ', url: `${BASE_URL}/help/faq` }
        ]}
      />
      <FAQClient />
    </>
  )
}
