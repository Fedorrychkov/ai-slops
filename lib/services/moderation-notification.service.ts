import connectDB from '@lib/db/client'
import User from '@lib/db/models/User'
import { platformNotificationService } from '@lib/services/platform-notification.service'

import type { ModerationNotifyDto } from '~/api/moderation/types'
import { NotificationChannel } from '~/api/notification'
import { UserRole } from '~/api/user'
import type { TFunction } from '~/lib/i18n'
import { Logger } from '~/utils/logger'

const logger = new Logger(['ModerationNotificationService', '[lib/services/moderation-notification.service.ts]'])

export async function listModeratorUserIds(): Promise<string[]> {
  await connectDB()

  const users = await User.find({ role: { $in: [UserRole.ADMIN, UserRole.EDITOR] } })
    .select('_id')
    .lean()

  return users.map((user) => user._id.toString())
}

export function resolveModerationChannels(dto: Pick<ModerationNotifyDto, 'channels'>, fallback: NotificationChannel[] | null): NotificationChannel[] | null {
  if (dto.channels !== undefined) {
    return dto.channels.length > 0 ? [...new Set(dto.channels)] : null
  }

  return fallback
}

export function appendModerationNote(body: string, note: string | null | undefined, t: TFunction): string {
  const trimmed = note?.trim()

  if (!trimmed) {
    return body
  }

  return `${body}\n\n${t('platformNotifications.triggers.moderationNote', { note: trimmed })}`
}

export async function deliverModerationAuthorNotification(params: {
  recipientUserId: string
  dto: ModerationNotifyDto
  fallbackChannels: NotificationChannel[] | null
  type: string
  title: string
  body: string
  urlPath: string
  source: string
  t: TFunction
}): Promise<void> {
  if (params.dto.notifyAuthor === false) {
    return
  }

  const channels = resolveModerationChannels(params.dto, params.fallbackChannels)

  if (!channels?.length) {
    return
  }

  try {
    await platformNotificationService.createAndDeliver(
      {
        recipientUserId: params.recipientUserId,
        type: params.type,
        title: params.title,
        body: params.body,
        urlPath: params.urlPath,
        source: params.source,
        channels,
      },
      params.t,
    )
  } catch (error) {
    logger.error('Failed to deliver moderation author notification', {
      error,
      recipientUserId: params.recipientUserId,
      type: params.type,
    })
  }
}

export async function notifyModerators(params: {
  channels: NotificationChannel[]
  type: string
  title: string
  body: string
  urlPath: string
  source: string
  t: TFunction
}): Promise<void> {
  if (!params.channels.length) {
    return
  }

  const recipientUserIds = await listModeratorUserIds()

  await Promise.all(
    recipientUserIds.map((recipientUserId) =>
      platformNotificationService
        .createAndDeliver(
          {
            recipientUserId,
            type: params.type,
            title: params.title,
            body: params.body,
            urlPath: params.urlPath,
            source: params.source,
            channels: params.channels,
          },
          params.t,
        )
        .catch((error) => {
          logger.error('Failed to deliver moderator notification', {
            error,
            recipientUserId,
            type: params.type,
          })
        }),
    ),
  )
}
