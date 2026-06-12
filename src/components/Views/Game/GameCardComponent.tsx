import Link from 'next/link'

import type { PublicGameListItem } from '~/api/game/publicListQuery'
import { routes } from '~/constants'
import type { TFunction } from '~/lib/i18n'
import { cn } from '~/utils/cn'

import { gameToolLabel } from './gameLabels'

type Props = {
  game: Partial<PublicGameListItem>
  t: TFunction
  className?: string
}

/** Presentational catalog card — works in both server and client trees (pass `t` from either side). */
export const GameCardComponent = (props: Props) => {
  const { game, t, className } = props

  const href = routes.gamePublic.path.replace(':slug', game.slug ?? '')

  return (
    <article
      aria-label={game.title ?? 'Game'}
      className={cn(
        'group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-border/80 transition-all',
        className,
      )}
    >
      <Link href={href} className="block overflow-hidden" tabIndex={-1} aria-hidden>
        <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden flex items-center justify-center">
          <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300">{game.coverEmoji || '🎮'}</span>
          <span className="absolute bottom-2 right-2 rounded-full bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
            {game.playCountTotal ?? 0} {t('game.ui.plays')}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={href} className="font-semibold leading-snug hover:underline">
          {game.title}
        </Link>

        {game.description ? <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{game.description}</p> : <span className="flex-1" />}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-primary/40 px-2 py-0.5 text-primary">{gameToolLabel(t, game.tool, game.toolOther)}</span>
          {game.promptCount != null && (
            <span>
              {game.promptCount} {t('game.ui.promptsSpent').toLowerCase()}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1">▲ {game.upvoteCountTotal ?? 0}</span>
        </div>
      </div>
    </article>
  )
}
