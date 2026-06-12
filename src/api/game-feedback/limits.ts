/** Shared feedback form limits (pure constants — safe for client bundles). */
export const GAME_FEEDBACK_LIMITS = {
  textMinLength: 10,
  textMaxLength: 1000,
  ratingMin: 1,
  ratingMax: 5,
} as const
