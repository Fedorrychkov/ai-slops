import { shouldSkipDbDuringBuild } from '@lib/build-phase'
import connectDB from '@lib/db/client'
import Game from '@lib/db/models/Game'
import { gameDocumentToApiJson } from '@lib/db/utils/gameApiJson'

import { GameFilter, GameModel, GameStatus } from '~/api/game'
import type { PublicGameListItem } from '~/api/game/publicListQuery'
import { PaginationMeta } from '~/types'
import { Logger } from '~/utils/logger'

const logger = new Logger(['getServerGame', '[lib/server-action/server-game.ts]'])

function emptyPublicGamesList(): PaginationMeta<PublicGameListItem> {
  return { list: [], count: 0, pages: 0, currentPage: 1 }
}

/** Approved-only catalog page payload (server components; status is forced server-side). */
export async function getServerForPublicGamesPaginated(filter: GameFilter): Promise<PaginationMeta<PublicGameListItem> | null> {
  try {
    if (shouldSkipDbDuringBuild()) {
      return emptyPublicGamesList()
    }

    await connectDB()

    const data = await Game.findListPaginated({ ...filter, status: GameStatus.APPROVED })

    return {
      ...data,
      list: data.list.map((game) => gameDocumentToApiJson(game) as PublicGameListItem),
    }
  } catch (error) {
    logger.error('getServerForPublicGamesPaginated', error)

    return null
  }
}

/** Approved game by slug for the public game page (no `htmlContent` — iframe loads the content route). */
export async function getServerForPublicGame(gameSlug: string): Promise<GameModel | null> {
  try {
    if (shouldSkipDbDuringBuild()) {
      return null
    }

    await connectDB()

    const game = await Game.findOne({ slug: gameSlug.toLowerCase(), status: GameStatus.APPROVED }).select('-htmlContent')

    if (!game) {
      return null
    }

    return gameDocumentToApiJson(game) as GameModel
  } catch (error) {
    logger.error('getServerForPublicGame', error)

    return null
  }
}

export type PublicGamesStats = {
  gamesCount: number
  playsTotal: number
  promptsTotal: number
}

/** Homepage counters: exhibits / plays / prompts wasted (approved games only). */
export async function getServerPublicGamesStats(): Promise<PublicGamesStats> {
  const empty: PublicGamesStats = { gamesCount: 0, playsTotal: 0, promptsTotal: 0 }

  try {
    if (shouldSkipDbDuringBuild()) {
      return empty
    }

    await connectDB()

    const [row] = await Game.aggregate<{ gamesCount: number; playsTotal: number; promptsTotal: number }>([
      { $match: { status: GameStatus.APPROVED } },
      {
        $group: {
          _id: null,
          gamesCount: { $sum: 1 },
          playsTotal: { $sum: { $ifNull: ['$playCountTotal', 0] } },
          promptsTotal: { $sum: { $ifNull: ['$promptCount', 0] } },
        },
      },
    ])

    if (!row) {
      return empty
    }

    return { gamesCount: row.gamesCount, playsTotal: row.playsTotal, promptsTotal: row.promptsTotal }
  } catch (error) {
    logger.error('getServerPublicGamesStats', error)

    return empty
  }
}

/**
 * Deterministic "game of the day": stable for the whole UTC day, rotates daily.
 * Picks by `daysSinceEpoch % count` over approved games in stable `_id` order —
 * no extra state, no cron; the pick changes only when the catalog grows.
 */
export async function getServerGameOfTheDay(): Promise<GameModel | null> {
  try {
    if (shouldSkipDbDuringBuild()) {
      return null
    }

    await connectDB()

    const count = await Game.countDocuments({ status: GameStatus.APPROVED })

    if (count === 0) {
      return null
    }

    const daysSinceEpoch = Math.floor(Date.now() / 86_400_000)
    const index = daysSinceEpoch % count

    const game = await Game.findOne({ status: GameStatus.APPROVED }).sort({ _id: 1 }).skip(index).select('-htmlContent')

    if (!game) {
      return null
    }

    return gameDocumentToApiJson(game) as GameModel
  } catch (error) {
    logger.error('getServerGameOfTheDay', error)

    return null
  }
}
