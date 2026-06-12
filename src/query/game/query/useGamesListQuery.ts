import { ClientGameApi, GameFilter, GameModel } from '~/api/game'
import { useQueryBuilder } from '~/hooks/useQueryBuilder'
import { PaginationMeta } from '~/types'
import { jsonStringifySafety } from '~/utils/jsonSafe'

export const GAME_LIST_QUERY_KEY = 'games-list'

export const fetchGames = (filter: Partial<GameFilter>) => async (): Promise<PaginationMeta<GameModel>> => {
  const api = new ClientGameApi()

  return api.getGames(filter)
}

/** Admin/editor moderation list (any status). */
export const useGamesListQuery = (filter: Partial<GameFilter>, enabled = true, onSuccess?: (data: PaginationMeta<GameModel>) => void) => {
  const props = useQueryBuilder({
    key: [GAME_LIST_QUERY_KEY, jsonStringifySafety(filter)].join('-'),
    enabled,
    method: fetchGames(filter),
    options: {
      onSuccess: (data) => {
        onSuccess?.(data)
      },
    },
  })

  return props
}
