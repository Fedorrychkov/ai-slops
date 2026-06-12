import { getServerForPublicArticlesPaginated } from '@lib/server-action/server-article'
import { getServerForPublicGamesPaginated, getServerGameOfTheDay, getServerPublicGamesStats } from '@lib/server-action/server-game'
import type { Metadata } from 'next'

import { ArticlesPreview, FaqSection } from '~/components/Landing'
import { GameOfTheDay, GamesPreview, HowItWorks, PlatformHero, WhySlop } from '~/components/Landing/Platform'
import { LandingLayout } from '~/components/Layouts/LandingLayout'
import { FALLBACK_THUMBNAIL_IMAGE } from '~/constants'
import { getServerT } from '~/lib/i18n/server'
import { getAlternateOgLocale, toOgLocale } from '~/lib/seo/articleLanguage'
import { seoConfig } from '~/lib/seo/config'
import { getFaqPageJsonLd, getOrganizationJsonLd, getWebSiteJsonLd, JsonLd } from '~/lib/seo/jsonld'

const PLATFORM_FAQ_IDS = ['whatIsSlop', 'isFree', 'howToSubmit', 'isSafe', 'prompts'] as const

/** Games + articles from Mongo — only on request, not on `next build` */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getServerT()
  const title = t('platform.meta.title')
  const description = t('platform.meta.description')
  const ogLocale = toOgLocale(locale)

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: seoConfig.siteName,
      url: seoConfig.siteUrl,
      title,
      description,
      images: [{ url: FALLBACK_THUMBNAIL_IMAGE }],
      locale: ogLocale,
      alternateLocale: [getAlternateOgLocale(locale)],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [FALLBACK_THUMBNAIL_IMAGE],
    },
    alternates: {
      canonical: '/',
    },
  }
}

export default async function Home() {
  const { t } = await getServerT()

  const organizationJsonLd = getOrganizationJsonLd()
  const webSiteJsonLd = getWebSiteJsonLd()

  const [stats, gameOfTheDay, gamesPreview, articles] = await Promise.all([
    getServerPublicGamesStats(),
    getServerGameOfTheDay(),
    getServerForPublicGamesPaginated({ limit: 8, offset: 0 }),
    getServerForPublicArticlesPaginated({ limit: 4, offset: 0 }),
  ])

  const faqItems = PLATFORM_FAQ_IDS.map((id) => ({
    question: t(`platform.faq.items.${id}.question`),
    answer: t(`platform.faq.items.${id}.answer`),
  }))

  const faqJsonLd = getFaqPageJsonLd(faqItems)

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={webSiteJsonLd} />
      <JsonLd data={faqJsonLd} />

      <LandingLayout>
        <PlatformHero stats={stats} gameOfTheDay={gameOfTheDay} />
        <GameOfTheDay game={gameOfTheDay} />
        <GamesPreview games={gamesPreview?.list ?? []} />
        <HowItWorks />
        <WhySlop />
        <ArticlesPreview articles={articles?.list ?? []} />
        <FaqSection items={faqItems} />
      </LandingLayout>
    </>
  )
}
