'use client'

import { useState } from 'react'

import { GameFeedbackModel, GameFeedbackStatus } from '~/api/game-feedback'
import { defaultModerationNotifyUiState, moderationNotifyUiToDto } from '~/api/moderation/types'
import { TitleWithBadge } from '~/components/Blocks/TitleWithBadge'
import { TextAreaField } from '~/components/Fields'
import { usePagination } from '~/components/List/usePagination'
import { Badge, Button, Typography } from '~/components/ui'
import { ModerationNotifyControls } from '~/components/Views/Moderation/ModerationNotifyControls'
import { useT } from '~/providers'
import { useNotify } from '~/providers/notify'
import { useGameFeedbackListQuery, useModerateGameFeedbackMutation } from '~/query/game-feedback'
import { cn } from '~/utils/cn'
import { Logger } from '~/utils/logger'
import { time } from '~/utils/time'

const logger = new Logger(['GameFeedbackModerationScreen', '[src/components/Views/Game/Screen/GameFeedbackModerationScreen.tsx]'])

const PAGE_LIMIT = 25

const STATUS_OPTIONS: {
  value: GameFeedbackStatus
  tKey: 'game.ui.statusPending' | 'game.ui.statusApproved' | 'game.ui.statusRejected'
}[] = [
  { value: GameFeedbackStatus.PENDING, tKey: 'game.ui.statusPending' },
  { value: GameFeedbackStatus.APPROVED, tKey: 'game.ui.statusApproved' },
  { value: GameFeedbackStatus.REJECTED, tKey: 'game.ui.statusRejected' },
]

export const GameFeedbackModerationScreen = () => {
  const t = useT()
  const { notify } = useNotify()
  const [status, setStatus] = useState<GameFeedbackStatus>(GameFeedbackStatus.PENDING)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approveNotify, setApproveNotify] = useState(defaultModerationNotifyUiState())
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectNotify, setRejectNotify] = useState(defaultModerationNotifyUiState())

  const { page, setPage, offset } = usePagination({ limit: PAGE_LIMIT })

  const { data, isLoading, refetch } = useGameFeedbackListQuery({ limit: PAGE_LIMIT, offset, status })

  const { moderateGameFeedbackMutation } = useModerateGameFeedbackMutation()

  const handleStatusChange = (next: GameFeedbackStatus) => {
    setStatus(next)
    setPage(1)
  }

  const openApprove = (feedbackId: string) => {
    setApprovingId(approvingId === feedbackId ? null : feedbackId)
    setRejectingId(null)
    setApproveNotify(defaultModerationNotifyUiState())
  }

  const openReject = (feedbackId: string) => {
    setRejectingId(rejectingId === feedbackId ? null : feedbackId)
    setApprovingId(null)
    setRejectNotify(defaultModerationNotifyUiState())
  }

  const handleApprove = async (feedback: GameFeedbackModel) => {
    try {
      await moderateGameFeedbackMutation.mutateAsync({
        id: feedback.id,
        status: GameFeedbackStatus.APPROVED,
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

  const handleReject = async (feedback: GameFeedbackModel) => {
    try {
      await moderateGameFeedbackMutation.mutateAsync({
        id: feedback.id,
        status: GameFeedbackStatus.REJECTED,
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

  const pages = data?.pages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 md:px-8 md:py-4 py-2 px-1">
        <TitleWithBadge title={t('game.feedback.moderationTitle')} badgeContent={<Typography variant="Body/XS/Regular">{data?.count ?? 0}</Typography>} />

        <div className="flex items-center gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
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
        {(data?.list ?? []).map((feedback) => (
          <div key={feedback.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0">
                <Typography variant="Body/M/Semibold" asTag="h3">
                  @{feedback.authorUsername ?? '—'} · {'★'.repeat(feedback.rating ?? 0)}
                </Typography>
                <Typography variant="Body/XS/Regular" className="text-muted-foreground">
                  {feedback.createdAt ? time(feedback.createdAt).format('DD.MM.YYYY HH:mm') : ''}
                </Typography>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline">{feedback.status}</Badge>
                {feedback.status !== GameFeedbackStatus.APPROVED && (
                  <Button size="sm-md" disabled={moderateGameFeedbackMutation.isLoading} onClick={() => openApprove(feedback.id)}>
                    {t('game.ui.approve')}
                  </Button>
                )}
                {feedback.status !== GameFeedbackStatus.REJECTED && (
                  <Button variant="outline" size="sm-md" disabled={moderateGameFeedbackMutation.isLoading} onClick={() => openReject(feedback.id)}>
                    {t('game.ui.reject')}
                  </Button>
                )}
              </div>
            </div>

            <Typography variant="Body/S/Regular" className="whitespace-pre-line">
              {feedback.text}
            </Typography>

            {approvingId === feedback.id && (
              <div className="flex flex-col gap-2">
                <ModerationNotifyControls mode="approve" value={approveNotify} onChange={setApproveNotify} />
                <div>
                  <Button size="sm-md" disabled={moderateGameFeedbackMutation.isLoading} onClick={() => handleApprove(feedback)}>
                    {t('game.ui.approve')}
                  </Button>
                </div>
              </div>
            )}

            {rejectingId === feedback.id && (
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
                  <Button size="sm-md" disabled={moderateGameFeedbackMutation.isLoading} onClick={() => handleReject(feedback)}>
                    {t('game.ui.reject')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!isLoading && (data?.list ?? []).length === 0 && (
          <Typography variant="Body/M/Regular" className="text-muted-foreground">
            {t('game.feedback.moderationEmpty')}
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
