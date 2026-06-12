'use client'

import { CheckIcon, Code2Icon, CopyIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { GameModel } from '~/api/game'
import { useT } from '~/providers'
import { cn } from '~/utils/cn'
import { Logger } from '~/utils/logger'

const logger = new Logger(['GameEmbedBuilder', '[src/components/Views/Game/Public/GameEmbedBuilder.tsx]'])

type Props = {
  game: GameModel
}

type EmbedOptions = {
  showTitle: boolean
  showPedigree: boolean
  showStats: boolean
  theme: 'auto' | 'light' | 'dark'
}

const DEFAULT_OPTIONS: EmbedOptions = {
  showTitle: true,
  showPedigree: true,
  showStats: true,
  theme: 'auto',
}

function buildEmbedUrl(origin: string, slug: string, options: EmbedOptions): string {
  const params = new URLSearchParams()

  if (!options.showTitle) params.set('title', '0')

  if (!options.showPedigree) params.set('pedigree', '0')

  if (!options.showStats) params.set('stats', '0')

  if (options.theme !== 'auto') params.set('theme', options.theme)

  const qs = params.toString()

  return `${origin}/embed/game/${slug}${qs ? `?${qs}` : ''}`
}

/** Embed snippet constructor — visible to everyone when the author allowed embedding. */
export function GameEmbedBuilder({ game }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [options, setOptions] = useState<EmbedOptions>(DEFAULT_OPTIONS)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const snippet = useMemo(() => {
    const url = buildEmbedUrl(origin, game.slug ?? '', options)

    return `<iframe\n  src="${url}"\n  width="100%"\n  height="640"\n  style="border: 0; border-radius: 12px; overflow: hidden;"\n  loading="lazy"\n  allowfullscreen\n  title="${game.title ?? 'aigames.art game'}"\n></iframe>`
  }, [origin, game.slug, game.title, options])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logger.error(error)
    }
  }

  const toggle = (key: keyof Pick<EmbedOptions, 'showTitle' | 'showPedigree' | 'showStats'>) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const checkboxes: { key: 'showTitle' | 'showPedigree' | 'showStats'; label: string }[] = [
    { key: 'showTitle', label: t('game.ui.embedShowTitle') },
    { key: 'showPedigree', label: t('game.ui.embedShowPedigree') },
    { key: 'showStats', label: t('game.ui.embedShowStats') },
  ]

  const themes: { value: EmbedOptions['theme']; label: string }[] = [
    { value: 'auto', label: t('game.ui.embedThemeAuto') },
    { value: 'light', label: t('game.ui.embedThemeLight') },
    { value: 'dark', label: t('game.ui.embedThemeDark') },
  ]

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 text-left" aria-expanded={open}>
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Code2Icon className="h-4 w-4" />
          {t('game.ui.embedTitle')}
        </span>
        <span className={cn('text-muted-foreground transition-transform duration-200', open && 'rotate-45')} aria-hidden>
          +
        </span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-xs leading-relaxed text-muted-foreground">{t('game.ui.embedDescription')}</p>

          <div className="flex flex-col gap-2">
            {checkboxes.map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={options[key]} onChange={() => toggle(key)} className="h-4 w-4 accent-primary" />
                {label}
              </label>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t('game.ui.embedTheme')}:</span>
            {themes.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setOptions((prev) => ({ ...prev, theme: value }))}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  options.theme === value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <pre className="overflow-x-auto whitespace-pre rounded-xl bg-muted p-3 font-mono text-xs text-muted-foreground">{snippet}</pre>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? t('game.ui.embedCopied') : t('game.ui.embedCopy')}
            </button>
            <span className="text-xs text-muted-foreground">{t('game.ui.embedInstruction')}</span>
          </div>
        </div>
      )}
    </section>
  )
}
