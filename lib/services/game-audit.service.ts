import connectDB from '@lib/db/client'
import Game from '@lib/db/models/Game'
import { NotFoundError, ValidationError } from '@lib/error/custom-errors'
import { getChatModelAllowlist, resolveChatModel } from '@lib/services/llm/chat-models'
import { type ChatMessage, llmService } from '@lib/services/llm/llm.service'
import { recordLlmUsageEvent } from '@lib/services/llm/llm-usage-persistence'
import mongoose from 'mongoose'

import type { GameSecurityAudit } from '~/api/game'
import { TFunction } from '~/lib/i18n'
import { time } from '~/utils/time'

/** Keep the HTML within a safe context budget (≈37K tokens); the cap is generous for slop-sized games. */
const HTML_CONTEXT_MAX_CHARS = 150_000

const AUDIT_MAX_TOKENS = 1500

/** Keep in sync with `GameSecurityAudit` in `~/api/game/model`. */
const GAME_AUDIT_JSON_INSTRUCTION = `Return one JSON object with exactly this shape (all string arrays may be empty):
{
  "riskLevel": <"low" | "medium" | "high">,
  "summary": <string, 1-3 sentences: overall verdict for the moderator>,
  "browserApis": [<string: browser API the code uses and what for, e.g. "Canvas 2D — game rendering">, ...],
  "networkRequests": [<string: any outgoing request / external resource with URL if visible>, ...],
  "storageUsage": [<string: cookies / localStorage / sessionStorage / IndexedDB usage>, ...],
  "suspiciousPatterns": [<string: eval / Function constructor / obfuscated blobs / dynamic script injection / fingerprinting / mining / keylogging>, ...],
  "safeFindings": [<string: reassuring observation>, ...],
  "recommendations": [<string: what the human moderator should verify manually>, ...]
}`

const AUDIT_SYSTEM_PROMPT = [
  'You are a security reviewer for "aigames.art" — a platform that hosts user-submitted single-file HTML games.',
  'Games run in a sandboxed iframe (sandbox="allow-scripts", opaque origin): no cookies, no localStorage, no same-origin access, no top navigation.',
  'Audit the submitted HTML source. Identify every browser API in use, every outgoing network request or external resource, any storage access attempts,',
  'and any suspicious patterns (eval, obfuscation, dynamic code loading, fingerprinting, crypto mining, fake UI / phishing screens, hidden iframes).',
  'Judge risk in the context of the sandbox: storage calls merely fail there, but signal intent; network calls and phishing UI remain real risks.',
  'Be precise and cite concrete identifiers/snippets in your findings. Do not invent findings that are not in the code.',
  GAME_AUDIT_JSON_INSTRUCTION,
].join('\n')

function parseAuditJson(raw: string): Omit<GameSecurityAudit, 'htmlTruncated'> | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>

    const riskLevel = parsed.riskLevel === 'low' || parsed.riskLevel === 'medium' || parsed.riskLevel === 'high' ? parsed.riskLevel : 'medium'
    const toStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((item): item is string => typeof item === 'string') : [])

    return {
      riskLevel,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      browserApis: toStringArray(parsed.browserApis),
      networkRequests: toStringArray(parsed.networkRequests),
      storageUsage: toStringArray(parsed.storageUsage),
      suspiciousPatterns: toStringArray(parsed.suspiciousPatterns),
      safeFindings: toStringArray(parsed.safeFindings),
      recommendations: toStringArray(parsed.recommendations),
    }
  } catch {
    return null
  }
}

export class GameAuditService {
  /** Run the AI security audit over the game HTML and persist the structured result on the game. */
  async auditGame(gameId: string, moderatorUserId: string, t: TFunction): Promise<{ securityAudit: GameSecurityAudit; securityAuditAt: string }> {
    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw new ValidationError(t('game.errors.invalidGameId'))
    }

    const game = await Game.findById(gameId).select('htmlContent title tool promptCount')

    if (!game) {
      throw new NotFoundError(t('game.errors.notFound'))
    }

    if (!game.htmlContent?.trim()) {
      throw new ValidationError(t('game.errors.htmlContentRequired'))
    }

    const htmlTruncated = game.htmlContent.length > HTML_CONTEXT_MAX_CHARS
    const html = htmlTruncated ? game.htmlContent.slice(0, HTML_CONTEXT_MAX_CHARS) : game.htmlContent

    const messages: ChatMessage[] = [
      { role: 'system', content: AUDIT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          `Game: "${game.title}" (declared tool: ${game.tool ?? 'unknown'}, ~${game.promptCount ?? '?'} prompts).`,
          htmlTruncated ? `NOTE: the HTML below is truncated to the first ${HTML_CONTEXT_MAX_CHARS} characters.` : null,
          'HTML source:',
          '```html',
          html,
          '```',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ]

    const model = resolveChatModel(undefined, getChatModelAllowlist())
    const response = await llmService.chat(messages, {
      model,
      temperature: 0.2,
      maxTokens: AUDIT_MAX_TOKENS,
      responseFormatJson: true,
    })

    const parsed = parseAuditJson(response.content ?? '')

    if (!parsed) {
      throw new ValidationError(t('game.audit.errors.generationFailed'))
    }

    const securityAudit: GameSecurityAudit = { ...parsed, htmlTruncated }
    const securityAuditAt = time().toISOString()

    await Game.updateOne({ _id: game._id }, { $set: { securityAudit, securityAuditAt } })

    if (response.usage) {
      await recordLlmUsageEvent({
        source: 'game_audit',
        userId: moderatorUserId,
        llmModel: model,
        usage: response.usage,
      })
    }

    return { securityAudit, securityAuditAt }
  }
}

export const gameAuditService = new GameAuditService()
