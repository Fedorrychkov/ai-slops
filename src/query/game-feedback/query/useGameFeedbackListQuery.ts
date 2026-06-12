import { ClientGameFeedbackApi, GameFeedbackFilter, GameFeedbackModel } from '~/api/game-feedback'
import { useQueryBuilder } from '~/hooks/useQueryBuilder'
import { PaginationMeta } from '~/types'
import { jsonStringifySafety } from '~/utils/jsonSafe'

export const GAME_FEEDBACK_LIST_QUERY_KEY = 'game-feedback-list'

export const fetchGameFeedbackList = (filter: Partial<GameFeedbackFilter>) => async (): Promise<PaginationMeta<GameFeedbackModel>> => {
  const api = new ClientGameFeedbackApi()

  return api.getList(filter)
}

/** Admin/editor moderation list (any status). */
export const useGameFeedbackListQuery = (
  filter: Partial<GameFeedbackFilter>,
  enabled = true,
  onSuccess?: (data: PaginationMeta<GameFeedbackModel>) => void,
) => {
  const props = useQueryBuilder({
    key: [GAME_FEEDBACK_LIST_QUERY_KEY, jsonStringifySafety(filter)].join('-'),
    enabled,
    method: fetchGameFeedbackList(filter),
    options: {
      onSuccess: (data) => {
        onSuccess?.(data)
      },
    },
  })

  return props
}
