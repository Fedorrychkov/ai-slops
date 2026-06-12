import connectDB from '@lib/db/client'
import User from '@lib/db/models/User'
import { gameFeedbackDocumentToApiJson } from '@lib/db/utils/gameFeedbackApiJson'
import { apiErrorHandlerContainer, withAuthMiddleware, withGlobalRateLimit } from '@lib/middleware'
import { AuthSuccessResult } from '@lib/security/auth'
import { gameFeedbackService } from '@lib/services/game-feedback.service'
import { NextRequest, NextResponse } from 'next/server'

import type { GameFeedbackSubmitDto } from '~/api/game-feedback/types'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Create / replace the authenticated user's feedback for a game — lands in the moderation queue. */
const handler = (request: NextRequest, authResult: AuthSuccessResult) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    await connectDB()

    const author = await User.findById(authResult.payload.sub)

    if (!author) {
      return NextResponse.json({ message: t('user.errors.notFound') }, { status: 404 })
    }

    const body = (await request.json()) as GameFeedbackSubmitDto

    const feedback = await gameFeedbackService.submitFeedback(body, { id: author._id.toString(), username: author.username ?? null }, t)

    return response.json(gameFeedbackDocumentToApiJson(feedback), { status: 201 })
  })

export const POST = withGlobalRateLimit(withAuthMiddleware(handler))
