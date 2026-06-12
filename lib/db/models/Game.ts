import { applyCreatedAtRange } from '@lib/db/utils/applyCreatedAtRange'
import { buildPaginationMeta, clampLimit } from '@lib/db/utils/buildPaginationMeta'
import { ValidationError } from '@lib/error/custom-errors'
import mongoose, { type Document, type HydratedDocument, type Model, type QueryFilter, Schema } from 'mongoose'

import { GameGenre, GameModel, GameStatus, GameTool } from '~/api/game'
import type { GameFilter } from '~/api/game/types'
import { SortBy, SortOrder } from '~/api/game/types'
import type { PaginationMeta } from '~/types/pagination'
import { time } from '~/utils/time'

export interface IGame extends Document, Omit<GameModel, 'id' | 'authorId' | 'coverImageAssetId' | 'securityAudit'> {
  authorId?: mongoose.Types.ObjectId | null
  coverImageAssetId?: mongoose.Types.ObjectId | null
  /** Stored as Mixed; typed loosely at the document level — cast to `GameSecurityAudit` at the API boundary. */
  securityAudit?: Record<string, unknown> | null
}

export interface IGameModel extends Model<IGame> {
  /**
   * List of games with pagination.
   *
   * **Offset:** `limit` + `offset`, sorting `sortBy` + `_id` (stable order).
   *
   * **Cursor:** set `cursor` (hex last `_id` from previous page). `offset` is ignored.
   * Sorting is done only by `_id` in the direction of `sortOrder` (`asc` → next greater id, `desc` → smaller).
   * The `sortBy` field does not affect the order when `cursor` is present (only `_id`).
   */
  findListPaginated(filter: GameFilter): Promise<PaginationMeta<HydratedDocument<IGame>>>
}

function applyGameFilterFields(q: QueryFilter<IGame>, rest: Partial<Omit<GameModel, 'htmlContent' | 'promptText' | 'aiReviewText'>>) {
  if (rest.id != null && mongoose.Types.ObjectId.isValid(String(rest.id))) {
    q._id = new mongoose.Types.ObjectId(String(rest.id))
  }

  if (rest.slug != null && String(rest.slug).trim()) {
    q.slug = String(rest.slug).trim().toLowerCase()
  }

  if (rest.status !== undefined && rest.status !== null) {
    q.status = rest.status
  }

  if (rest.tool !== undefined && rest.tool !== null) {
    q.tool = rest.tool
  }

  if (rest.genre !== undefined && rest.genre !== null) {
    q.genre = rest.genre
  }

  if (rest.authorId != null && mongoose.Types.ObjectId.isValid(String(rest.authorId))) {
    q.authorId = new mongoose.Types.ObjectId(String(rest.authorId))
  }
}

const GameSchema: Schema<IGame> = new Schema<IGame>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    slug: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      default: null,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    /** Public long description (game page). */
    about: {
      type: String,
      default: null,
    },
    /** Author → moderators notes; stripped from public payloads in `gameDocumentToApiJson`. */
    reviewNotes: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(GameStatus),
      default: GameStatus.PENDING,
      index: true,
    },
    rejectReason: {
      type: String,
      default: null,
      trim: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    /** Snapshot of the author's handle at submit time (catalog cards render without a join). */
    authorUsername: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    tool: {
      type: String,
      enum: Object.values(GameTool),
      default: GameTool.OTHER,
      index: true,
    },
    toolOther: {
      type: String,
      default: null,
      trim: true,
    },
    promptCount: {
      type: Number,
      default: null,
      min: 0,
    },
    promptText: {
      type: String,
      default: null,
    },
    genre: {
      type: String,
      enum: Object.values(GameGenre),
      default: GameGenre.OTHER,
      index: true,
    },
    /** Single-file HTML payload for the sandboxed iframe; size is validated at the submit route. */
    htmlContent: {
      type: String,
      default: null,
    },
    coverEmoji: {
      type: String,
      default: null,
      trim: true,
    },
    coverImageAssetId: {
      type: Schema.Types.ObjectId,
      ref: 'MediaAsset',
      default: null,
    },
    aiReviewText: {
      type: String,
      default: null,
    },
    /** Author's permission for third-party embedding (default true — embeds drive growth). */
    allowEmbed: {
      type: Boolean,
      default: true,
    },
    /** Latest AI security audit (structured JSON, staff-only). */
    securityAudit: {
      type: Schema.Types.Mixed,
      default: null,
    },
    securityAuditAt: {
      type: Date,
      default: null,
    },
    playCountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    upvoteCountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvedAt: {
      type: Date,
      default: null,
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

GameSchema.index({ slug: 1 }, { unique: true, sparse: true })
GameSchema.index({ status: 1, approvedAt: -1 })
GameSchema.index({ status: 1, upvoteCountTotal: -1 })
;(GameSchema.statics as Record<string, unknown>).findListPaginated = async function findListPaginated(
  this: Model<IGame>,
  filter: GameFilter,
): Promise<PaginationMeta<HydratedDocument<IGame>>> {
  const { limit: limitRaw, offset: offsetRaw, cursor, sortBy, sortOrder, startOfDateIso, endOfDateIso, ...rest } = filter

  const limit = clampLimit(limitRaw)
  const offset = cursor ? 0 : typeof offsetRaw === 'number' && !Number.isNaN(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0

  const base: QueryFilter<IGame> = {}
  applyGameFilterFields(base, rest)
  applyCreatedAtRange<IGame>(base, startOfDateIso, endOfDateIso)

  const findQuery: QueryFilter<IGame> = { ...base }

  const order = sortOrder === SortOrder.asc ? 1 : -1
  const sortField = sortBy ?? SortBy.createdAt

  let sort: Record<string, 1 | -1>

  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      throw new ValidationError('Invalid cursor: expected ObjectId hex string')
    }

    const oid = new mongoose.Types.ObjectId(cursor)
    findQuery._id = order === 1 ? { $gt: oid } : { $lt: oid }
    sort = { _id: order }
  } else {
    sort = { [sortField]: order, _id: order }
  }

  const count = await this.countDocuments(base)
  const list = await this.find(findQuery).sort(sort).skip(offset).limit(limit).select('-htmlContent').exec()

  return buildPaginationMeta({
    list,
    count,
    limit: limitRaw,
    offset: offsetRaw,
    cursor,
  })
}

const Game = (mongoose.models.Game as IGameModel) || mongoose.model<IGame>('Game', GameSchema)

export default Game
