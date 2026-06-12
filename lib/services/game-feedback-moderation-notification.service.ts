import { resolveNotificationChannelsForEvent } from '@config/notification-events'
import Game from '@lib/db/models/Game'
import { appendModerationNote, deliverModerationAuthorNotification } from '@lib/services/moderation-notification.service'

import { GameFeedbackStatus } from '~/api/game-feedback'
import type { GameFeedbackModerateDto } from '~/api/game-feedback/types'
import { PlatformNotificationType } from '~/api/notification'
import type { TFunction } from '~/lib/i18n'

export async function notifyFeedbackAuthorModerationResult(params: {
  authorUserId: string
  gameId: string
  dto: GameFeedbackModerateDto
  t: TFunction
}): Promise<void> {
  const isApproved = params.dto.status === GameFeedbackStatus.APPROVED
  const rejectReason = params.dto.rejectReason?.trim() || null
  const moderatorNote = params.dto.moderatorNote?.trim() || null

  const game = await Game.findById(params.gameId).select('title slug').lean()
  const gameTitle = game?.title?.trim() || params.t('platformNotifications.triggers.gameFeedbackModeration.fallbackGameTitle')

  const title = isApproved
    ? params.t('platformNotifications.triggers.gameFeedbackApproved.title')
    : params.t('platformNotifications.triggers.gameFeedbackRejected.title')

  let body = isApproved
    ? params.t('platformNotifications.triggers.gameFeedbackApproved.body', { title: gameTitle })
    : params.t('platformNotifications.triggers.gameFeedbackRejected.body', { title: gameTitle })

  body = appendModerationNote(body, isApproved ? moderatorNote : (rejectReason ?? moderatorNote), params.t)

  const urlPath = game?.slug ? `/games/${game.slug}` : '/games'

  await deliverModerationAuthorNotification({
    recipientUserId: params.authorUserId,
    dto: params.dto,
    fallbackChannels: resolveNotificationChannelsForEvent('gameFeedbackModeration'),
    type: isApproved ? PlatformNotificationType.GAME_FEEDBACK_APPROVED : PlatformNotificationType.GAME_FEEDBACK_REJECTED,
    title,
    body,
    urlPath,
    source: 'game_feedback_moderation',
    t: params.t,
  })
}
