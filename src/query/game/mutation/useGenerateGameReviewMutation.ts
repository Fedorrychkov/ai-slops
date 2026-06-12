import { useMutation } from 'react-query'

import { ClientGameApi } from '~/api/game'

export const useGenerateGameReviewMutation = () => {
  const generateGameReviewMutation = useMutation(async (gameId: string) => {
    const api = new ClientGameApi()

    const response = await api.generateReview(gameId)

    return response
  })

  return { generateGameReviewMutation }
}
