'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { ClientPublicGameListApi } from '~/api/game/client/publicGameList'
import { GameGenre, GameTool } from '~/api/game/model'
import { PUBLIC_GAMES_PAGE_SIZE, type PublicGameListItem, serializePublicGameListFilters } from '~/api/game/publicListQuery'
import type { GameFilter } from '~/api/game/types'
import { SortBy, SortOrder } from '~/api/game/types'
import { GameCardComponent } from '~/components/Views/Game/GameCardComponent'
import { gameGenreLabel, gameToolLabel } from '~/components/Views/Game/gameLabels'
import type { TFunction } from '~/lib/i18n'
import { useT } from '~/providers'
import type { PaginationMeta } from '~/types'
import { cn } from '~/utils/cn'
import { Logger } from '~/utils/logger'

const logger = new Logger(['GamesPublicFeed', '[src/components/Views/Game/Public/GamesPublicFeed.tsx]'])

type Props = {
  initial: PaginationMeta<PublicGameListItem>
  listQuery: GameFilter
  /** First page of cards — render on the server (RSC) and pass here for SEO / crawlers. */
  children: ReactNode
}

const getSortOptions = (t: TFunction) => [
  { value: SortBy.approvedAt, label: t('game.ui.sortNewest') },
  { value: SortBy.upvoteCountTotal, label: t('game.ui.sortTopAllTime') },
  { value: SortBy.playCountTotal, label: t('game.ui.sortMostPlayed') },
]

type PillSelectProps = {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}

const PillSelect = ({ label, options, value, onChange }: PillSelectProps) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    <span className="text-xs text-muted-foreground shrink-0">{label}:</span>
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
          opt.value === value
            ? 'bg-foreground text-background border-foreground'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40',
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
)

export function GamesPublicFeed({ initial, listQuery, children }: Props) {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()

  const [extraItems, setExtraItems] = useState<PublicGameListItem[]>([])
  const [totalCount, setTotalCount] = useState(initial.count)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortBy = listQuery.sortBy ?? SortBy.approvedAt
  const tool = listQuery.tool ?? null
  const genre = listQuery.genre ?? null

  useEffect(() => {
    setExtraItems([])
    setTotalCount(initial.count)
    setError(null)
  }, [initial.count, sortBy, tool, genre])

  const applyFilters = (next: Partial<GameFilter>) => {
    const qs = serializePublicGameListFilters({
      sortBy: (next.sortBy ?? sortBy) as SortBy,
      sortOrder: SortOrder.desc,
      tool: next.tool !== undefined ? next.tool : tool,
      genre: next.genre !== undefined ? next.genre : genre,
    })

    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const loadedCount = initial.list.length + extraItems.length
  const hasMore = loadedCount < totalCount

  const handleLoadMore = async () => {
    setLoading(true)
    setError(null)

    try {
      const api = new ClientPublicGameListApi()
      const data = await api.getList({
        ...listQuery,
        limit: PUBLIC_GAMES_PAGE_SIZE,
        offset: loadedCount,
      })

      setExtraItems((prev) => [...prev, ...data.list])
      setTotalCount(data.count)
    } catch (loadError) {
      logger.error(loadError)
      setError(t('game.errors.couldNotLoadGames'))
    } finally {
      setLoading(false)
    }
  }

  const toolOptions = [{ value: '', label: t('game.ui.anyTool') }, ...Object.values(GameTool).map((value) => ({ value, label: gameToolLabel(t, value) }))]

  const genreOptions = [{ value: '', label: t('game.ui.anyGenre') }, ...Object.values(GameGenre).map((value) => ({ value, label: gameGenreLabel(t, value) }))]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <PillSelect label={t('common.filters')} options={getSortOptions(t)} value={sortBy} onChange={(value) => applyFilters({ sortBy: value as SortBy })} />
        <PillSelect
          label={t('game.ui.madeWith')}
          options={toolOptions}
          value={tool ?? ''}
          onChange={(value) => applyFilters({ tool: (value || null) as GameTool | null })}
        />
        <PillSelect
          label={t('game.ui.genre')}
          options={genreOptions}
          value={genre ?? ''}
          onChange={(value) => applyFilters({ genre: (value || null) as GameGenre | null })}
        />
      </div>

      {initial.list.length === 0 ? (
        <p className="text-muted-foreground">{t('game.ui.emptyCatalog')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {children}
          {extraItems.map((game) => (
            <GameCardComponent key={game.id} game={game} t={t} />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('common.next')}
          </button>
        </div>
      )}
    </div>
  )
}
