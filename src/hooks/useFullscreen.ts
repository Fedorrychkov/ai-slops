'use client'

import { RefObject, useCallback, useEffect, useState } from 'react'

import { Logger } from '~/utils/logger'

const logger = new Logger(['useFullscreen', '[src/hooks/useFullscreen.ts]'])

/**
 * Native Fullscreen API on a container element (not the iframe itself —
 * sandboxed game iframes cannot request fullscreen, so we expand their wrapper).
 */
export const useFullscreen = <T extends HTMLElement>(targetRef: RefObject<T | null>) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement) && document.fullscreenElement === targetRef.current)
    }

    document.addEventListener('fullscreenchange', handleChange)

    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [targetRef])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()

        return
      }

      await targetRef.current?.requestFullscreen()
    } catch (error) {
      // Fullscreen can be denied by the browser (permissions, iframe policy) — not fatal.
      logger.error(error)
    }
  }, [targetRef])

  return { isFullscreen, toggleFullscreen }
}
