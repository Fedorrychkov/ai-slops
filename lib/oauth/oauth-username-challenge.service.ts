import { cacheClient } from '@lib/cache'

import type { OAuthFlow, OAuthProviderId } from '~/api/oauth'
import { getUniqueId } from '~/utils/getUniqueId'
import { jsonParseSafety, jsonStringifySafety } from '~/utils/jsonSafe'

import type { OAuthProfile, OAuthTokenSet } from './types'

const OAUTH_USERNAME_CHALLENGE_TTL_SECONDS = 15 * 60
const buildKey = (id: string) => `auth:oauth:username:${id}`

export type OAuthUsernameChallengePayload =
  | {
      kind: 'pending_signup'
      provider: OAuthProviderId
      flow: OAuthFlow
      profile: OAuthProfile
      tokens: OAuthTokenSet
      scopes: string[]
      email: string
      suggestedUsername?: string | null
      languageCode?: string | null
      nextPath?: string | null
    }
  | {
      kind: 'existing_user'
      userId: string
      suggestedUsername?: string | null
      nextPath?: string | null
    }

export async function createOAuthUsernameChallenge(payload: OAuthUsernameChallengePayload): Promise<string> {
  const id = getUniqueId()

  await cacheClient.set(buildKey(id), jsonStringifySafety(payload) ?? '', OAUTH_USERNAME_CHALLENGE_TTL_SECONDS)

  return id
}

export async function consumeOAuthUsernameChallenge(id: string): Promise<OAuthUsernameChallengePayload | null> {
  const key = buildKey(id)
  const raw = await cacheClient.get(key)

  if (!raw) {
    return null
  }

  await cacheClient.del(key)

  return jsonParseSafety<OAuthUsernameChallengePayload>(raw) ?? null
}

export async function peekOAuthUsernameChallenge(id: string): Promise<OAuthUsernameChallengePayload | null> {
  const raw = await cacheClient.get(buildKey(id))

  return raw ? (jsonParseSafety<OAuthUsernameChallengePayload>(raw) ?? null) : null
}
