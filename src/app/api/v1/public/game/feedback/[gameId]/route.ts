import connectDB from '@lib/db/client'
import GameFeedback from '@lib/db/models/GameFeedback'
import { gameFeedbackDocumentToPublicJson } from '@lib/db/utils/gameFeedbackApiJson'
import { apiErrorHandlerContainer, RouteHandlerContext, withGlobalRateLimit } from '@lib/middleware'
import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'

import { GameFeedbackStatus } from '~/api/game-feedback'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Approved feedback for the public game page — status filter is forced server-side. */
const handler = (request: NextRequest, context?: RouteHandlerContext) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    const paramsData = context ? await context.params : undefined

    const rawId = paramsData?.gameId
    const gameId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined

    if (!gameId || !mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json({ message: t('game.errors.invalidGameId') }, { status: 400 })
    }

    await connectDB()

    const sp = request.nextUrl.searchParams

    const data = await GameFeedback.findListPaginated({
      gameId,
      status: GameFeedbackStatus.APPROVED,
      limit: sp.get('limit') != null ? Number(sp.get('limit')) : 20,
      offset: sp.get('offset') != null ? Number(sp.get('offset')) : 0,
    })

    return response.json({
      ...data,
      list: data.list.map((feedback) => gameFeedbackDocumentToPublicJson(feedback)),
    })
  })

export const GET = withGlobalRateLimit(handler)
