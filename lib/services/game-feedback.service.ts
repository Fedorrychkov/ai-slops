import connectDB from '@lib/db/client'
import Game from '@lib/db/models/Game'
import GameFeedback, { IGameFeedback } from '@lib/db/models/GameFeedback'
import { NotFoundError, ValidationError } from '@lib/error/custom-errors'
import mongoose, { type HydratedDocument } from 'mongoose'

import { GameStatus } from '~/api/game'
import { GAME_FEEDBACK_LIMITS, GameFeedbackStatus } from '~/api/game-feedback'
import type { GameFeedbackModerateDto, GameFeedbackSubmitDto } from '~/api/game-feedback/types'
import { TFunction } from '~/lib/i18n'
import { time } from '~/utils/time'

export class GameFeedbackService {
  private validateSubmitDto(dto: GameFeedbackSubmitDto, t: TFunction): void {
    if (!dto.gameId || !mongoose.Types.ObjectId.isValid(dto.gameId)) {
      throw new ValidationError(t('game.errors.invalidGameId'))
    }

    if (!Number.isInteger(dto.rating) || dto.rating < GAME_FEEDBACK_LIMITS.ratingMin || dto.rating > GAME_FEEDBACK_LIMITS.ratingMax) {
      throw new ValidationError(t('game.feedback.errors.invalidRating', { min: GAME_FEEDBACK_LIMITS.ratingMin, max: GAME_FEEDBACK_LIMITS.ratingMax }))
    }

    const text = dto.text?.trim() ?? ''

    if (text.length < GAME_FEEDBACK_LIMITS.textMinLength || text.length > GAME_FEEDBACK_LIMITS.textMaxLength) {
      throw new ValidationError(t('game.feedback.errors.textLength', { min: GAME_FEEDBACK_LIMITS.textMinLength, max: GAME_FEEDBACK_LIMITS.textMaxLength }))
    }
  }

  /**
   * Create or replace the user's feedback for an approved game.
   * Resubmission resets the status to `pending` — edits go through moderation again.
   */
  async submitFeedback(dto: GameFeedbackSubmitDto, author: { id: string; username?: string | null }, t: TFunction): Promise<HydratedDocument<IGameFeedback>> {
    await connectDB()

    this.validateSubmitDto(dto, t)

    const game = await Game.findOne({ _id: dto.gameId, status: GameStatus.APPROVED }).select('_id')

    if (!game) {
      throw new NotFoundError(t('game.errors.notFound'))
    }

    const feedback = await GameFeedback.findOneAndUpdate(
      { gameId: game._id, userId: new mongoose.Types.ObjectId(author.id) },
      {
        $set: {
          authorUsername: author.username ?? null,
          rating: dto.rating,
          text: dto.text.trim(),
          status: GameFeedbackStatus.PENDING,
          rejectReason: null,
          updatedAt: time().toISOString(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    return feedback
  }

  /** Approve / reject a feedback entry. */
  async moderateFeedback(feedbackId: string, dto: GameFeedbackModerateDto, t: TFunction): Promise<HydratedDocument<IGameFeedback>> {
    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
      throw new ValidationError(t('game.feedback.errors.invalidFeedbackId'))
    }

    if (![GameFeedbackStatus.APPROVED, GameFeedbackStatus.REJECTED].includes(dto.status)) {
      throw new ValidationError(t('game.errors.invalidModerationStatus'))
    }

    const feedback = await GameFeedback.findById(feedbackId)

    if (!feedback) {
      throw new NotFoundError(t('game.feedback.errors.notFound'))
    }

    feedback.status = dto.status
    feedback.rejectReason = dto.status === GameFeedbackStatus.REJECTED ? dto.rejectReason?.trim() || null : null

    await feedback.save()

    return feedback
  }
}

export const gameFeedbackService = new GameFeedbackService()
