import connectDB from '@lib/db/client'
import User from '@lib/db/models/User'
import { gameDocumentToApiJson } from '@lib/db/utils/gameApiJson'
import { apiErrorHandlerContainer, withAuthMiddleware, withGlobalRateLimit } from '@lib/middleware'
import { AuthSuccessResult } from '@lib/security/auth'
import { gameService } from '@lib/services/game.service'
import { notifyModeratorsGamePendingModeration } from '@lib/services/game-moderation-notification.service'
import { NextRequest, NextResponse } from 'next/server'

import type { GameSubmitDto } from '~/api/game/types'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Any authenticated user can submit; the game lands in the moderation queue as `pending`. */
const handler = (request: NextRequest, authResult: AuthSuccessResult) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    await connectDB()

    const author = await User.findById(authResult.payload.sub)

    if (!author) {
      return NextResponse.json({ message: t('user.errors.notFound') }, { status: 404 })
    }

    const body = (await request.json()) as GameSubmitDto

    const game = await gameService.submitGame(body, { id: author._id.toString(), username: author.username ?? null }, t)

    void notifyModeratorsGamePendingModeration({
      gameId: game._id.toString(),
      gameTitle: game.title,
      authorUsername: game.authorUsername,
      t,
    })

    return response.json(gameDocumentToApiJson(game), { status: 201 })
  })

export const POST = withGlobalRateLimit(withAuthMiddleware(handler))
