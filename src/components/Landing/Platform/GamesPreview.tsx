import Link from 'next/link'

import type { PublicGameListItem } from '~/api/game/publicListQuery'
import { GameCardComponent } from '~/components/Views/Game/GameCardComponent'
import { routes } from '~/constants'
import { getServerT } from '~/lib/i18n/server'

type Props = {
  games: PublicGameListItem[]
}

export const GamesPreview = async ({ games }: Props) => {
  if (!games?.length) return null

  const { t } = await getServerT()

  return (
    <section className="border-b border-border/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('platform.preview.title')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('platform.preview.subtitle')}</p>
          </div>
          <Link
            href={routes.gamesPublic.path}
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            {t('platform.preview.viewAll')} <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game) => (
            <GameCardComponent key={game.id} game={game} t={t} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href={routes.gamesPublic.path} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t('platform.preview.viewAll')} →
          </Link>
        </div>
      </div>
    </section>
  )
}
