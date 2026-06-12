import { gameDocumentToApiJson } from '@lib/db/utils/gameApiJson'
import { apiErrorHandlerContainer, RouteHandlerContext, withAuthMiddleware, withGlobalRateLimit } from '@lib/middleware'
import { AuthSuccessResult } from '@lib/security/auth'
import { gameService } from '@lib/services/game.service'
import { NextRequest, NextResponse } from 'next/server'

import type { GameUpdateOwnDto } from '~/api/game/types'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Author edits their own submission; any change to a published game sends it back to moderation. */
const handler = (request: NextRequest, authResult: AuthSuccessResult, context?: RouteHandlerContext) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    const paramsData = context ? await context.params : undefined

    const rawId = paramsData?.id
    const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined

    if (!id) {
      return NextResponse.json({ message: t('game.errors.idRequired') }, { status: 400 })
    }

    const body = (await request.json()) as GameUpdateOwnDto

    const game = await gameService.updateOwnGame(id, authResult.payload.sub, body, t)

    return response.json(gameDocumentToApiJson(game, { includeReviewNotes: true }))
  })

export const POST = withGlobalRateLimit(withAuthMiddleware(handler))
