import type { PageProps } from '@lib/page'
import { getServerForPublicGamesPaginated } from '@lib/server-action/server-game'
import type { Metadata } from 'next'
import Link from 'next/link'

import { gameFilterFromPublicSearchParams, PUBLIC_GAMES_PAGE_SIZE } from '~/api/game/publicListQuery'
import { Typography } from '~/components/ui/Typography/Typography'
import { GameCardComponent } from '~/components/Views/Game/GameCardComponent'
import { GamesPublicFeed } from '~/components/Views/Game/Public/GamesPublicFeed'
import { routes } from '~/constants'
import { getServerT } from '~/lib/i18n/server'
import { getAlternateOgLocale, toOgLocale } from '~/lib/seo/articleLanguage'
import { seoConfig } from '~/lib/seo/config'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getServerT()
  const title = t('game.ui.catalogTitle')
  const description = t('game.ui.catalogDescription')
  const base = seoConfig.siteUrl.replace(/\/+$/, '')

  return {
    title,
    description,
    alternates: { canonical: '/games' },
    openGraph: {
      type: 'website',
      siteName: seoConfig.siteName,
      url: `${base}/games`,
      title,
      description,
      locale: toOgLocale(locale),
      alternateLocale: [getAlternateOgLocale(locale)],
    },
  }
}

export default async function GamesPage(props: PageProps) {
  const { t } = await getServerT()
  const sp = await props.searchParams
  const listQuery = gameFilterFromPublicSearchParams(sp)
  listQuery.limit = PUBLIC_GAMES_PAGE_SIZE
  listQuery.offset = 0

  const initial = await getServerForPublicGamesPaginated(listQuery)

  if (!initial) {
    return (
      <Typography variant="Body/M/Regular" className="text-destructive">
        {t('game.errors.couldNotLoadGames')}
      </Typography>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6 mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Typography variant="Body/L/Semibold" asTag="h1">
            {t('game.ui.catalogTitle')}
          </Typography>
          <Typography variant="Body/M/Regular" asTag="p" className="text-muted-foreground">
            {t('game.ui.catalogDescription')}
          </Typography>
        </div>
        <Link
          href={routes.gamesSubmit.path}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
        >
          {t('game.ui.submitYourGame')}
        </Link>
      </div>

      <GamesPublicFeed initial={initial} listQuery={listQuery}>
        {initial.list.map((game) => (
          <GameCardComponent key={game.id} game={game} t={t} />
        ))}
      </GamesPublicFeed>
    </div>
  )
}
