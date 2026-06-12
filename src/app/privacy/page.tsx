import type { Metadata } from 'next'

import { LegalDocumentPage } from '~/components/Views/Legal/LegalDocumentPage'
import { getServerT } from '~/lib/i18n/server'
import { seoConfig } from '~/lib/seo/config'

export const dynamic = 'force-dynamic'

const PRIVACY_SECTIONS = [
  'controller',
  'dataCollected',
  'purposes',
  'cookies',
  'thirdParties',
  'retention',
  'rights',
  'children',
  'changes',
  'contact',
] as const

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT()
  const title = t('legal.privacy.title')
  const description = t('legal.privacy.intro')
  const base = seoConfig.siteUrl.replace(/\/+$/, '')

  return {
    title,
    description,
    alternates: { canonical: '/privacy' },
    openGraph: {
      type: 'website',
      siteName: seoConfig.siteName,
      url: `${base}/privacy`,
      title,
      description,
    },
    robots: { index: true, follow: true },
  }
}

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage docKey="privacy" sectionIds={PRIVACY_SECTIONS} />
}
