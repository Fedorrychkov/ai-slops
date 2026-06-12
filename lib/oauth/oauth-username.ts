import { authService } from '@lib/services/auth.service'
import { isReservedUsername, isValidUsernameFormat, normalizeUsername, USERNAME_POLICY } from '@lib/validation/username'

import type { OAuthProfile } from './types'

/** Map provider `login` to our username policy (latin, 3–20, starts with letter). */
export function sanitizeOAuthLoginToUsername(raw: string | null | undefined): string | null {
  if (!raw?.trim()) {
    return null
  }

  let username = normalizeUsername(raw)
  username = username
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  if (!username) {
    return null
  }

  if (!/^[a-z]/.test(username)) {
    username = `u_${username}`.replace(/_+/g, '_')
  }

  if (username.length > USERNAME_POLICY.maxLength) {
    username = username.slice(0, USERNAME_POLICY.maxLength)
  }

  if (username.length < USERNAME_POLICY.minLength) {
    return null
  }

  if (!isValidUsernameFormat(username) || isReservedUsername(username)) {
    return null
  }

  return username
}

async function isUsernameFree(username: string): Promise<boolean> {
  return authService.isUsernameAvailable(username)
}

/** Pick a free username from OAuth profile.login, trying numeric suffixes when taken. */
export async function resolveAvailableOAuthUsername(profile: OAuthProfile): Promise<string | null> {
  const base = sanitizeOAuthLoginToUsername(profile.login)

  if (!base) {
    return null
  }

  if (await isUsernameFree(base)) {
    return base
  }

  for (let i = 2; i <= 99; i++) {
    const suffix = `_${i}`
    const trimmedBase = base.slice(0, Math.max(USERNAME_POLICY.minLength, USERNAME_POLICY.maxLength - suffix.length))
    const candidate = `${trimmedBase}${suffix}`

    if (isValidUsernameFormat(candidate) && !isReservedUsername(candidate) && (await isUsernameFree(candidate))) {
      return candidate
    }
  }

  return null
}
