import type { ModerationNotifyDto } from '~/api/moderation/types'

import { GameGenre, GameModel, GameStatus, GameTool } from './model'

export type GameFilter = Partial<
  Omit<GameModel, 'createdAt' | 'updatedAt' | 'htmlContent' | 'promptText' | 'aiReviewText' | 'about' | 'reviewNotes' | 'securityAudit' | 'securityAuditAt'>
> & {
  limit?: number | null
  offset?: number | null
  /**
   * Cursor pagination: last `_id` from previous portion (hex ObjectId).
   * If set, `offset` is ignored; sorting is done by `_id` (see `findListPaginated` documentation).
   */
  cursor?: string | null
  startOfDateIso?: string | null
  endOfDateIso?: string | null
  sortBy?: SortBy | null
  sortOrder?: SortOrder | null
}

export enum SortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  approvedAt = 'approvedAt',
  playCountTotal = 'playCountTotal',
  upvoteCountTotal = 'upvoteCountTotal',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

/** Body of `POST /api/v1/game/submit`. */
export type GameSubmitDto = {
  title: string
  description?: string | null
  /** Public long description for the game page. */
  about?: string | null
  /** Notes for the moderation team (controls, what to check). */
  reviewNotes?: string | null
  tool: GameTool
  toolOther?: string | null
  promptCount?: number | null
  promptText?: string | null
  genre: GameGenre
  htmlContent: string
  coverEmoji?: string | null
  /** Allow third-party sites to embed this game (default true). */
  allowEmbed?: boolean | null
}

/** Body of `POST /api/v1/game/moderate/:id` (admin/editor). */
export type GameModerateDto = ModerationNotifyDto & {
  status: GameStatus.APPROVED | GameStatus.REJECTED
  rejectReason?: string | null
}

/**
 * Body of `POST /api/v1/game/update-own/:id` — author edits their submission.
 * Any change to an approved or rejected game unpublishes it and sends it back to moderation.
 */
export type GameUpdateOwnDto = Partial<
  Pick<GameSubmitDto, 'title' | 'description' | 'about' | 'reviewNotes' | 'promptCount' | 'promptText' | 'coverEmoji' | 'allowEmbed' | 'htmlContent'>
>
