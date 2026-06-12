import { AxiosHeaders } from 'axios'
import { useMutation } from 'react-query'

import { ClientAuthApi } from '~/api/auth'

function localeHeaders(): AxiosHeaders | undefined {
  if (typeof navigator === 'undefined') {
    return undefined
  }

  return new AxiosHeaders({ 'Accept-Language': navigator.language })
}

export const useOAuthCompleteSignUpMutation = () => {
  return useMutation(async (data: { challengeId: string; username: string }) => {
    const api = new ClientAuthApi()

    return api.oauthCompleteSignUp(data, localeHeaders())
  })
}
