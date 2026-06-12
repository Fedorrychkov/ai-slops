import { useMutation } from 'react-query'

import { ClientGameApi } from '~/api/game'

export const useGameAuditMutation = () => {
  const gameAuditMutation = useMutation(async (gameId: string) => {
    const api = new ClientGameApi()

    const response = await api.auditGame(gameId)

    return response
  })

  return { gameAuditMutation }
}
