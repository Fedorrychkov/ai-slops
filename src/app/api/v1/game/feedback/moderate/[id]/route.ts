import { gameFeedbackDocumentToApiJson } from '@lib/db/utils/gameFeedbackApiJson'
import { apiErrorHandlerContainer, RouteHandlerContext, withAuthMiddleware, withGlobalRateLimit } from '@lib/middleware'
import { AuthSuccessResult } from '@lib/security/auth'
import { gameFeedbackService } from '@lib/services/game-feedback.service'
import { notifyFeedbackAuthorModerationResult } from '@lib/services/game-feedback-moderation-notification.service'
import { NextRequest, NextResponse } from 'next/server'

import type { GameFeedbackModerateDto } from '~/api/game-feedback/types'
import { UserRole } from '~/api/user'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Approve / reject a feedback entry — admin/editor only. */
const handler = (request: NextRequest, authResult: AuthSuccessResult, context?: RouteHandlerContext) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    if (![UserRole.ADMIN, UserRole.EDITOR].includes(authResult.payload.role)) {
      return NextResponse.json({ message: t('errors.insufficientPermissions') }, { status: 403 })
    }

    const paramsData = context ? await context.params : undefined

    const rawId = paramsData?.id
    const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined

    if (!id) {
      return NextResponse.json({ message: t('game.feedback.errors.idRequired') }, { status: 400 })
    }

    const body = (await request.json()) as GameFeedbackModerateDto

    const feedback = await gameFeedbackService.moderateFeedback(id, body, t)

    if (feedback.userId) {
      void notifyFeedbackAuthorModerationResult({
        authorUserId: feedback.userId.toString(),
        gameId: feedback.gameId.toString(),
        dto: body,
        t,
      })
    }

    return response.json(gameFeedbackDocumentToApiJson(feedback))
  })

export const POST = withGlobalRateLimit(withAuthMiddleware(handler))
