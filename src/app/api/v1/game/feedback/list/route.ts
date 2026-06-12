import connectDB from '@lib/db/client'
import GameFeedback from '@lib/db/models/GameFeedback'
import { gameFeedbackDocumentToApiJson } from '@lib/db/utils/gameFeedbackApiJson'
import { apiErrorHandlerContainer, withAuthMiddleware, withGlobalRateLimit } from '@lib/middleware'
import { AuthSuccessResult } from '@lib/security/auth'
import { NextRequest, NextResponse } from 'next/server'

import { GameFeedbackFilter } from '~/api/game-feedback'
import { UserRole } from '~/api/user'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Feedback moderation list (any status) — admin/editor only. */
const handler = (request: NextRequest, authResult: AuthSuccessResult) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    if (![UserRole.ADMIN, UserRole.EDITOR].includes(authResult.payload.role)) {
      return NextResponse.json({ message: t('errors.insufficientPermissions') }, { status: 403 })
    }

    await connectDB()

    const filter: GameFeedbackFilter = { ...Object.fromEntries(request.nextUrl.searchParams.entries()) }

    const data = await GameFeedback.findListPaginated(filter)

    return response.json({
      ...data,
      list: data.list.map((feedback) => gameFeedbackDocumentToApiJson(feedback)),
    })
  })

export const GET = withGlobalRateLimit(withAuthMiddleware(handler))
