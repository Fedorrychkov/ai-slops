import { setAuthCookies } from '@lib/cookies'
import { apiErrorHandlerContainer, withGlobalRateLimit } from '@lib/middleware'
import { completeOAuthUsernameChallenge } from '@lib/oauth/oauth-signup-complete.service'
import { notifyNewLogin } from '@lib/services/security-notification.service'
import { getRequestClientMeta } from '@lib/utils/request-client-meta'
import { NextRequest } from 'next/server'

import { getPreferredLanguageCodeFromAcceptLanguage } from '~/lib/i18n/detectLocale'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

const handler = (request: NextRequest) => {
  return apiErrorHandlerContainer(request)(async (res, req) => {
    const { t } = await getServerTFromNextRequestAsync(request)
    const body = (await req.json()) as { challengeId?: string; username?: string }
    const challengeId = body.challengeId?.trim()
    const username = body.username?.trim() ?? ''
    const languageCode = getPreferredLanguageCodeFromAcceptLanguage(req.headers.get('accept-language'))
    const clientMeta = getRequestClientMeta(req)

    if (!challengeId || !username) {
      return res.json({ message: t('auth.errors.usernameRequired') }, { status: 400 })
    }

    const result = await completeOAuthUsernameChallenge({
      challengeId,
      username,
      languageCode,
      clientMeta,
      t,
    })

    if (result.kind === 'redirect') {
      return res.json({ success: false, redirectUrl: result.url }, { status: 409 })
    }

    const response = res.json(
      {
        success: true,
        message: t('user.messages.registeredSuccessfully'),
        user: result.auth.user,
      },
      { status: 201 },
    )

    setAuthCookies(response, result.auth.accessToken, result.auth.refreshToken, result.auth.expiresIn)

    void notifyNewLogin({
      recipientUserId: result.auth.user.id,
      t,
      client: clientMeta,
    })

    return response
  })
}

export const POST = withGlobalRateLimit(handler)
