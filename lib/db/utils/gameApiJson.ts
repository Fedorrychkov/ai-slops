import type { IGame } from '@lib/db/models/Game'
import type { HydratedDocument } from 'mongoose'

import { time } from '~/utils/time'

/** Normalize mongoose Game document for JSON API (string ids, ISO dates). */
export function gameDocumentToApiJson(game: HydratedDocument<IGame>, options?: { includeHtmlContent?: boolean; includeReviewNotes?: boolean }) {
  const o = game.toObject()
  const plain = { ...o } as Record<string, unknown>

  delete plain._id

  if (!options?.includeHtmlContent) {
    delete plain.htmlContent
  }

  // Staff-only fields; public payloads never carry them.
  if (!options?.includeReviewNotes) {
    delete plain.reviewNotes
    delete plain.securityAudit
    delete plain.securityAuditAt
  }

  return {
    ...plain,
    id: game._id.toString(),
    authorId: game.authorId?.toString() ?? null,
    coverImageAssetId: game.coverImageAssetId?.toString() ?? null,
    approvedAt: o.approvedAt != null ? time(o.approvedAt as string | Date).toISOString() : null,
    updatedAt: o.updatedAt != null ? time(o.updatedAt as string | Date).toISOString() : null,
    createdAt: o.createdAt != null ? time(o.createdAt as string | Date).toISOString() : null,
  }
}
