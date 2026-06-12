import { ClientGameFeedbackApi, PublicGameFeedbackItem } from '~/api/game-feedback'
import { useQueryBuilder } from '~/hooks/useQueryBuilder'
import { PaginationMeta } from '~/types'

export const PUBLIC_GAME_FEEDBACK_QUERY_KEY = 'public-game-feedback'

export const fetchPublicGameFeedback = (gameId: string) => async (): Promise<PaginationMeta<PublicGameFeedbackItem>> => {
  const api = new ClientGameFeedbackApi()

  return api.getPublicList(gameId, { limit: 20, offset: 0 })
}

export const usePublicGameFeedbackQuery = (gameId: string, enabled = true) => {
  const props = useQueryBuilder({
    key: [PUBLIC_GAME_FEEDBACK_QUERY_KEY, gameId].join('-'),
    enabled,
    method: fetchPublicGameFeedback(gameId),
  })

  return props
}
