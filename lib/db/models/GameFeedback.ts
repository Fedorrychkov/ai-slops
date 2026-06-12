import { applyCreatedAtRange } from '@lib/db/utils/applyCreatedAtRange'
import { buildPaginationMeta, clampLimit } from '@lib/db/utils/buildPaginationMeta'
import { ValidationError } from '@lib/error/custom-errors'
import mongoose, { type Document, type HydratedDocument, type Model, type QueryFilter, Schema } from 'mongoose'

import { GameFeedbackModel, GameFeedbackStatus } from '~/api/game-feedback'
import type { GameFeedbackFilter } from '~/api/game-feedback/types'
import { SortOrder } from '~/api/game-feedback/types'
import type { PaginationMeta } from '~/types/pagination'
import { time } from '~/utils/time'

export interface IGameFeedback extends Document, Omit<GameFeedbackModel, 'id' | 'gameId' | 'userId'> {
  gameId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
}

export interface IGameFeedbackModel extends Model<IGameFeedback> {
  /**
   * List of feedback with pagination.
   *
   * **Offset:** `limit` + `offset`, sorted by `createdAt` + `_id` (stable order).
   *
   * **Cursor:** set `cursor` (hex last `_id` from previous page). `offset` is ignored;
   * sorting is done only by `_id` in the direction of `sortOrder`.
   */
  findListPaginated(filter: GameFeedbackFilter): Promise<PaginationMeta<HydratedDocument<IGameFeedback>>>
}

function applyFeedbackFilterFields(q: QueryFilter<IGameFeedback>, rest: Partial<GameFeedbackModel>) {
  if (rest.id != null && mongoose.Types.ObjectId.isValid(String(rest.id))) {
    q._id = new mongoose.Types.ObjectId(String(rest.id))
  }

  if (rest.gameId != null && mongoose.Types.ObjectId.isValid(String(rest.gameId))) {
    q.gameId = new mongoose.Types.ObjectId(String(rest.gameId))
  }

  if (rest.userId != null && mongoose.Types.ObjectId.isValid(String(rest.userId))) {
    q.userId = new mongoose.Types.ObjectId(String(rest.userId))
  }

  if (rest.status !== undefined && rest.status !== null) {
    q.status = rest.status
  }
}

const GameFeedbackSchema: Schema<IGameFeedback> = new Schema<IGameFeedback>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** Snapshot of the author's handle at submit time. */
    authorUsername: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    rating: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(GameFeedbackStatus),
      default: GameFeedbackStatus.PENDING,
      index: true,
    },
    rejectReason: {
      type: String,
      default: null,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: () => time().toISOString(),
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// One feedback per user per game; resubmission replaces the document content.
GameFeedbackSchema.index({ gameId: 1, userId: 1 }, { unique: true })
GameFeedbackSchema.index({ gameId: 1, status: 1, createdAt: -1 })
;(GameFeedbackSchema.statics as Record<string, unknown>).findListPaginated = async function findListPaginated(
  this: Model<IGameFeedback>,
  filter: GameFeedbackFilter,
): Promise<PaginationMeta<HydratedDocument<IGameFeedback>>> {
  const { limit: limitRaw, offset: offsetRaw, cursor, sortOrder, startOfDateIso, endOfDateIso, ...rest } = filter

  const limit = clampLimit(limitRaw)
  const offset = cursor ? 0 : typeof offsetRaw === 'number' && !Number.isNaN(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0

  const base: QueryFilter<IGameFeedback> = {}
  applyFeedbackFilterFields(base, rest)
  applyCreatedAtRange<IGameFeedback>(base, startOfDateIso, endOfDateIso)

  const findQuery: QueryFilter<IGameFeedback> = { ...base }

  const order = sortOrder === SortOrder.asc ? 1 : -1

  let sort: Record<string, 1 | -1>

  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      throw new ValidationError('Invalid cursor: expected ObjectId hex string')
    }

    const oid = new mongoose.Types.ObjectId(cursor)
    findQuery._id = order === 1 ? { $gt: oid } : { $lt: oid }
    sort = { _id: order }
  } else {
    sort = { createdAt: order, _id: order }
  }

  const count = await this.countDocuments(base)
  const list = await this.find(findQuery).sort(sort).skip(offset).limit(limit).exec()

  return buildPaginationMeta({
    list,
    count,
    limit: limitRaw,
    offset: offsetRaw,
    cursor,
  })
}

const GameFeedback = (mongoose.models.GameFeedback as IGameFeedbackModel) || mongoose.model<IGameFeedback>('GameFeedback', GameFeedbackSchema)

export default GameFeedback
