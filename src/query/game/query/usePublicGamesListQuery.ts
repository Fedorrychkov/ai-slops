import { ClientPublicGameListApi, GameFilter, PublicGameListItem } from '~/api/game'
import { useQueryBuilder } from '~/hooks/useQueryBuilder'
import { PaginationMeta } from '~/types'
import { jsonStringifySafety } from '~/utils/jsonSafe'

export const PUBLIC_GAME_LIST_QUERY_KEY = 'public-games-list'

export const fetchPublicGames = (filter: Partial<GameFilter>) => async (): Promise<PaginationMeta<PublicGameListItem>> => {
  const api = new ClientPublicGameListApi()

  return api.getList(filter)
}

export const usePublicGamesListQuery = (filter: Partial<GameFilter>, enabled = true, onSuccess?: (data: PaginationMeta<PublicGameListItem>) => void) => {
  const props = useQueryBuilder({
    key: [PUBLIC_GAME_LIST_QUERY_KEY, jsonStringifySafety(filter)].join('-'),
    enabled,
    method: fetchPublicGames(filter),
    options: {
      onSuccess: (data) => {
        onSuccess?.(data)
      },
    },
  })

  return props
}
