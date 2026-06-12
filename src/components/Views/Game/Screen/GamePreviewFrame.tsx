'use client'

import { Maximize2Icon, Minimize2Icon } from 'lucide-react'
import { useRef } from 'react'

import { useFullscreen } from '~/hooks/useFullscreen'
import { useT } from '~/providers'
import { cn } from '~/utils/cn'

type Props = {
  html: string
  title: string
}

/**
 * Moderation preview: srcDoc + sandbox (no `allow-same-origin`) → opaque origin,
 * same isolation as the public player. Fullscreen expands the wrapper, not the iframe.
 */
export const GamePreviewFrame = ({ html, title }: Props) => {
  const t = useT()
  const frameRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, toggleFullscreen } = useFullscreen(frameRef)

  return (
    <div
      ref={frameRef}
      className={cn('flex flex-col overflow-hidden rounded-xl border border-border bg-muted', isFullscreen && 'h-full w-full rounded-none border-0')}
    >
      <div className="flex items-center justify-end border-b border-border bg-card px-2 py-1.5">
        <button
          onClick={toggleFullscreen}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          aria-label={isFullscreen ? t('game.ui.exitFullscreen') : t('game.ui.fullscreen')}
        >
          {isFullscreen ? <Minimize2Icon className="h-3.5 w-3.5" /> : <Maximize2Icon className="h-3.5 w-3.5" />}
          {isFullscreen ? t('game.ui.exitFullscreen') : t('game.ui.fullscreen')}
        </button>
      </div>
      <div className={cn('w-full', isFullscreen ? 'min-h-0 flex-1' : 'aspect-[16/10]')}>
        <iframe srcDoc={html} sandbox="allow-scripts allow-pointer-lock" title={title} className="h-full w-full border-0" />
      </div>
    </div>
  )
}
