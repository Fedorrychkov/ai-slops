import connectDB from '@lib/db/client'
import Game, { IGame } from '@lib/db/models/Game'
import GameVote from '@lib/db/models/GameVote'
import { NotFoundError, ValidationError } from '@lib/error/custom-errors'
import { notifyModeratorsGamePendingModeration } from '@lib/services/game-moderation-notification.service'
import mongoose, { type HydratedDocument } from 'mongoose'

import { GameGenre, GameStatus, GameTool } from '~/api/game'
import { GAME_LIMITS } from '~/api/game/limits'
import type { GameModerateDto, GameSubmitDto, GameUpdateOwnDto } from '~/api/game/types'
import { TFunction } from '~/lib/i18n'
import { time } from '~/utils/time'

/** ASCII slug from a free-form title; empty result falls back to `game`. */
function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, GAME_LIMITS.slugMaxLength)
    .replace(/-+$/g, '')

  return slug || 'game'
}

function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 7)
}

/** Slugs that collide with static segments under `/games/*`. */
const RESERVED_GAME_SLUGS: ReadonlySet<string> = new Set(['submit', 'my', 'new', 'top'])

export class GameService {
  /** Unique slug: plain title slug, with a short random suffix on collision. */
  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugifyTitle(title)
    const existing = RESERVED_GAME_SLUGS.has(base) ? true : await Game.findOne({ slug: base })

    if (!existing) {
      return base
    }

    let candidate = `${base}-${randomSlugSuffix()}`

    while (await Game.findOne({ slug: candidate })) {
      candidate = `${base}-${randomSlugSuffix()}`
    }

