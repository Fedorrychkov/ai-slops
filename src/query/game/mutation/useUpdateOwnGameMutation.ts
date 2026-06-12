import { useMutation } from 'react-query'

import { ClientGameApi } from '~/api/game'
import type { GameUpdateOwnDto } from '~/api/game/types'

export const useUpdateOwnGameMutation = () => {
  const updateOwnGameMutation = useMutation(async ({ id, ...dto }: GameUpdateOwnDto & { id: string }) => {
    const api = new ClientGameApi()

    const response = await api.updateOwn(id, dto)

    return response
  })

  return { updateOwnGameMutation }
}
