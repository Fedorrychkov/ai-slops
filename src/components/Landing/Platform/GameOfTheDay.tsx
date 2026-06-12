import Link from 'next/link'

import type { GameModel } from '~/api/game'
import { gameGenreLabel, gameToolLabel } from '~/components/Views/Game/gameLabels'
import { routes } from '~/constants'
import { getServerT } from '~/lib/i18n/server'

type Props = {
  game: GameModel | null
}

export const GameOfTheDay = async ({ game }: Props) => {
  const { t } = await getServerT()

  if (!game) {
    return (
      <section className="border-b border-border/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center text-muted-foreground">{t('platform.gotd.empty')}</div>
      </section>
    )
  }

  const href = routes.gamePublic.path.replace(':slug', game.slug ?? '')

  return (
    <section className="border-b border-border/40 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-2">
          <Link href={href} className="group flex items-center justify-center bg-muted aspect-[16/10] md:aspect-auto">
            <span className="text-8xl select-none transition-transform duration-300 group-hover:scale-110">{game.coverEmoji || '🎮'}</span>
          </Link>

          <div className="flex flex-col gap-4 p-7 md:p-9">
            <span className="self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              ★ {t('platform.gotd.badge')}
            </span>

            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{game.title}</h2>

            {game.description && <p className="text-sm leading-relaxed text-muted-foreground">{game.description}</p>}

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-primary/40 px-2.5 py-1 text-primary">{gameToolLabel(t, game.tool, game.toolOther)}</span>
              {game.promptCount != null && (
                <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                  ≈ {game.promptCount} {t('game.ui.promptsSpent').toLowerCase()}
                </span>
              )}
              <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{gameGenreLabel(t, game.genre)}</span>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={href}
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-80"
              >
                ▶ {t('game.ui.playNow')}
              </Link>
              <span className="text-sm text-muted-foreground">▲ {game.upvoteCountTotal ?? 0}</span>
              <span className="text-sm text-muted-foreground">
                {game.playCountTotal ?? 0} {t('game.ui.plays')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
