import type { IGameFeedback } from '@lib/db/models/GameFeedback'
import type { HydratedDocument } from 'mongoose'

import type { PublicGameFeedbackItem } from '~/api/game-feedback'
import { time } from '~/utils/time'

/** Normalize mongoose GameFeedback document for JSON API (string ids, ISO dates). */
export function gameFeedbackDocumentToApiJson(feedback: HydratedDocument<IGameFeedback>) {
  const o = feedback.toObject()
  const plain = { ...o } as Record<string, unknown>

  delete plain._id

  return {
    ...plain,
    id: feedback._id.toString(),
    gameId: feedback.gameId?.toString() ?? null,
    userId: feedback.userId?.toString() ?? null,
    updatedAt: o.updatedAt != null ? time(o.updatedAt as string | Date).toISOString() : null,
    createdAt: o.createdAt != null ? time(o.createdAt as string | Date).toISOString() : null,
  }
}

/** Public projection — no userId / rejectReason / status leakage. */
export function gameFeedbackDocumentToPublicJson(feedback: HydratedDocument<IGameFeedback>): PublicGameFeedbackItem {
  const o = feedback.toObject()

  return {
    id: feedback._id.toString(),
    authorUsername: feedback.authorUsername ?? null,
    rating: feedback.rating ?? null,
    text: feedback.text ?? null,
    createdAt: o.createdAt != null ? time(o.createdAt as string | Date).toISOString() : null,
  }
}
