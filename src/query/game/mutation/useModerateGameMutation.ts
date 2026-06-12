import { useMutation } from 'react-query'

import { ClientGameApi } from '~/api/game'
import type { GameModerateDto } from '~/api/game/types'

export const useModerateGameMutation = () => {
  const moderateGameMutation = useMutation(async ({ id, ...dto }: GameModerateDto & { id: string }) => {
    const api = new ClientGameApi()

    const response = await api.moderate(id, dto)

    return response
  })

  return { moderateGameMutation }
}
