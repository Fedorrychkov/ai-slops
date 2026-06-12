import { apiErrorHandlerContainer, RouteHandlerContext, withGlobalRateLimit } from '@lib/middleware'
import { gameService } from '@lib/services/game.service'
import { NextRequest, NextResponse } from 'next/server'

import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/** Anonymous play counter (rate-limited globally; analytics-grade, not billing-grade). */
const handler = (request: NextRequest, context?: RouteHandlerContext) =>
  apiErrorHandlerContainer(request)(async (response: typeof NextResponse) => {
    const { t } = await getServerTFromNextRequestAsync(request)

    const paramsData = context ? await context.params : undefined

    const rawId = paramsData?.id
    const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined

    if (!id) {
      return NextResponse.json({ message: t('game.errors.idRequired') }, { status: 400 })
    }

    const result = await gameService.recordPlay(id, t)

    return response.json(result)
  })

export const POST = withGlobalRateLimit(handler)
