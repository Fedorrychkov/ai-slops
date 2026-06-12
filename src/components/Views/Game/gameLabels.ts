import type { TFunction } from '~/lib/i18n'

/** Tool key → i18n label; falls back to the raw value for forward-compat. */
export function gameToolLabel(t: TFunction, tool?: string | null, toolOther?: string | null): string {
  if (!tool) {
    return t('game.ui.tools.other')
  }

  if (tool === 'other' && toolOther) {
    return toolOther
  }

  switch (tool) {
    case 'claude':
      return t('game.ui.tools.claude')
    case 'gpt':
      return t('game.ui.tools.gpt')
    case 'v0':
      return t('game.ui.tools.v0')
    case 'cursor':
      return t('game.ui.tools.cursor')
    default:
      return t('game.ui.tools.other')
  }
}

export function gameGenreLabel(t: TFunction, genre?: string | null): string {
  switch (genre) {
    case 'arcade':
      return t('game.ui.genres.arcade')
    case 'puzzle':
      return t('game.ui.genres.puzzle')
    case 'clicker':
      return t('game.ui.genres.clicker')
    case 'simulator':
      return t('game.ui.genres.simulator')
    case 'strategy':
      return t('game.ui.genres.strategy')
    default:
      return t('game.ui.genres.other')
  }
}
