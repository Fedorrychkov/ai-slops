import { resolveNotificationChannelsForEvent } from '@config/notification-events'
import { appendModerationNote, deliverModerationAuthorNotification, notifyModerators } from '@lib/services/moderation-notification.service'

import { GameStatus } from '~/api/game'
import type { GameModerateDto } from '~/api/game/types'
import { PlatformNotificationType } from '~/api/notification'
import type { TFunction } from '~/lib/i18n'

export async function notifyGameAuthorModerationResult(params: {
  authorUserId: string
  gameTitle: string | null | undefined
  gameSlug?: string | null
  status: GameStatus.APPROVED | GameStatus.REJECTED
  dto: GameModerateDto
  t: TFunction
}): Promise<void> {
  const isApproved = params.status === GameStatus.APPROVED
  const rejectReason = params.dto.rejectReason?.trim() || null
  const moderatorNote = params.dto.moderatorNote?.trim() || null
  const gameTitle = params.gameTitle?.trim() || '—'

  const title = isApproved ? params.t('platformNotifications.triggers.gameApproved.title') : params.t('platformNotifications.triggers.gameRejected.title')

  let body = isApproved
    ? params.t('platformNotifications.triggers.gameApproved.body', { title: gameTitle })
    : params.t('platformNotifications.triggers.gameRejected.body', { title: gameTitle })

  body = appendModerationNote(body, isApproved ? moderatorNote : (rejectReason ?? moderatorNote), params.t)

  const urlPath = isApproved && params.gameSlug ? `/games/${params.gameSlug}` : '/games/my'

  await deliverModerationAuthorNotification({
    recipientUserId: params.authorUserId,
    dto: params.dto,
    fallbackChannels: resolveNotificationChannelsForEvent('gameModeration'),
    type: isApproved ? PlatformNotificationType.GAME_APPROVED : PlatformNotificationType.GAME_REJECTED,
    title,
    body,
    urlPath,
    source: 'game_moderation',
    t: params.t,
  })
}

export async function notifyModeratorsGamePendingModeration(params: {
  gameId: string
  gameTitle: string | null | undefined
  authorUsername?: string | null
  t: TFunction
}): Promise<void> {
  const channels = resolveNotificationChannelsForEvent('gamePendingAdmin')

  if (!channels?.length) {
    return
  }

  await notifyModerators({
    channels,
    type: PlatformNotificationType.GAME_PENDING_MODERATION,
    title: params.t('platformNotifications.triggers.gamePendingAdmin.title'),
    body: params.t('platformNotifications.triggers.gamePendingAdmin.body', {
      title: params.gameTitle?.trim() || '—',
      author: params.authorUsername?.trim() || '—',
    }),
    urlPath: '/admin/games',
    source: 'game_pending_moderation',
    t: params.t,
  })
}
