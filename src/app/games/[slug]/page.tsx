import type { PageProps } from '@lib/page'
import { getServerForPublicGame } from '@lib/server-action/server-game'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Typography } from '~/components/ui/Typography/Typography'
import { gameGenreLabel, gameToolLabel } from '~/components/Views/Game/gameLabels'
import { GameEmbedBuilder } from '~/components/Views/Game/Public/GameEmbedBuilder'
import { GameFeedbackSection } from '~/components/Views/Game/Public/GameFeedbackSection'
import { GamePlayer } from '~/components/Views/Game/Public/GamePlayer'
import { routes } from '~/constants'
import { getServerT } from '~/lib/i18n/server'
import { getAlternateOgLocale, toOgLocale } from '~/lib/seo/articleLanguage'
import { seoConfig } from '~/lib/seo/config'
import { JsonLd } from '~/lib/seo/jsonld'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: PageProps<{ slug: string }>): Promise<Metadata> {
  const params = await props.params
  const slug = params.slug

  if (!slug) {
    return { title: 'Game' }
  }

  const game = await getServerForPublicGame(slug)

  if (!game) {
    return { title: 'Game' }
  }

  const { locale } = await getServerT()
  const base = seoConfig.siteUrl.replace(/\/+$/, '')
  const title = game.title ?? 'Game'
  const description = game.description ?? undefined

  return {
    title,
    description,
    alternates: { canonical: `/games/${game.slug}` },
    openGraph: {
      type: 'website',
      siteName: seoConfig.siteName,
      url: `${base}/games/${game.slug}`,
      title,
      description,
      locale: toOgLocale(locale),
      alternateLocale: [getAlternateOgLocale(locale)],
    },
  }
}

export default async function GamePage(props: PageProps<{ slug: string }>) {
  const params = await props.params
  const slug = params.slug

  if (!slug) {
    notFound()
  }

  const game = await getServerForPublicGame(slug)

  if (!game) {
    notFound()
  }

  const { t } = await getServerT()
  const base = seoConfig.siteUrl.replace(/\/+$/, '')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.description ?? undefined,
    url: `${base}/games/${game.slug}`,
    playMode: 'SinglePlayer',
    applicationCategory: 'Game',
    gamePlatform: 'Web Browser',
    author: game.authorUsername ? { '@type': 'Person', name: game.authorUsername } : undefined,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'PlayAction' },
        userInteractionCount: game.playCountTotal ?? 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'LikeAction' },
        userInteractionCount: game.upvoteCountTotal ?? 0,
      },
    ],
  }

  return (
    <div className="flex w-full flex-col gap-6 mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <JsonLd data={jsonLd} />

      <nav className="text-sm text-muted-foreground">
        <Link href={routes.gamesPublic.path} className="hover:text-foreground">
          {t('game.ui.games')}
        </Link>
        <span className="mx-2">/</span>
        <span>{game.title}</span>
      </nav>

      <div>
        <Typography variant="Body/L/Semibold" asTag="h1">
          {game.coverEmoji ? `${game.title} ${game.coverEmoji}` : game.title}
        </Typography>
        {game.authorUsername && (
          <Typography variant="Body/M/Regular" asTag="p" className="text-muted-foreground">
            {t('game.ui.author')}: @{game.authorUsername}
          </Typography>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <GamePlayer game={game} />

          {game.about && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <Typography variant="Body/S/Semibold" asTag="h2" className="uppercase tracking-wide text-muted-foreground">
                {t('game.ui.aboutTitle')}
              </Typography>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{game.about}</p>
            </section>
          )}

          {game.aiReviewText && (
            <section className="rounded-2xl border border-border border-l-4 border-l-primary bg-card p-5">
              <Typography variant="Body/S/Semibold" asTag="h2" className="uppercase tracking-wide text-primary">
                ✦ {t('game.ui.aiReview')}
              </Typography>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{game.aiReviewText}</p>
            </section>
          )}

          <GameFeedbackSection gameId={game.id} />
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card p-5">
            <Typography variant="Body/S/Semibold" asTag="h2" className="uppercase tracking-wide text-muted-foreground">
              {t('game.ui.pedigree')}
            </Typography>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t('game.ui.madeWith')}</dt>
                <dd className="rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary">{gameToolLabel(t, game.tool, game.toolOther)}</dd>
              </div>
              {game.promptCount != null && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">{t('game.ui.promptsSpent')}</dt>
                  <dd>≈ {game.promptCount}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t('game.ui.genre')}</dt>
                <dd>{gameGenreLabel(t, game.genre)}</dd>
              </div>
            </dl>
          </section>

          {game.allowEmbed !== false && <GameEmbedBuilder game={game} />}

          {game.promptText && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <Typography variant="Body/S/Semibold" asTag="h2" className="uppercase tracking-wide text-muted-foreground">
                {t('game.ui.originalPrompt')}
              </Typography>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-muted p-3 font-mono text-xs text-muted-foreground">{game.promptText}</pre>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
