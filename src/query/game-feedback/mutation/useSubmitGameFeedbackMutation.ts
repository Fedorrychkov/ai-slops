import { useMutation } from 'react-query'

import { ClientGameFeedbackApi } from '~/api/game-feedback'
import type { GameFeedbackSubmitDto } from '~/api/game-feedback/types'

export const useSubmitGameFeedbackMutation = () => {
  const submitGameFeedbackMutation = useMutation(async (dto: GameFeedbackSubmitDto) => {
    const api = new ClientGameFeedbackApi()

    const response = await api.submit(dto)

    return response
  })

  return { submitGameFeedbackMutation }
}
