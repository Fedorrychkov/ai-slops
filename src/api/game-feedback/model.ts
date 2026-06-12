export type GameFeedbackModel = {
  id: string
  gameId?: string | null
  userId?: string | null
  /** Denormalized public handle at submit time. */
  authorUsername?: string | null
  /** 1–5 stars. */
  rating?: number | null
  text?: string | null
  status?: GameFeedbackStatus | null
  /** Shown to the feedback author when rejected. */
  rejectReason?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export enum GameFeedbackStatus {
  /** Waiting in the moderation queue. */
  PENDING = 'pending',
  /** Visible on the public game page. */
  APPROVED = 'approved',
  /** Declined with `rejectReason`. */
  REJECTED = 'rejected',
}

/** Public game page item — no userId/rejectReason leakage. */
export type PublicGameFeedbackItem = Pick<GameFeedbackModel, 'id' | 'authorUsername' | 'rating' | 'text' | 'createdAt'>
