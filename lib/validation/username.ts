import { ValidationError } from '@lib/error/custom-errors'

import type { TFunction } from '~/lib/i18n'

export const USERNAME_POLICY = {
  minLength: 3,
  maxLength: 20,
  /** Lowercase latin letters, digits and underscore; must start with a letter. */
  patternSource: '^[a-z][a-z0-9_]*$',
} as const

/**
 * Usernames that collide with existing/likely routes or impersonation targets.
 * Keep lowercase.
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'root',
  'support',
  'moderator',
  'system',
  'api',
  'me',
  'profile',
  'login',
  'logout',
  'games',
  'game',
  'articles',
  'article',
  'about',
  'help',
])

/** Normalize raw input to the stored form (trimmed, lowercase). */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function isValidUsernameFormat(usernameRaw: string): boolean {
  const username = normalizeUsername(usernameRaw)

  if (username.length < USERNAME_POLICY.minLength || username.length > USERNAME_POLICY.maxLength) {
    return false
  }

  return new RegExp(USERNAME_POLICY.patternSource).test(username)
}

export function isReservedUsername(usernameRaw: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(usernameRaw))
}

/** Server-side validation for any flow that sets a username (registration, profile update). */
export function assertUsernamePolicy(usernameRaw: string, t: TFunction): void {
  if (!usernameRaw || !usernameRaw.trim()) {
    throw new ValidationError(t('auth.errors.usernameRequired'))
  }

  if (!isValidUsernameFormat(usernameRaw)) {
    throw new ValidationError(t('auth.errors.usernameInvalidFormat', { min: USERNAME_POLICY.minLength, max: USERNAME_POLICY.maxLength }))
  }

  if (isReservedUsername(usernameRaw)) {
    throw new ValidationError(t('auth.errors.usernameReserved'))
  }
}

/** Client-side mirror of `assertUsernamePolicy` returning a message instead of throwing. */
export function getUsernamePolicyErrorMessage(usernameRaw: string, t: TFunction): string | null {
  if (!usernameRaw || !usernameRaw.trim()) {
    return t('auth.errors.usernameRequired')
  }

  if (!isValidUsernameFormat(usernameRaw)) {
    return t('auth.errors.usernameInvalidFormat', { min: USERNAME_POLICY.minLength, max: USERNAME_POLICY.maxLength })
  }

  if (isReservedUsername(usernameRaw)) {
    return t('auth.errors.usernameReserved')
  }

  return null
}
