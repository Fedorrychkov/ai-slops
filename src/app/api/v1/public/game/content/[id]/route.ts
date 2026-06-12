import connectDB from '@lib/db/client'
import Game from '@lib/db/models/Game'
import { apiErrorHandlerContainer, RouteHandlerContext, withGlobalRateLimit } from '@lib/middleware'
import { NextRequest, NextResponse } from 'next/server'

import { GameStatus } from '~/api/game'
import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/**
 * Serves the user-submitted single-file HTML for the sandboxed iframe.
 *
 * Defense layers until games move to a dedicated user-content domain:
 * - `CSP sandbox allow-scripts` (no `allow-same-origin`) → the document runs in an opaque origin,
 *   so it cannot read cookies/localStorage of the platform origin.
 * - The embedding `<iframe sandbox="allow-scripts allow-pointer-lock">` duplicates the same restriction.
 * - `X-Frame-Options` is intentionally NOT set here (the page must be frameable by our pages);
 *   `frame-ancestors 'self'` limits embedding to the platform itself.
 */
const handler = (request: NextRequest, context?: RouteHandlerContext) =>
  apiErrorHandlerContainer(request)(async () => {
    const { t } = await getServerTFromNextRequestAsync(request)

    const paramsData = context ? await context.params : undefined

    const rawId = paramsData?.id
    const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined

    if (!id) {
      return NextResponse.json({ message: t('game.errors.idRequired') }, { status: 400 })
    }

    await connectDB()

    const game = await Game.findOne({ _id: id, status: GameStatus.APPROVED }).select('htmlContent allowEmbed')

    if (!game?.htmlContent) {
      return NextResponse.json({ message: t('game.errors.notFound') }, { status: 404 })
    }

    // `frame-ancestors *` only when the author allows third-party embedding (/embed page nests this iframe,
    // and CSP checks the whole ancestor chain — 'self' would break embeds on external sites).
    // eslint-disable-next-line quotes
    const frameAncestors = game.allowEmbed ? '*' : "'self'"

    return new NextResponse(game.htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': `sandbox allow-scripts allow-pointer-lock; frame-ancestors ${frameAncestors}`,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    })
  })

export const GET = withGlobalRateLimit(handler)
