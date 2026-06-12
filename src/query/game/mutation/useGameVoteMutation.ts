import { useMutation } from 'react-query'

import { ClientGameApi } from '~/api/game'

export const useGameVoteMutation = () => {
  const gameVoteMutation = useMutation(async (gameId: string) => {
    const api = new ClientGameApi()

    const response = await api.vote(gameId)

    return response
  })

  return { gameVoteMutation }
}
