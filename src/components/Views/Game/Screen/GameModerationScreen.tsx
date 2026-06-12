'use client'

import { useState } from 'react'

import { GameAuditResponse, GameModel, GameStatus } from '~/api/game'
import { ClientGameApi } from '~/api/game/client'
import { defaultModerationNotifyUiState, moderationNotifyUiToDto } from '~/api/moderation/types'
import { TitleWithBadge } from '~/components/Blocks/TitleWithBadge'
import { TextAreaField } from '~/components/Fields'
import { usePagination } from '~/components/List/usePagination'
import { Badge, Button, Typography } from '~/components/ui'
import { gameGenreLabel, gameToolLabel } from '~/components/Views/Game/gameLabels'
import { GameAuditReport } from '~/components/Views/Game/Screen/GameAuditReport'
import { GamePreviewFrame } from '~/components/Views/Game/Screen/GamePreviewFrame'
import { ModerationNotifyControls } from '~/components/Views/Moderation/ModerationNotifyControls'
import { useT } from '~/providers'
import { useNotify } from '~/providers/notify'
import { useGameAuditMutation, useGamesListQuery, useGenerateGameReviewMutation, useModerateGameMutation } from '~/query/game'
import { cn } from '~/utils/cn'
import { Logger } from '~/utils/logger'

const logger = new Logger(['GameModerationScreen', '[src/components/Views/Game/Screen/GameModerationScreen.tsx]'])

const PAGE_LIMIT = 25

const STATUS_OPTIONS: {
  value: GameStatus | null
  tKey: 'game.ui.statusPending' | 'game.ui.statusApproved' | 'game.ui.statusRejected' | 'common.clearFilters'
}[] = [
  { value: GameStatus.PENDING, tKey: 'game.ui.statusPending' },
  { value: GameStatus.APPROVED, tKey: 'game.ui.statusApproved' },
  { value: GameStatus.REJECTED, tKey: 'game.ui.statusRejected' },
]

type PreviewState = {
  gameId: string
  html: string
}