    return candidate
  }

  private validateSubmitDto(dto: GameSubmitDto, t: TFunction): void {
    const title = dto.title?.trim() ?? ''

    if (title.length < GAME_LIMITS.titleMinLength || title.length > GAME_LIMITS.titleMaxLength) {
      throw new ValidationError(t('game.errors.titleLength', { min: GAME_LIMITS.titleMinLength, max: GAME_LIMITS.titleMaxLength }))
    }

    if (dto.description != null && dto.description.length > GAME_LIMITS.descriptionMaxLength) {
      throw new ValidationError(t('game.errors.descriptionTooLong', { max: GAME_LIMITS.descriptionMaxLength }))
    }

    if (dto.about != null && dto.about.length > GAME_LIMITS.aboutMaxLength) {
      throw new ValidationError(t('game.errors.aboutTooLong', { max: GAME_LIMITS.aboutMaxLength }))
    }

    if (dto.reviewNotes != null && dto.reviewNotes.length > GAME_LIMITS.reviewNotesMaxLength) {
      throw new ValidationError(t('game.errors.reviewNotesTooLong', { max: GAME_LIMITS.reviewNotesMaxLength }))
    }

    if (!dto.tool || !Object.values(GameTool).includes(dto.tool)) {
      throw new ValidationError(t('game.errors.invalidTool'))
    }

    if (!dto.genre || !Object.values(GameGenre).includes(dto.genre)) {
      throw new ValidationError(t('game.errors.invalidGenre'))
    }

    const htmlContent = dto.htmlContent ?? ''

    if (!htmlContent.trim()) {
      throw new ValidationError(t('game.errors.htmlContentRequired'))
    }

    if (Buffer.byteLength(htmlContent, 'utf8') > GAME_LIMITS.htmlContentMaxBytes) {
      throw new ValidationError(t('game.errors.htmlContentTooLarge', { maxKb: Math.floor(GAME_LIMITS.htmlContentMaxBytes / 1024) }))
    }

    if (dto.promptCount != null && (!Number.isFinite(dto.promptCount) || dto.promptCount < 0)) {
      throw new ValidationError(t('game.errors.invalidPromptCount'))
    }

    if (dto.promptText != null && dto.promptText.length > GAME_LIMITS.promptTextMaxLength) {
      throw new ValidationError(t('game.errors.promptTextTooLong', { max: GAME_LIMITS.promptTextMaxLength }))
    }

    if (dto.coverEmoji != null && dto.coverEmoji.length > GAME_LIMITS.coverEmojiMaxLength) {
      throw new ValidationError(t('game.errors.invalidCoverEmoji'))
    }
  }

  /** Create a moderation-queue entry from a user submission. */
  async submitGame(dto: GameSubmitDto, author: { id: string; username?: string | null }, t: TFunction): Promise<HydratedDocument<IGame>> {
    await connectDB()

    this.validateSubmitDto(dto, t)

    const slug = await this.generateUniqueSlug(dto.title.trim())

    return Game.create({
      slug,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      about: dto.about?.trim() || null,
      reviewNotes: dto.reviewNotes?.trim() || null,
      status: GameStatus.PENDING,
      authorId: new mongoose.Types.ObjectId(author.id),
      authorUsername: author.username ?? null,
      tool: dto.tool,
      toolOther: dto.tool === GameTool.OTHER ? dto.toolOther?.trim() || null : null,
      promptCount: dto.promptCount ?? null,
      promptText: dto.promptText || null,
      genre: dto.genre,
      htmlContent: dto.htmlContent,
      coverEmoji: dto.coverEmoji?.trim() || null,
      allowEmbed: dto.allowEmbed ?? true,
    })
  }

  private detectOwnGameDtoChanges(game: HydratedDocument<IGame>, dto: GameUpdateOwnDto): boolean {
    if (dto.title != null && dto.title.trim() !== game.title) {
      return true
    }

    if (dto.description !== undefined && (dto.description?.trim() || null) !== (game.description ?? null)) {
      return true
    }

    if (dto.about !== undefined && (dto.about?.trim() || null) !== (game.about ?? null)) {
      return true
    }

    if (dto.reviewNotes !== undefined && (dto.reviewNotes?.trim() || null) !== (game.reviewNotes ?? null)) {
      return true
    }

    if (dto.promptCount !== undefined && (dto.promptCount ?? null) !== (game.promptCount ?? null)) {
      return true
    }

    if (dto.promptText !== undefined && (dto.promptText || null) !== (game.promptText ?? null)) {
      return true
    }

    if (dto.coverEmoji !== undefined && (dto.coverEmoji?.trim() || null) !== (game.coverEmoji ?? null)) {
      return true
    }

    if (dto.allowEmbed !== undefined && (dto.allowEmbed ?? true) !== (game.allowEmbed ?? true)) {
      return true
    }

    if (dto.htmlContent !== undefined && dto.htmlContent != null && dto.htmlContent !== game.htmlContent) {
      return true
    }

    return false
  }

  /**
   * Author edits their own submission. Any change to an approved or rejected game
   * unpublishes it and sends it back to the moderation queue.
   */
  async updateOwnGame(gameId: string, authorUserId: string, dto: GameUpdateOwnDto, t: TFunction): Promise<HydratedDocument<IGame>> {
    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw new ValidationError(t('game.errors.invalidGameId'))
    }

    const game = await Game.findById(gameId)

    if (!game || game.authorId?.toString() !== authorUserId) {
      throw new NotFoundError(t('game.errors.notFound'))
    }

    const previousStatus = game.status
    const hasChanges = this.detectOwnGameDtoChanges(game, dto)

    if (dto.title != null) {
      const title = dto.title.trim()

      if (title.length < GAME_LIMITS.titleMinLength || title.length > GAME_LIMITS.titleMaxLength) {
        throw new ValidationError(t('game.errors.titleLength', { min: GAME_LIMITS.titleMinLength, max: GAME_LIMITS.titleMaxLength }))
      }

      game.title = title
    }

    if (dto.description !== undefined) {
      if (dto.description != null && dto.description.length > GAME_LIMITS.descriptionMaxLength) {
        throw new ValidationError(t('game.errors.descriptionTooLong', { max: GAME_LIMITS.descriptionMaxLength }))
      }

      game.description = dto.description?.trim() || null
    }

    if (dto.about !== undefined) {
      if (dto.about != null && dto.about.length > GAME_LIMITS.aboutMaxLength) {
        throw new ValidationError(t('game.errors.aboutTooLong', { max: GAME_LIMITS.aboutMaxLength }))
      }

      game.about = dto.about?.trim() || null
    }

    if (dto.reviewNotes !== undefined) {
      if (dto.reviewNotes != null && dto.reviewNotes.length > GAME_LIMITS.reviewNotesMaxLength) {
        throw new ValidationError(t('game.errors.reviewNotesTooLong', { max: GAME_LIMITS.reviewNotesMaxLength }))
      }

      game.reviewNotes = dto.reviewNotes?.trim() || null
    }

    if (dto.promptCount !== undefined) {
      if (dto.promptCount != null && (!Number.isFinite(dto.promptCount) || dto.promptCount < 0)) {
        throw new ValidationError(t('game.errors.invalidPromptCount'))
      }

      game.promptCount = dto.promptCount ?? null
    }

    if (dto.promptText !== undefined) {
      if (dto.promptText != null && dto.promptText.length > GAME_LIMITS.promptTextMaxLength) {
        throw new ValidationError(t('game.errors.promptTextTooLong', { max: GAME_LIMITS.promptTextMaxLength }))
      }

      game.promptText = dto.promptText || null
    }

    if (dto.coverEmoji !== undefined) {
      if (dto.coverEmoji != null && dto.coverEmoji.length > GAME_LIMITS.coverEmojiMaxLength) {
        throw new ValidationError(t('game.errors.invalidCoverEmoji'))
      }

      game.coverEmoji = dto.coverEmoji?.trim() || null
    }

    if (dto.allowEmbed !== undefined) {
      game.allowEmbed = dto.allowEmbed ?? true
    }

    if (dto.htmlContent !== undefined && dto.htmlContent != null) {
      if (!dto.htmlContent.trim()) {
        throw new ValidationError(t('game.errors.htmlContentRequired'))
      }

      if (Buffer.byteLength(dto.htmlContent, 'utf8') > GAME_LIMITS.htmlContentMaxBytes) {
        throw new ValidationError(t('game.errors.htmlContentTooLarge', { maxKb: Math.floor(GAME_LIMITS.htmlContentMaxBytes / 1024) }))
      }

      game.htmlContent = dto.htmlContent
    }

    if (hasChanges && (previousStatus === GameStatus.APPROVED || previousStatus === GameStatus.REJECTED)) {
      game.status = GameStatus.PENDING
      game.rejectReason = null
      game.securityAudit = null
      game.securityAuditAt = null
    }

    await game.save()

    if (previousStatus !== GameStatus.PENDING && game.status === GameStatus.PENDING) {
      void notifyModeratorsGamePendingModeration({
        gameId: game._id.toString(),
        gameTitle: game.title,
        authorUsername: game.authorUsername,
        t,
      })
    }

    return game
  }

  /** Approve / reject a pending (or re-moderate an existing) game. */
  async moderateGame(gameId: string, dto: GameModerateDto, t: TFunction): Promise<HydratedDocument<IGame>> {
    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw new ValidationError(t('game.errors.invalidGameId'))
    }

    if (![GameStatus.APPROVED, GameStatus.REJECTED].includes(dto.status)) {
      throw new ValidationError(t('game.errors.invalidModerationStatus'))
    }

    const game = await Game.findById(gameId)

    if (!game) {
      throw new NotFoundError(t('game.errors.notFound'))
    }

    game.status = dto.status

    if (dto.status === GameStatus.APPROVED) {
      game.rejectReason = null
      game.approvedAt = game.approvedAt ?? time().toISOString()
    } else {
      game.rejectReason = dto.rejectReason?.trim() || null
    }

    await game.save()

    return game
  }

  /** Toggle the user's upvote; returns the resulting state and counter. */
  async toggleVote(gameId: string, userId: string, t: TFunction): Promise<{ voted: boolean; upvoteCountTotal: number }> {
    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw new ValidationError(t('game.errors.invalidGameId'))
    }

    const game = await Game.findOne({ _id: gameId, status: GameStatus.APPROVED }).select('-htmlContent')

    if (!game) {
      throw new NotFoundError(t('game.errors.notFound'))
    }

    const voteFilter = { gameId: game._id, userId: new mongoose.Types.ObjectId(userId) }
    const existing = await GameVote.findOne(voteFilter)

    if (existing) {
      await GameVote.deleteOne({ _id: existing._id })
      const updated = await Game.findByIdAndUpdate(game._id, { $inc: { upvoteCountTotal: -1 } }, { new: true }).select('upvoteCountTotal')

      return { voted: false, upvoteCountTotal: Math.max(0, updated?.upvoteCountTotal ?? 0) }
    }

    try {
      await GameVote.create(voteFilter)
    } catch (error) {
      // Unique index race: concurrent double-click — treat as already voted.
      if ((error as { code?: number })?.code === 11000) {
        return { voted: true, upvoteCountTotal: game.upvoteCountTotal ?? 0 }
      }

      throw error
    }

    const updated = await Game.findByIdAndUpdate(game._id, { $inc: { upvoteCountTotal: 1 } }, { new: true }).select('upvoteCountTotal')

    return { voted: true, upvoteCountTotal: updated?.upvoteCountTotal ?? 0 }
  }

  /** Increment the play counter for an approved game (product analytics, not billing-grade). */
  async recordPlay(gameId: string, t: TFunction): Promise<{ playCountTotal: number }> {
    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw new ValidationError(t('game.errors.invalidGameId'))
    }

    const updated = await Game.findOneAndUpdate({ _id: gameId, status: GameStatus.APPROVED }, { $inc: { playCountTotal: 1 } }, { new: true }).select(
      'playCountTotal',
    )

    if (!updated) {
      throw new NotFoundError(t('game.errors.notFound'))
    }

    return { playCountTotal: updated.playCountTotal ?? 0 }
  }
}

export const gameService = new GameService()
