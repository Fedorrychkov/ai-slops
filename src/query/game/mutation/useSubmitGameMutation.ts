import { useMutation } from 'react-query'

import { ClientGameApi } from '~/api/game'
import type { GameSubmitDto } from '~/api/game/types'

export const useSubmitGameMutation = () => {
  const submitGameMutation = useMutation(async (dto: GameSubmitDto) => {
    const api = new ClientGameApi()

    const response = await api.submit(dto)

    return response
  })

  return { submitGameMutation }
}
