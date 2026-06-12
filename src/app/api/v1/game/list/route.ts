import connectDB from '@lib/db/client'
import Game from '@lib/db/models/Game'
import { gameDocumentToApiJson } from '@lib/db/utils/gameApiJson'
import { apiErrorHandlerContainer, withAuthMiddleware, withGlobalRateLimit } from '@lib/middleware'
import { AuthSuccessResult } from '@lib/security/auth'
import { NextRequest, NextResponse } from 'next/server'

import { GameFilter } from '~/api/game'
import { UserRole } from '~/api/user'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Moderation list (any status) — admin/editor only. */
const handler = (request: NextRequest, authResult: AuthSuccessResult) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    if (![UserRole.ADMIN, UserRole.EDITOR].includes(authResult.payload.role)) {
      return NextResponse.json({ message: t('errors.insufficientPermissions') }, { status: 403 })
    }

    await connectDB()

    const filter: GameFilter = { ...Object.fromEntries(request.nextUrl.searchParams.entries()) }

    const data = await Game.findListPaginated(filter)

    return response.json({
      ...data,
      list: data.list.map((game) => gameDocumentToApiJson(game, { includeReviewNotes: true })),
    })
  })

export const GET = withGlobalRateLimit(withAuthMiddleware(handler))
