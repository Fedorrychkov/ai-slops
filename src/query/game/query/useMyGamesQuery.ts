import { ClientGameApi, GameFilter, GameModel } from '~/api/game'
import { useQueryBuilder } from '~/hooks/useQueryBuilder'
import { PaginationMeta } from '~/types'
import { jsonStringifySafety } from '~/utils/jsonSafe'

export const MY_GAMES_QUERY_KEY = 'my-games'

export const fetchMyGames = (filter: Partial<GameFilter>) => async (): Promise<PaginationMeta<GameModel>> => {
  const api = new ClientGameApi()

  return api.getMyGames(filter)
}

/** Authenticated user's own submissions (any status). */
export const useMyGamesQuery = (filter: Partial<GameFilter>, enabled = true, onSuccess?: (data: PaginationMeta<GameModel>) => void) => {
  const props = useQueryBuilder({
    key: [MY_GAMES_QUERY_KEY, jsonStringifySafety(filter)].join('-'),
    enabled,
    method: fetchMyGames(filter),
    options: {
      onSuccess: (data) => {
        onSuccess?.(data)
      },
    },
  })

  return props
}
