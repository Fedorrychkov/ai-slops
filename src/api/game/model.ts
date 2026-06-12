export type GameModel = {
  id: string
  slug?: string | null
  title?: string | null
  /** Short tagline shown on catalog cards (plain text). */
  description?: string | null
  /** Public long description shown on the game page (plain text, paragraphs). */
  about?: string | null
  /** Author's notes for moderators (how to play, what to check) — never exposed publicly. */
  reviewNotes?: string | null
  status?: GameStatus | null
  /** Moderator-facing and author-facing reason shown when status is `rejected`. */
  rejectReason?: string | null
  /** Submitting user id. */
  authorId?: string | null
  /** Denormalized public handle at submit time (avoids join on every catalog read). */
  authorUsername?: string | null
  /** AI tool the game was built with — the "pedigree" headline. */
  tool?: GameTool | null
  /** Free-form tool name when `tool` is `other`. */
  toolOther?: string | null
  /** Approximate number of prompts spent (author-reported, part of the pedigree). */
  promptCount?: number | null
  /** Optional original prompt text shown on the game page. */
  promptText?: string | null
  genre?: GameGenre | null
  /** Single-file HTML payload served into the sandboxed iframe. Excluded from list responses. */
  htmlContent?: string | null
  /** Emoji used as a lightweight cover until a screenshot asset is set. */
  coverEmoji?: string | null
  /** MediaAsset id for the cover screenshot (optional). */
  coverImageAssetId?: string | null
  /** AI editorial review (plain text/markdown), generated after approval. */
  aiReviewText?: string | null
  /** Author's permission to embed the game on third-party sites via /embed/game/:slug. */
  allowEmbed?: boolean | null
  /** Latest AI security audit of `htmlContent` (staff-only, stripped from public payloads). */
  securityAudit?: GameSecurityAudit | null
  securityAuditAt?: string | null
  playCountTotal?: number | null
  upvoteCountTotal?: number | null
  approvedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

/** Structured result of the LLM security audit run over the game HTML. */
export type GameSecurityAudit = {
  riskLevel: 'low' | 'medium' | 'high'
  /** 1-3 sentences: overall verdict for the moderator. */
  summary: string
  /** Browser APIs the code touches (canvas, audio, fetch, WebSocket, clipboard, …). */
  browserApis: string[]
  /** Detected outgoing network calls / external resources. */
  networkRequests: string[]
  /** Cookie / localStorage / IndexedDB usage attempts (unavailable in the sandbox, but signal intent). */
  storageUsage: string[]
  /** Obfuscation, eval, dynamic code loading, fingerprinting, crypto-mining hints. */
  suspiciousPatterns: string[]
  /** Reassuring observations (self-contained, plain canvas game, …). */
  safeFindings: string[]
  /** What the human moderator should verify manually. */
  recommendations: string[]
  /** True when the HTML was truncated to fit the model context. */
  htmlTruncated?: boolean
}

/** Response from `POST /api/v1/game/audit/:id`. */
export type GameAuditResponse = {
  securityAudit: GameSecurityAudit
  securityAuditAt: string
}

export enum GameStatus {
  /** Waiting in the moderation queue. */
  PENDING = 'pending',
  /** Visible in the public catalog. */
  APPROVED = 'approved',
  /** Declined with `rejectReason`. */
  REJECTED = 'rejected',
}

export enum GameTool {
  CLAUDE = 'claude',
  GPT = 'gpt',
  V0 = 'v0',
  CURSOR = 'cursor',
  OTHER = 'other',
}

export enum GameGenre {
  ARCADE = 'arcade',
  PUZZLE = 'puzzle',
  CLICKER = 'clicker',
  SIMULATOR = 'simulator',
  STRATEGY = 'strategy',
  OTHER = 'other',
}

/** Response from `POST /api/v1/game/vote/:id`. */
export type GameVoteResponse = {
  voted: boolean
  upvoteCountTotal: number
}

/** Response from `POST /api/v1/public/game/play/:id`. */
export type GamePlayResponse = {
  playCountTotal: number
}
