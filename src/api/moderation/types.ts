import { NotificationChannel } from '~/api/notification'

/** Optional author notification controls on approve/reject (admin/editor). */
export type ModerationNotifyDto = {
  /** Notify the content author (default `true` when omitted). */
  notifyAuthor?: boolean
  /** Delivery channels when notifying; when omitted, platform defaults apply. */
  channels?: NotificationChannel[]
  /** Optional moderator message on approval (appended to the notification body). */
  moderatorNote?: string | null
}

export const DEFAULT_MODERATION_NOTIFY_CHANNELS: NotificationChannel[] = [NotificationChannel.WEB_PUSH, NotificationChannel.EMAIL]

export type ModerationNotifyUiState = {
  notifyAuthor: boolean
  webPush: boolean
  email: boolean
  moderatorNote: string
}

export function defaultModerationNotifyUiState(): ModerationNotifyUiState {
  return {
    notifyAuthor: true,
    webPush: true,
    email: true,
    moderatorNote: '',
  }
}

export function moderationNotifyUiToDto(state: ModerationNotifyUiState): ModerationNotifyDto {
  const channels: NotificationChannel[] = []

  if (state.webPush) {
    channels.push(NotificationChannel.WEB_PUSH)
  }

  if (state.email) {
    channels.push(NotificationChannel.EMAIL)
  }

  return {
    notifyAuthor: state.notifyAuthor,
    channels: state.notifyAuthor && channels.length > 0 ? channels : [],
    moderatorNote: state.moderatorNote.trim() || null,
  }
}
