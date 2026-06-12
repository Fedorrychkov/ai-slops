import connectDB from '@lib/db/client'
import Game from '@lib/db/models/Game'
import { gameDocumentToApiJson } from '@lib/db/utils/gameApiJson'
import { apiErrorHandlerContainer, RouteHandlerContext, withAuthMiddleware, withGlobalRateLimit } from '@lib/middleware'
import { AuthSuccessResult } from '@lib/security/auth'
import { NextRequest, NextResponse } from 'next/server'

import { UserRole } from '~/api/user'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Full game (incl. `htmlContent` for moderation preview) — admin/editor, or the author themselves. */
const handler = (request: NextRequest, authResult: AuthSuccessResult, context?: RouteHandlerContext) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    const paramsData = context ? await context.params : undefined

    const rawId = paramsData?.id
    const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined

    if (!id) {
      return NextResponse.json({ message: t('game.errors.idRequired') }, { status: 400 })
    }

    await connectDB()

    const game = await Game.findById(id)

    if (!game) {
      return NextResponse.json({ message: t('game.errors.notFound') }, { status: 404 })
    }

    const isStaff = [UserRole.ADMIN, UserRole.EDITOR].includes(authResult.payload.role)
    const isAuthor = game.authorId?.toString() === authResult.payload.sub

    if (!isStaff && !isAuthor) {
      return NextResponse.json({ message: t('errors.insufficientPermissions') }, { status: 403 })
    }

    return response.json(gameDocumentToApiJson(game, { includeHtmlContent: true, includeReviewNotes: true }))
  })

export const GET = withGlobalRateLimit(withAuthMiddleware(handler))
