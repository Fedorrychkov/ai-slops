import type { ModerationNotifyDto } from '~/api/moderation/types'

import { GameFeedbackModel, GameFeedbackStatus } from './model'

export type GameFeedbackFilter = Partial<Pick<GameFeedbackModel, 'id' | 'gameId' | 'userId' | 'status'>> & {
  limit?: number | null
  offset?: number | null
  /**
   * Cursor pagination: last `_id` from previous portion (hex ObjectId).
   * If set, `offset` is ignored; sorting is done by `_id` (see `findListPaginated` documentation).
   */
  cursor?: string | null
  startOfDateIso?: string | null
  endOfDateIso?: string | null
  sortOrder?: SortOrder | null
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

/** Body of `POST /api/v1/game/feedback` — creates or replaces the user's own feedback (back to pending). */
export type GameFeedbackSubmitDto = {
  gameId: string
  rating: number
  text: string
}

/** Body of `POST /api/v1/game/feedback/moderate/:id` (admin/editor). */
export type GameFeedbackModerateDto = ModerationNotifyDto & {
  status: GameFeedbackStatus.APPROVED | GameFeedbackStatus.REJECTED
  rejectReason?: string | null
}