export const GameModerationScreen = () => {
  const t = useT()
  const { notify } = useNotify()
  const [status, setStatus] = useState<GameStatus>(GameStatus.PENDING)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approveNotify, setApproveNotify] = useState(defaultModerationNotifyUiState())
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectNotify, setRejectNotify] = useState(defaultModerationNotifyUiState())
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [auditResults, setAuditResults] = useState<Record<string, GameAuditResponse>>({})
  const [auditingId, setAuditingId] = useState<string | null>(null)

  const { page, setPage, offset } = usePagination({ limit: PAGE_LIMIT })

  const { data, isLoading, refetch } = useGamesListQuery({ limit: PAGE_LIMIT, offset, status })

  const { moderateGameMutation } = useModerateGameMutation()
  const { generateGameReviewMutation } = useGenerateGameReviewMutation()
  const { gameAuditMutation } = useGameAuditMutation()

  const handleStatusChange = (next: GameStatus) => {
    setStatus(next)
    setPage(1)
  }

  const openApprove = (gameId: string) => {
    setApprovingId(approvingId === gameId ? null : gameId)
    setRejectingId(null)
    setApproveNotify(defaultModerationNotifyUiState())
  }

  const openReject = (gameId: string) => {
    setRejectingId(rejectingId === gameId ? null : gameId)
    setApprovingId(null)
    setRejectNotify(defaultModerationNotifyUiState())
  }

  const handleApprove = async (game: GameModel) => {
    try {
      await moderateGameMutation.mutateAsync({
        id: game.id,
        status: GameStatus.APPROVED,
        ...moderationNotifyUiToDto(approveNotify),
      })
      setApprovingId(null)
      setApproveNotify(defaultModerationNotifyUiState())
      await refetch()
    } catch (error) {
      logger.error(error)
      notify(t('errors.unknown'), 'warning')
    }
  }

  const handleReject = async (game: GameModel) => {
    try {
      await moderateGameMutation.mutateAsync({
        id: game.id,
        status: GameStatus.REJECTED,
        rejectReason: rejectReason.trim() || null,
        ...moderationNotifyUiToDto(rejectNotify),
      })
      setRejectingId(null)
      setRejectReason('')
      setRejectNotify(defaultModerationNotifyUiState())
      await refetch()
    } catch (error) {
      logger.error(error)
      notify(t('errors.unknown'), 'warning')
    }
  }

  const handleGenerateReview = async (game: GameModel) => {
    try {
      await generateGameReviewMutation.mutateAsync(game.id)
      notify(t('game.ui.reviewGenerated'), 'success')
      await refetch()
    } catch (error) {
      logger.error(error)
      notify(t('game.errors.reviewGenerationFailed'), 'warning')
    }
  }

  const handleAudit = async (game: GameModel) => {
    setAuditingId(game.id)

    try {
      const result = await gameAuditMutation.mutateAsync(game.id)

      setAuditResults((prev) => ({ ...prev, [game.id]: result }))
      notify(t('game.audit.completed'), 'success')
    } catch (error) {
      logger.error(error)
      notify(t('game.audit.errors.generationFailed'), 'warning')
    } finally {
      setAuditingId(null)
    }
  }

  const handlePreview = async (game: GameModel) => {
    if (preview?.gameId === game.id) {
      setPreview(null)

      return
    }

    try {
      const api = new ClientGameApi()
      const full = await api.getGame(game.id)

      setPreview({ gameId: game.id, html: full.htmlContent ?? '' })
    } catch (error) {
      logger.error(error)
      notify(t('errors.unknown'), 'warning')
    }
  }

  const pages = data?.pages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 md:px-8 md:py-4 py-2 px-1">
        <TitleWithBadge title={t('game.ui.moderationTitle')} badgeContent={<Typography variant="Body/XS/Regular">{data?.count ?? 0}</Typography>} />

        <div className="flex items-center gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value ?? 'all'}
              onClick={() => opt.value && handleStatusChange(opt.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                opt.value === status
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40',
              )}
            >
              {t(opt.tKey)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Typography variant="Body/M/Regular">{t('common.loading')}</Typography>}

      <div className="flex flex-col gap-3">
        {(data?.list ?? []).map((game) => (
          <div key={game.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl select-none">{game.coverEmoji || '🎮'}</span>
              <div className="min-w-0">
                <Typography variant="Body/M/Semibold" asTag="h3">
                  {game.title}
                </Typography>
                <Typography variant="Body/XS/Regular" className="text-muted-foreground">
                  @{game.authorUsername ?? '—'} · {gameToolLabel(t, game.tool, game.toolOther)} · {gameGenreLabel(t, game.genre)}
                  {game.promptCount != null ? ` · ${game.promptCount} ${t('game.ui.promptsSpent').toLowerCase()}` : ''}
                </Typography>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline">{game.status}</Badge>
                <Button variant="outline" size="sm-md" onClick={() => handlePreview(game)}>
                  {t('game.ui.preview')}
                </Button>
                <Button variant="outline" size="sm-md" disabled={auditingId === game.id} onClick={() => handleAudit(game)}>
                  {auditingId === game.id ? t('common.loading') : `🛡 ${t('game.audit.run')}`}
                </Button>
                {game.status !== GameStatus.APPROVED && (
                  <Button size="sm-md" disabled={moderateGameMutation.isLoading} onClick={() => openApprove(game.id)}>
                    {t('game.ui.approve')}
                  </Button>
                )}
                {game.status !== GameStatus.REJECTED && (
                  <Button variant="outline" size="sm-md" disabled={moderateGameMutation.isLoading} onClick={() => openReject(game.id)}>
                    {t('game.ui.reject')}
                  </Button>
                )}
                {game.status === GameStatus.APPROVED && (
                  <Button variant="outline" size="sm-md" disabled={generateGameReviewMutation.isLoading} onClick={() => handleGenerateReview(game)}>
                    {generateGameReviewMutation.isLoading
                      ? t('common.loading')
                      : game.aiReviewText
                        ? t('game.ui.regenerateReview')
                        : t('game.ui.generateReview')}
                  </Button>
                )}
              </div>
            </div>

            {game.description && (
              <Typography variant="Body/S/Regular" className="text-muted-foreground">
                {game.description}
              </Typography>
            )}

            {(auditResults[game.id]?.securityAudit ?? game.securityAudit) && (
              <GameAuditReport
                audit={(auditResults[game.id]?.securityAudit ?? game.securityAudit)!}
                auditedAt={auditResults[game.id]?.securityAuditAt ?? game.securityAuditAt}
              />
            )}

            {game.reviewNotes && (
              <Typography variant="Body/XS/Regular" className="whitespace-pre-line rounded-xl bg-muted p-3 text-muted-foreground">
                📝 {t('game.ui.fieldReviewNotes')}: {game.reviewNotes}
              </Typography>
            )}

            {game.aiReviewText && (
              <Typography
                variant="Body/XS/Regular"
                className="whitespace-pre-line rounded-xl border border-border border-l-2 border-l-primary bg-muted p-3 text-muted-foreground"
              >
                {game.aiReviewText}
              </Typography>
            )}

            {approvingId === game.id && (
              <div className="flex flex-col gap-2">
                <ModerationNotifyControls mode="approve" value={approveNotify} onChange={setApproveNotify} />
                <div>
                  <Button size="sm-md" disabled={moderateGameMutation.isLoading} onClick={() => handleApprove(game)}>
                    {t('game.ui.approve')}
                  </Button>
                </div>
              </div>
            )}

            {rejectingId === game.id && (
              <div className="flex flex-col gap-2">
                <TextAreaField
                  name="rejectReason"
                  label={t('game.ui.rejectReason')}
                  value={rejectReason}
                  rows={2}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <ModerationNotifyControls mode="reject" value={rejectNotify} onChange={setRejectNotify} />
                <div>
                  <Button size="sm-md" disabled={moderateGameMutation.isLoading} onClick={() => handleReject(game)}>
                    {t('game.ui.reject')}
                  </Button>
                </div>
              </div>
            )}

            {preview?.gameId === game.id && <GamePreviewFrame html={preview.html} title={game.title ?? 'Preview'} />}
          </div>
        ))}

        {!isLoading && (data?.list ?? []).length === 0 && (
          <Typography variant="Body/M/Regular" className="text-muted-foreground">
            {t('game.ui.emptyCatalog')}
          </Typography>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm-md" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('common.prev')}
          </Button>
          <Typography variant="Body/XS/Regular" className="text-muted-foreground">
            {page} / {pages}
          </Typography>
          <Button variant="outline" size="sm-md" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
