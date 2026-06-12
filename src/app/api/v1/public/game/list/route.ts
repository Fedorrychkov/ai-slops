import connectDB from '@lib/db/client'
import Game from '@lib/db/models/Game'
import { gameDocumentToApiJson } from '@lib/db/utils/gameApiJson'
import { apiErrorHandlerContainer, withGlobalRateLimit } from '@lib/middleware'
import { NextRequest, NextResponse } from 'next/server'

import { GameStatus } from '~/api/game'
import { gameFilterFromPublicSearchParams } from '~/api/game/publicListQuery'
import { Logger } from '~/utils/logger'

const logger = new Logger('PublicGameListRoute')

/** Public catalog — approved games only, status filter is forced server-side. */
const handler = (request: NextRequest) =>
  apiErrorHandlerContainer(
    request,
    logger,
  )(async (response: typeof NextResponse) => {
    await connectDB()

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const filter = gameFilterFromPublicSearchParams(raw)

    const data = await Game.findListPaginated({ ...filter, status: GameStatus.APPROVED })

    return response.json({
      ...data,
      list: data.list.map((game) => gameDocumentToApiJson(game)),
    })
  })

export const GET = withGlobalRateLimit(handler)
