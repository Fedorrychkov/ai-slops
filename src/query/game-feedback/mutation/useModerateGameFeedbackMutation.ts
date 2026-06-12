import { useMutation } from 'react-query'

import { ClientGameFeedbackApi } from '~/api/game-feedback'
import type { GameFeedbackModerateDto } from '~/api/game-feedback/types'

export const useModerateGameFeedbackMutation = () => {
  const moderateGameFeedbackMutation = useMutation(async ({ id, ...dto }: GameFeedbackModerateDto & { id: string }) => {
    const api = new ClientGameFeedbackApi()

    const response = await api.moderate(id, dto)

    return response
  })

  return { moderateGameFeedbackMutation }
}
