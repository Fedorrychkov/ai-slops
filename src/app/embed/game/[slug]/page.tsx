import type { PageProps } from '@lib/page'
import { getServerForPublicGame } from '@lib/server-action/server-game'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { gameGenreLabel, gameToolLabel } from '~/components/Views/Game/gameLabels'
import { GamePlayer } from '~/components/Views/Game/Public/GamePlayer'
import { routes } from '~/constants'
import { getServerT } from '~/lib/i18n/server'
import { seoConfig } from '~/lib/seo/config'
import { cn } from '~/utils/cn'

export const dynamic = 'force-dynamic'

/** Embeds are widgets on third-party sites — keep them out of search indexes. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const pickParam = (raw: Record<string, string | string[] | undefined>, key: string): string | undefined => {
  const v = raw[key]

  return Array.isArray(v) ? v[0] : v
}

/** Widget customization comes from query params; everything defaults to visible. */
function parseEmbedOptions(raw: Record<string, string | string[] | undefined>) {
  return {
    showTitle: pickParam(raw, 'title') !== '0',
    showPedigree: pickParam(raw, 'pedigree') !== '0',
    showStats: pickParam(raw, 'stats') !== '0',
    theme: pickParam(raw, 'theme') === 'dark' ? 'dark' : pickParam(raw, 'theme') === 'light' ? 'light' : null,
  }
}

export default async function GameEmbedPage(props: PageProps<{ slug: string }>) {
  const params = await props.params
  const slug = params.slug

  if (!slug) {
    notFound()
  }

  const game = await getServerForPublicGame(slug)

  // The author's embed permission is enforced here: no permission — no widget.
  if (!game || game.allowEmbed === false) {
    notFound()
  }

  const sp = await props.searchParams
  const options = parseEmbedOptions(sp)
  const { t } = await getServerT()

  const base = seoConfig.siteUrl.replace(/\/+$/, '')
  const gameUrl = `${base}${routes.gamePublic.path.replace(':slug', game.slug ?? '')}`

  return (
    <div className={cn('flex min-h-screen flex-col gap-3 bg-background p-3 text-foreground', options.theme)}>
      {options.showTitle && (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold leading-tight tracking-tight">
            {game.coverEmoji ? `${game.coverEmoji} ` : ''}
            {game.title}
          </span>
          {game.authorUsername && <span className="text-xs text-muted-foreground">@{game.authorUsername}</span>}
        </div>
      )}

      <GamePlayer game={game} hideBar={!options.showStats} />

      {options.showPedigree && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-primary/40 px-2 py-0.5 text-primary">{gameToolLabel(t, game.tool, game.toolOther)}</span>
          {game.promptCount != null && (
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              ≈ {game.promptCount} {t('game.ui.promptsSpent').toLowerCase()}
            </span>
          )}
          <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">{gameGenreLabel(t, game.genre)}</span>
        </div>
      )}

      {/* Attribution is the one non-negotiable part of the widget. */}
      <a
        href={gameUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto self-end text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        🕹 {t('game.ui.embedAttribution')}
      </a>
    </div>
  )
}
