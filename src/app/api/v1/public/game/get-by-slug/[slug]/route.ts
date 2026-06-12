import connectDB from '@lib/db/client'
import Game from '@lib/db/models/Game'
import { gameDocumentToApiJson } from '@lib/db/utils/gameApiJson'
import { apiErrorHandlerContainer, RouteHandlerContext, withGlobalRateLimit } from '@lib/middleware'
import { NextRequest, NextResponse } from 'next/server'

import { GameStatus } from '~/api/game'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Public game page payload — approved only; `htmlContent` stays out (served by the content route). */
const handler = (request: NextRequest, context?: RouteHandlerContext) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    const paramsData = context ? await context.params : undefined

    const rawSlug = paramsData?.slug
    const slug = typeof rawSlug === 'string' ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : undefined

    if (!slug) {
      return NextResponse.json({ message: t('game.errors.slugRequired') }, { status: 400 })
    }

    await connectDB()

    const game = await Game.findOne({ slug: slug.toLowerCase(), status: GameStatus.APPROVED }).select('-htmlContent')

    if (!game) {
      return NextResponse.json({ message: t('game.errors.notFound') }, { status: 404 })
    }

    return response.json(gameDocumentToApiJson(game))
  })

export const GET = withGlobalRateLimit(handler)
