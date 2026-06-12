import type { Metadata } from 'next'
import Link from 'next/link'

import { Typography } from '~/components/ui/Typography/Typography'
import { routes } from '~/constants'
import { getServerT } from '~/lib/i18n/server'
import { seoConfig } from '~/lib/seo/config'

export const dynamic = 'force-dynamic'

const SUPPORTED_IDS = ['singleFile', 'sandbox', 'fullscreen', 'embeds', 'pedigree'] as const
const REQUIRED_IDS = ['playable', 'aiMade', 'size', 'noExternal', 'noStorage', 'content', 'notes'] as const

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT()
  const title = t('game.requirements.title')
  const description = t('game.requirements.intro')
  const base = seoConfig.siteUrl.replace(/\/+$/, '')

  return {
    title,
    description,
    alternates: { canonical: '/games/requirements' },
    openGraph: {
      type: 'website',
      siteName: seoConfig.siteName,
      url: `${base}/games/requirements`,
      title,
      description,
    },
  }
}

export default async function GamesRequirementsPage() {
  const { t } = await getServerT()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <Typography variant="Body/L/Semibold" asTag="h1">
          {t('game.requirements.title')}
        </Typography>
        <Typography variant="Body/M/Regular" asTag="p" className="mt-2 text-muted-foreground">
          {t('game.requirements.intro')}
        </Typography>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">✅ {t('game.requirements.supportedTitle')}</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {SUPPORTED_IDS.map((id) => (
            <li key={id} className="text-sm leading-relaxed">
              <span className="font-semibold">{t(`game.requirements.supported.${id}.title`)}</span>
              <span className="block text-muted-foreground">{t(`game.requirements.supported.${id}.description`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">📋 {t('game.requirements.requiredTitle')}</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {REQUIRED_IDS.map((id) => (
            <li key={id} className="text-sm leading-relaxed">
              <span className="font-semibold">{t(`game.requirements.required.${id}.title`)}</span>
              <span className="block text-muted-foreground">{t(`game.requirements.required.${id}.description`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="text-center">
        <Link
          href={routes.gamesSubmit.path}
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-80"
        >
          {t('platform.hero.ctaSubmit')}
        </Link>
      </div>
    </div>
  )
}
