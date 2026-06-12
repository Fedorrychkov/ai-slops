import connectDB from '@lib/db/client'
import Game from '@lib/db/models/Game'
import { gameDocumentToApiJson } from '@lib/db/utils/gameApiJson'
import { apiErrorHandlerContainer, withAuthMiddleware, withGlobalRateLimit } from '@lib/middleware'
import { AuthSuccessResult } from '@lib/security/auth'
import { NextRequest, NextResponse } from 'next/server'

import { GameFilter } from '~/api/game'

/** Authenticated user's own submissions (any status) — "my games" screen. */
const handler = (request: NextRequest, authResult: AuthSuccessResult) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    await connectDB()

    const filter: GameFilter = {
      ...Object.fromEntries(request.nextUrl.searchParams.entries()),
      authorId: authResult.payload.sub,
    }

    const data = await Game.findListPaginated(filter)

    return response.json({
      ...data,
      list: data.list.map((game) => gameDocumentToApiJson(game, { includeReviewNotes: true })),
    })
  })

export const GET = withGlobalRateLimit(withAuthMiddleware(handler))
