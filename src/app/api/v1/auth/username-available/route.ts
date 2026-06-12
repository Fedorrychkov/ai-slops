import { apiErrorHandlerContainer, withGlobalRateLimit } from '@lib/middleware'
import { authService } from '@lib/services/auth.service'
import { isReservedUsername, isValidUsernameFormat, normalizeUsername, USERNAME_POLICY } from '@lib/validation/username'
import { NextRequest, NextResponse } from 'next/server'

import { getServerTFromNextRequestAsync } from '~/lib/i18n/server'

/**
 * Public availability check for the sign-up form (debounced on the client).
 * Returns 200 with `{ available, message? }` — invalid format is not an HTTP error here,
 * the form needs a calm inline hint, not a thrown toast.
 */
const handler = (request: NextRequest) =>
  apiErrorHandlerContainer(request)(async (res) => {
    const { t } = await getServerTFromNextRequestAsync(request)
    const usernameRaw = request.nextUrl.searchParams.get('username') ?? ''

    if (!usernameRaw.trim()) {
      return NextResponse.json({ available: false, message: t('auth.errors.usernameRequired') }, { status: 200 })
    }

    if (!isValidUsernameFormat(usernameRaw)) {
      return NextResponse.json(
        { available: false, message: t('auth.errors.usernameInvalidFormat', { min: USERNAME_POLICY.minLength, max: USERNAME_POLICY.maxLength }) },
        { status: 200 },
      )
    }

    if (isReservedUsername(usernameRaw)) {
      return NextResponse.json({ available: false, message: t('auth.errors.usernameReserved') }, { status: 200 })
    }

    const available = await authService.isUsernameAvailable(normalizeUsername(usernameRaw))

    return res.json({ available, ...(available ? {} : { message: t('auth.errors.usernameTaken') }) }, { status: 200 })
  })

export const GET = withGlobalRateLimit(handler)
