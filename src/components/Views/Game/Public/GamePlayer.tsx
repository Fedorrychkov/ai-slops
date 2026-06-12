'use client'

import { Maximize2Icon, Minimize2Icon } from 'lucide-react'
import { useRef, useState } from 'react'

import type { GameModel } from '~/api/game'
import { useFullscreen } from '~/hooks/useFullscreen'
import { useT } from '~/providers'
import { useNotify } from '~/providers/notify'
import { useGameVoteMutation } from '~/query/game'
import { cn } from '~/utils/cn'
import { Logger } from '~/utils/logger'

const logger = new Logger(['GamePlayer', '[src/components/Views/Game/Public/GamePlayer.tsx]'])

type Props = {
  game: GameModel
  /** Embed mode: hide the vote/plays/fullscreen bar under the stage. */
  hideBar?: boolean
}

/**
 * Sandboxed game player.
 *
 * The iframe deliberately omits `allow-same-origin`: combined with the content route's
 * `CSP sandbox` header the game runs in an opaque origin with no access to platform
 * cookies or storage. Migration to a dedicated user-content domain is planned separately.
 */
export function GamePlayer({ game, hideBar = false }: Props) {
  const t = useT()
  const { notify } = useNotify()
  const { gameVoteMutation } = useGameVoteMutation()

  const [started, setStarted] = useState(false)
  const [playCount, setPlayCount] = useState(game.playCountTotal ?? 0)
  const [upvotes, setUpvotes] = useState(game.upvoteCountTotal ?? 0)
  const [voted, setVoted] = useState(false)
  const playRecorded = useRef(false)
  const playerRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, toggleFullscreen } = useFullscreen(playerRef)

  const contentSrc = `/api/v1/public/game/content/${game.id}`

  const handleStart = async () => {
    setStarted(true)

    // First Play click is a user gesture — expand to fullscreen right away (unless already there).
    if (!isFullscreen) {
      await toggleFullscreen()
    }

    if (playRecorded.current) {
      return
    }

    playRecorded.current = true

    try {
      const response = await fetch(`/api/v1/public/game/play/${game.id}`, { method: 'POST' })

      if (response.ok) {
        const data = (await response.json()) as { playCountTotal?: number }

        setPlayCount(data.playCountTotal ?? playCount + 1)
      }
    } catch (error) {
      // Play counter is best-effort analytics; the game must start regardless.
      logger.error(error)
    }
  }

  const handleVote = async () => {
    try {
      const result = await gameVoteMutation.mutateAsync(game.id)

      setVoted(result.voted)
      setUpvotes(result.upvoteCountTotal)
    } catch (error) {
      logger.error(error)
      notify(t('game.errors.voteFailed'), 'warning')
    }
  }

  return (
    <div
      ref={playerRef}
      className={cn('rounded-2xl border border-border bg-card overflow-hidden', isFullscreen && 'flex h-full w-full flex-col rounded-none border-0')}
    >
      <div className={cn('relative w-full bg-muted', isFullscreen ? 'min-h-0 flex-1' : 'aspect-[16/10]')}>
        {started ? (
          <iframe
            src={contentSrc}
            sandbox="allow-scripts allow-pointer-lock"
            title={game.title ?? 'Game'}
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            onClick={handleStart}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer group"
            aria-label={t('game.ui.playNow')}
          >
            <span className="text-7xl select-none group-hover:scale-110 transition-transform duration-300">{game.coverEmoji || '🎮'}</span>
            <span className="rounded-xl bg-primary px-6 py-3 text-primary-foreground font-semibold shadow group-hover:brightness-110 transition">
              ▶ {t('game.ui.playNow')}
            </span>
            <span className="text-xs text-muted-foreground">{t('game.ui.sandboxNote')}</span>
          </button>
        )}
      </div>

      {hideBar ? null : (
        <div className="flex items-center gap-4 border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <button
            onClick={handleVote}
            disabled={gameVoteMutation.isLoading}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-medium transition-colors disabled:opacity-50',
              voted ? 'border-primary text-primary' : 'border-border hover:border-primary hover:text-primary',
            )}
          >
            ▲ {t('game.ui.upvote')} · {upvotes}
          </button>
          <span>
            {playCount} {t('game.ui.plays')}
          </span>
          <button
            onClick={toggleFullscreen}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium transition-colors hover:border-primary hover:text-primary"
            aria-label={isFullscreen ? t('game.ui.exitFullscreen') : t('game.ui.fullscreen')}
          >
            {isFullscreen ? <Minimize2Icon className="h-4 w-4" /> : <Maximize2Icon className="h-4 w-4" />}
            {isFullscreen ? t('game.ui.exitFullscreen') : t('game.ui.fullscreen')}
          </button>
        </div>
      )}
    </div>
  )
}
