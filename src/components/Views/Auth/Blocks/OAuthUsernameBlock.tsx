'use client'

import { getUsernamePolicyErrorMessage, normalizeUsername } from '@lib/validation/username'
import { AtSign, UserRoundIcon } from 'lucide-react'
import * as React from 'react'
import { useEffect, useState } from 'react'

import { ClientAuthApi } from '~/api/auth'
import { InputField } from '~/components/Fields'
import { Typography } from '~/components/ui'
import { useT } from '~/providers'
import { Logger } from '~/utils/logger'

const logger = new Logger(['OAuthUsernameBlock', '[src/components/Views/Auth/Blocks/OAuthUsernameBlock.tsx]'])

type Props = {
  challengeId: string
  onSubmit: (username: string) => void
  isLoading: boolean
}

const OAuthUsernameBlock = ({ challengeId, onSubmit, isLoading }: Props) => {
  const t = useT()
  const [username, setUsername] = useState('')
  const [usernameHint, setUsernameHint] = useState('')
  const [error, setError] = useState('')
  const [providerLabel, setProviderLabel] = useState<string | null>(null)
  const [loadingChallenge, setLoadingChallenge] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const api = new ClientAuthApi()
        const result = await api.oauthPendingSignUp(challengeId)

        if (cancelled) return

        if (result.challenge.suggestedUsername) {
          setUsername(result.challenge.suggestedUsername)
        }

        if (result.challenge.provider) {
          setProviderLabel(result.challenge.provider)
        }
      } catch (loadError) {
        logger.error(loadError)

        if (!cancelled) {
          setError(t('auth.oauth.errors.usernameChallengeExpired'))
        }
      } finally {
        if (!cancelled) {
          setLoadingChallenge(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [challengeId, t])

  const handleUsernameBlur = async () => {
    if (!username.trim()) {
      setUsernameHint('')

      return
    }

    const policyError = getUsernamePolicyErrorMessage(username, t)

    if (policyError) {
      setUsernameHint(policyError)

      return
    }

    try {
      const api = new ClientAuthApi()
      const result = await api.usernameAvailable(normalizeUsername(username))

      setUsernameHint(result.available ? '' : (result.message ?? t('auth.errors.usernameTaken')))
    } catch (checkError) {
      logger.error(checkError)
      setUsernameHint('')
    }
  }

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const usernameError = getUsernamePolicyErrorMessage(username, t)

    if (usernameError) {
      setError(usernameError)

      return
    }

    setError('')
    onSubmit(normalizeUsername(username))
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-transparent rounded-xl z-1">
      <form
        onSubmit={handle}
        className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-background dark:from-sky-900/50 rounded-3xl shadow-xl shadow-opacity-10 dark:shadow-sky-900/50 p-8 flex flex-col items-center border border-blue-100 dark:border-background text-foreground"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-background mb-6 shadow-lg shadow-opacity-5">
          <UserRoundIcon className="w-7 h-7 text-foreground" />
        </div>
        <Typography variant="Body/L/Semibold" asTag="h2" className="mb-2 text-center">
          {t('auth.oauth.usernameTitle')}
        </Typography>
        <Typography variant="Body/M/Regular" asTag="p" className="text-sm mb-6 text-center text-muted-foreground">
          {providerLabel ? t('auth.oauth.usernameDescriptionProvider', { provider: providerLabel }) : t('auth.oauth.usernameDescription')}
        </Typography>

        {loadingChallenge ? (
          <div className="w-full h-10 rounded-xl bg-muted animate-pulse mb-4" />
        ) : (
          <div className="w-full flex flex-col gap-3 mb-2">
            <div className="relative">
              <InputField
                placeholder={t('auth.ui.username')}
                type="text"
                name="username"
                value={username}
                disabled={isLoading}
                autoComplete="username"
                additionalLeftComponent={
                  <span className="ml-3 text-gray-400">
                    <AtSign className="w-4 h-4" />
                  </span>
                }
                classNames={{
                  input: 'w-full pl-10 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm',
                }}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setUsernameHint('')
                  setError('')
                }}
                onBlur={handleUsernameBlur}
              />
              {usernameHint && <div className="text-sm text-red-500 text-left mt-1">{usernameHint}</div>}
            </div>
            <div className="w-full flex justify-end">{error && <div className="text-sm text-red-500 text-left">{error}</div>}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || loadingChallenge}
          className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white dark:from-gray-700 dark:to-gray-900 dark:text-foreground dark:hover:text-foreground font-medium py-2 rounded-xl shadow hover:brightness-105 cursor-pointer transition mb-2 mt-2 disabled:opacity-60"
        >
          {t('auth.oauth.usernameSubmit')}
        </button>
      </form>
    </div>
  )
}

export { OAuthUsernameBlock }
