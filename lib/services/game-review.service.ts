import connectDB from '@lib/db/client'
import Game, { IGame } from '@lib/db/models/Game'
import { NotFoundError, ValidationError } from '@lib/error/custom-errors'
import { getChatModelAllowlist, resolveChatModel } from '@lib/services/llm/chat-models'
import { type ChatMessage, llmService } from '@lib/services/llm/llm.service'
import { recordLlmUsageEvent } from '@lib/services/llm/llm-usage-persistence'
import mongoose, { type HydratedDocument } from 'mongoose'

import { GameStatus } from '~/api/game'
import { TFunction } from '~/lib/i18n'
import { Logger } from '~/utils/logger'

const logger = new Logger(['GameReviewService', '[lib/services/game-review.service.ts]'])

const REVIEW_MAX_TOKENS = 600

const REVIEW_SYSTEM_PROMPT = [
  'You are the resident AI critic of "aigames.art" — a curated museum of browser games made entirely by AI tools.',
  'Write a short, self-ironic editorial review of a submitted game (2-3 paragraphs, plain text, no markdown, no headings).',
  'Tone: affectionate mockery — the word "slop" is a medal here, not an insult. Praise the absurdity, tease the jank, respect the prompt count.',
  'Mention the AI tool that made the game when it adds flavor. Never invent gameplay details you were not given — riff on what is provided.',
  'End with a tongue-in-cheek verdict line including a rating out of 10.',
  'Write in English. Keep it under 160 words.',
].join(' ')

function buildGameReviewMessages(game: HydratedDocument<IGame>): ChatMessage[] {
  const facts = [
    `Title: ${game.title}`,
    game.description ? `Author's description: ${game.description}` : null,
    `Made with: ${game.tool}${game.toolOther ? ` (${game.toolOther})` : ''}`,
    game.promptCount != null ? `Prompts spent: ~${game.promptCount}` : null,
    game.genre ? `Genre: ${game.genre}` : null,
    game.promptText ? `The original prompt the author used:\n"""${game.promptText}"""` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    { role: 'system', content: REVIEW_SYSTEM_PROMPT },
    { role: 'user', content: `Review this exhibit:\n${facts}` },
  ]
}

export class GameReviewService {
  /**
   * Generate (or regenerate) the AI editorial review for an approved game and persist it.
   * Throws on LLM failure — callers decide whether the failure is fatal (manual button) or
   * best-effort (auto-run on approve).
   */
  async generateReview(gameId: string, moderatorUserId: string, t: TFunction): Promise<{ aiReviewText: string }> {
    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw new ValidationError(t('game.errors.invalidGameId'))
    }

    const game = await Game.findById(gameId).select('-htmlContent')

    if (!game) {
      throw new NotFoundError(t('game.errors.notFound'))
    }

    if (game.status !== GameStatus.APPROVED) {
      throw new ValidationError(t('game.errors.reviewOnlyForApproved'))
    }

    const model = resolveChatModel(undefined, getChatModelAllowlist())
    const response = await llmService.chat(buildGameReviewMessages(game), {
      model,
      temperature: 0.9,
      maxTokens: REVIEW_MAX_TOKENS,
    })

    const aiReviewText = response.content?.trim()

    if (!aiReviewText) {
      throw new ValidationError(t('game.errors.reviewGenerationFailed'))
    }

    game.aiReviewText = aiReviewText
    await game.save()

    if (response.usage) {
      await recordLlmUsageEvent({
        source: 'game_review',
        userId: moderatorUserId,
        llmModel: model,
        usage: response.usage,
      })
    }

    return { aiReviewText }
  }

  /** Best-effort variant for the approve flow — never throws, approval must not depend on the LLM. */
  async tryGenerateReview(gameId: string, moderatorUserId: string, t: TFunction): Promise<void> {
    try {
      await this.generateReview(gameId, moderatorUserId, t)
    } catch (error) {
      logger.error('tryGenerateReview', error)
    }
  }
}

export const gameReviewService = new GameReviewService()
