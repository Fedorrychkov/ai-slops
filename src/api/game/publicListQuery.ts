import type { GameModel } from '~/api/game/model'
import { GameGenre, GameTool } from '~/api/game/model'
import type { GameFilter } from '~/api/game/types'
import { SortBy, SortOrder } from '~/api/game/types'

/** Catalog card payload — no `htmlContent` / `promptText` (heavy fields stay on the game page). */
export type PublicGameListItem = Omit<GameModel, 'htmlContent' | 'promptText'>

export const PUBLIC_GAMES_PAGE_SIZE = 24

const pickParam = (raw: Record<string, string | string[] | undefined>, key: string): string | undefined => {
  const v = raw[key]

  return Array.isArray(v) ? v[0] : v
}

/** Build filter from URL / searchParams (first page — offset forced to 0 on the page layer if needed). */
export function gameFilterFromPublicSearchParams(raw: Record<string, string | string[] | undefined>): GameFilter {
  const limitRaw = pickParam(raw, 'limit')
  const offsetRaw = pickParam(raw, 'offset')
  const sortByRaw = pickParam(raw, 'sortBy')
  const sortOrderRaw = pickParam(raw, 'sortOrder')
  const toolRaw = pickParam(raw, 'tool')
  const genreRaw = pickParam(raw, 'genre')

  const sortBy = sortByRaw && Object.values(SortBy).includes(sortByRaw as SortBy) ? (sortByRaw as SortBy) : SortBy.approvedAt
  const sortOrder = sortOrderRaw && Object.values(SortOrder).includes(sortOrderRaw as SortOrder) ? (sortOrderRaw as SortOrder) : SortOrder.desc
  const tool = toolRaw && Object.values(GameTool).includes(toolRaw as GameTool) ? (toolRaw as GameTool) : null
  const genre = genreRaw && Object.values(GameGenre).includes(genreRaw as GameGenre) ? (genreRaw as GameGenre) : null

  const limitParsed = limitRaw != null && limitRaw !== '' ? Number(limitRaw) : PUBLIC_GAMES_PAGE_SIZE
  const offsetParsed = offsetRaw != null && offsetRaw !== '' ? Number(offsetRaw) : 0

  return {
    limit: Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : PUBLIC_GAMES_PAGE_SIZE,
    offset: Number.isFinite(offsetParsed) && offsetParsed >= 0 ? offsetParsed : 0,
    cursor: pickParam(raw, 'cursor') ?? null,
    sortBy,
    sortOrder,
    tool,
    genre,
  }
}

/** Query string for catalog filter controls (sort / tool / genre), without pagination. */
export function serializePublicGameListFilters(filter: Pick<GameFilter, 'sortBy' | 'sortOrder' | 'tool' | 'genre'>): string {
  const p = new URLSearchParams()

  if (filter.sortBy && filter.sortBy !== SortBy.approvedAt) {
    p.set('sortBy', filter.sortBy)
  }

  if (filter.sortOrder && filter.sortOrder !== SortOrder.desc) {
    p.set('sortOrder', filter.sortOrder)
  }

  if (filter.tool) {
    p.set('tool', filter.tool)
  }

  if (filter.genre) {
    p.set('genre', filter.genre)
  }

  return p.toString()
}
