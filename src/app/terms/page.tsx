import type { Metadata } from 'next'

import { LegalDocumentPage } from '~/components/Views/Legal/LegalDocumentPage'
import { getServerT } from '~/lib/i18n/server'
import { seoConfig } from '~/lib/seo/config'

export const dynamic = 'force-dynamic'

const TERMS_SECTIONS = [
  'acceptance',
  'service',
  'accounts',
  'submissions',
  'moderation',
  'acceptableUse',
  'intellectualProperty',
  'sandbox',
  'liability',
  'termination',
  'changes',
  'contact',
] as const

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT()
  const title = t('legal.terms.title')
  const description = t('legal.terms.intro')
  const base = seoConfig.siteUrl.replace(/\/+$/, '')

  return {
    title,
    description,
    alternates: { canonical: '/terms' },
    openGraph: {
      type: 'website',
      siteName: seoConfig.siteName,
      url: `${base}/terms`,
      title,
      description,
    },
    robots: { index: true, follow: true },
  }
}

export default function TermsOfServicePage() {
  return <LegalDocumentPage docKey="terms" sectionIds={TERMS_SECTIONS} />
}
