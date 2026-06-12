import { apiErrorHandlerContainer, withGlobalRateLimit } from '@lib/middleware'
import { getOAuthUsernameChallengePublic } from '@lib/oauth/oauth-signup-complete.service'
import { NextRequest } from 'next/server'

import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

const handler = (request: NextRequest) => {
  return apiErrorHandlerContainer(request)(async (res, req) => {
    const { t } = await getServerTFromNextRequestAsync(request)
    const challengeId = req.nextUrl.searchParams.get('challenge')?.trim()

    if (!challengeId) {
      return res.json({ message: t('auth.oauth.errors.usernameChallengeExpired') }, { status: 400 })
    }

    const payload = await getOAuthUsernameChallengePublic(challengeId)

    if (!payload) {
      return res.json({ message: t('auth.oauth.errors.usernameChallengeExpired') }, { status: 404 })
    }

    return res.json({ success: true, challenge: payload })
  })
}

export const GET = withGlobalRateLimit(handler)
