import type { PublicGamesStats } from '@lib/server-action/server-game'
import Link from 'next/link'

import type { GameModel } from '~/api/game'
import { routes } from '~/constants'
import { getServerT } from '~/lib/i18n/server'

type Props = {
  stats: PublicGamesStats
  gameOfTheDay: GameModel | null
}

export const PlatformHero = async ({ stats, gameOfTheDay }: Props) => {
  const { t } = await getServerT()

  const playHref = gameOfTheDay?.slug ? routes.gamePublic.path.replace(':slug', gameOfTheDay.slug) : routes.gamesPublic.path

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
          {t('platform.hero.badge')}
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {t('platform.hero.titleBefore')}{' '}
          <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">{t('platform.hero.titleHighlight')}</span>{' '}
          {t('platform.hero.titleAfter')}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">{t('platform.hero.subtitle')}</p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={playHref}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-80 sm:w-auto"
          >
            ▶ {t('platform.hero.ctaPlay')}
          </Link>
          <Link
            href={routes.gamesPublic.path}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
          >
            {t('platform.hero.ctaBrowse')}
          </Link>
          <Link
            href={routes.gamesSubmit.path}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
          >
            {t('platform.hero.ctaSubmit')}
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
          <div>
            <span className="block text-2xl font-bold text-foreground">{stats.gamesCount}</span>
            {t('platform.hero.statsGames')}
          </div>
          <div>
            <span className="block text-2xl font-bold text-foreground">{stats.playsTotal}</span>
            {t('platform.hero.statsPlays')}
          </div>
          <div>
            <span className="block text-2xl font-bold text-foreground">≈ {stats.promptsTotal}</span>
            {t('platform.hero.statsPrompts')}
          </div>
        </div>
      </div>
    </section>
  )
}
