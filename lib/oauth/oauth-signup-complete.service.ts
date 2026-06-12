import connectDB from '@lib/db/client'
import User from '@lib/db/models/User'
import { ValidationError } from '@lib/error/custom-errors'
import { authService } from '@lib/services/auth.service'
import type { RequestClientMeta } from '@lib/utils/request-client-meta'
import { assertUsernamePolicy, normalizeUsername } from '@lib/validation/username'

import type { AuthResponse } from '~/api/auth/model'
import { UserRole, UserStatus } from '~/api/user'
import type { TFunction } from '~/lib/i18n'

import { createOAuthAccount, createOAuthUser, findOAuthAccount } from './oauth-account.service'
import { findUserByEmailForCollision } from './oauth-collision.service'
import { completeLoginForUser, type OAuthFlowResult } from './oauth-flow.service'
import { sanitizeOAuthLoginToUsername } from './oauth-username'
import { consumeOAuthUsernameChallenge, type OAuthUsernameChallengePayload, peekOAuthUsernameChallenge } from './oauth-username-challenge.service'

async function assertUsernameAssignable(usernameRaw: string, t: TFunction): Promise<string> {
  assertUsernamePolicy(usernameRaw, t)

  const username = normalizeUsername(usernameRaw)
  const available = await authService.isUsernameAvailable(username)

  if (!available) {
    throw new ValidationError(t('auth.errors.usernameTaken'))
  }

  return username
}

async function completePendingSignup(
  payload: Extract<OAuthUsernameChallengePayload, { kind: 'pending_signup' }>,
  username: string,
  options: { languageCode?: string | null; clientMeta?: RequestClientMeta | null; t: TFunction },
): Promise<OAuthFlowResult> {
  const existing = await findOAuthAccount(payload.provider, payload.profile.providerUserId)

  if (existing) {
    throw new ValidationError(options.t('auth.oauth.errors.accountExists'))
  }

  const collisionUser = await findUserByEmailForCollision(payload.email)

  if (collisionUser) {
    throw new ValidationError(options.t('auth.oauth.errors.emailCollision'))
  }

  const user = await createOAuthUser({
    email: payload.email,
    languageCode: payload.languageCode,
    username,
  })

  await createOAuthAccount({
    userId: user._id.toString(),
    provider: payload.provider,
    profile: payload.profile,
    tokens: payload.tokens,
    scopes: payload.scopes,
  })

  return completeLoginForUser(user._id.toString(), {
    languageCode: payload.languageCode,
    clientMeta: options.clientMeta,
    nextPath: payload.nextPath,
  })
}

async function completeExistingUser(
  payload: Extract<OAuthUsernameChallengePayload, { kind: 'existing_user' }>,
  username: string,
  options: { languageCode?: string | null; clientMeta?: RequestClientMeta | null; t: TFunction },
): Promise<OAuthFlowResult> {
  await connectDB()

  const user = await User.findById(payload.userId)

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new ValidationError(options.t('profile.errors.notFound'))
  }

  if (user.username) {
    throw new ValidationError(options.t('auth.oauth.errors.usernameAlreadySet'))
  }

  if (user.role === UserRole.ADMIN) {
    throw new ValidationError(options.t('errors.insufficientPermissions'))
  }

  user.username = username
  await user.save()

  return completeLoginForUser(user._id.toString(), {
    languageCode: options.languageCode,
    clientMeta: options.clientMeta,
    nextPath: payload.nextPath,
  })
}

export async function completeOAuthUsernameChallenge(params: {
  challengeId: string
  username: string
  languageCode?: string | null
  clientMeta?: RequestClientMeta | null
  t: TFunction
}): Promise<OAuthFlowResult> {
  const payload = await consumeOAuthUsernameChallenge(params.challengeId)

  if (!payload) {
    throw new ValidationError(params.t('auth.oauth.errors.usernameChallengeExpired'))
  }

  const username = await assertUsernameAssignable(params.username, params.t)

  if (payload.kind === 'pending_signup') {
    return completePendingSignup(payload, username, params)
  }

  return completeExistingUser(payload, username, params)
}

export type OAuthUsernameChallengePublic = {
  kind: OAuthUsernameChallengePayload['kind']
  provider?: string
  suggestedUsername?: string | null
}

export async function getOAuthUsernameChallengePublic(challengeId: string): Promise<OAuthUsernameChallengePublic | null> {
  const payload = await peekOAuthUsernameChallenge(challengeId)

  if (!payload) {
    return null
  }

  if (payload.kind === 'pending_signup') {
    return {
      kind: payload.kind,
      provider: payload.provider,
      suggestedUsername: payload.suggestedUsername ?? sanitizeOAuthLoginToUsername(payload.profile.login),
    }
  }

  return {
    kind: payload.kind,
    suggestedUsername: payload.suggestedUsername ?? null,
  }
}

export type { AuthResponse }
