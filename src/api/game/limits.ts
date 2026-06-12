/** Shared submit-form limits (pure constants — safe for client bundles). */
export const GAME_LIMITS = {
  titleMinLength: 3,
  titleMaxLength: 80,
  descriptionMaxLength: 200,
  aboutMaxLength: 5000,
  reviewNotesMaxLength: 2000,
  /** Single-file HTML payload cap (bytes of UTF-8 source). */
  htmlContentMaxBytes: 512 * 1024,
  promptTextMaxLength: 5000,
  coverEmojiMaxLength: 8,
  slugMaxLength: 60,
} as const
