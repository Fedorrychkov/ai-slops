import { gameDocumentToApiJson } from '@lib/db/utils/gameApiJson'
import { apiErrorHandlerContainer, RouteHandlerContext, withAuthMiddleware, withGlobalRateLimit } from '@lib/middleware'
import { AuthSuccessResult } from '@lib/security/auth'
import { gameService } from '@lib/services/game.service'
import { notifyGameAuthorModerationResult } from '@lib/services/game-moderation-notification.service'
import { gameReviewService } from '@lib/services/game-review.service'
import { NextRequest, NextResponse } from 'next/server'

import { GameStatus } from '~/api/game'
import type { GameModerateDto } from '~/api/game/types'
import { UserRole } from '~/api/user'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Approve / reject a submission — admin/editor only. */
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
      return NextResponse.json({ message: t('game.errors.idRequired') }, { status: 400 })
    }

    const body = (await request.json()) as GameModerateDto

    const game = await gameService.moderateGame(id, body, t)

    // Auto-generate the editorial review on first approval; best-effort — approval never fails on LLM errors.
    if (body.status === GameStatus.APPROVED && !game.aiReviewText) {
      await gameReviewService.tryGenerateReview(game._id.toString(), authResult.payload.sub, t)
    }

    if (game.authorId) {
      void notifyGameAuthorModerationResult({
        authorUserId: game.authorId.toString(),
        gameTitle: game.title,
        gameSlug: game.slug,
        status: body.status,
        dto: body,
        t,
      })
    }

    return response.json(gameDocumentToApiJson(game))
  })

export const POST = withGlobalRateLimit(withAuthMiddleware(handler))
