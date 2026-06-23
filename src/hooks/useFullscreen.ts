'use client'

import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { Logger } from '~/utils/logger'

const logger = new Logger(['useFullscreen', '[src/hooks/useFullscreen.ts]'])

const PSEUDO_FS_CLASS = 'game-pseudo-fullscreen'
const BODY_LOCK_CLASS = 'game-pseudo-fullscreen-body-lock'

type FullscreenMode = 'native' | 'pseudo' | null

let bodyLockCount = 0
let bodyScrollY = 0

function isIosLike(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const ua = navigator.userAgent

  return /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function elementSupportsNativeFullscreen(el: HTMLElement | null): boolean {
  if (!el) {
    return false
  }

  return Boolean(
    el.requestFullscreen ||
    (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen ||
    (el as HTMLElement & { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen ||
    (el as HTMLElement & { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen,
  )
}

function getNativeFullscreenElement(): Element | null {
  return document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement || null
}

function lockBodyScroll(): void {
  if (bodyLockCount === 0) {
    bodyScrollY = window.scrollY
    document.body.classList.add(BODY_LOCK_CLASS)
    document.body.style.top = `-${bodyScrollY}px`
  }

  bodyLockCount += 1
}

function unlockBodyScroll(): void {
  bodyLockCount = Math.max(0, bodyLockCount - 1)

  if (bodyLockCount === 0) {
    document.body.classList.remove(BODY_LOCK_CLASS)
    document.body.style.top = ''
    window.scrollTo(0, bodyScrollY)
  }
}

function enterPseudoFullscreen(target: HTMLElement): void {
  target.classList.add(PSEUDO_FS_CLASS)
  lockBodyScroll()
}

function exitPseudoFullscreen(target: HTMLElement | null): void {
  if (!target) {
    return
  }

  target.classList.remove(PSEUDO_FS_CLASS)
  unlockBodyScroll()
}

async function requestNativeFullscreen(target: HTMLElement): Promise<boolean> {
  const request =
    target.requestFullscreen?.bind(target) ||
    (target as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.bind(target) ||
    (target as HTMLElement & { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen?.bind(target) ||
    (target as HTMLElement & { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen?.bind(target)

  if (!request) {
    return false
  }

  try {
    await request()

    return getNativeFullscreenElement() === target
  } catch (error) {
    logger.info('Native fullscreen request failed, will use pseudo fallback', error)

    return false
  }
}

async function exitNativeFullscreen(): Promise<void> {
  const exit =
    document.exitFullscreen?.bind(document) ||
    (document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen?.bind(document) ||
    (document as Document & { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen?.bind(document) ||
    (document as Document & { msExitFullscreen?: () => Promise<void> }).msExitFullscreen?.bind(document)

  if (!exit) {
    return
  }

  try {
    await exit()
  } catch (error) {
    logger.error(error)
  }
}

function shouldPreferPseudoFullscreen(target: HTMLElement | null): boolean {
  if (isIosLike()) {
    return true
  }

  return !elementSupportsNativeFullscreen(target)
}

/**
 * Fullscreen on a container (not the iframe — sandboxed games cannot request fullscreen).
 * Falls back to fixed viewport overlay + body scroll lock when the Fullscreen API is unavailable (iOS Safari, etc.).
 */
export const useFullscreen = <T extends HTMLElement>(targetRef: RefObject<T | null>) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const modeRef = useRef<FullscreenMode>(null)
  const pseudoTargetRef = useRef<T | null>(null)

  const syncNativeState = useCallback(() => {
    if (modeRef.current !== 'native') {
      return
    }

    const active = getNativeFullscreenElement() === targetRef.current
    setIsFullscreen(active)

    if (!active) {
      modeRef.current = null
    }
  }, [targetRef])

  const exitFullscreen = useCallback(async () => {
    if (modeRef.current === 'pseudo') {
      exitPseudoFullscreen(pseudoTargetRef.current)
      pseudoTargetRef.current = null
      modeRef.current = null
      setIsFullscreen(false)

      return
    }

    if (modeRef.current === 'native' || getNativeFullscreenElement()) {
      await exitNativeFullscreen()
      modeRef.current = null
      setIsFullscreen(false)
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    const target = targetRef.current

    if (!target || isFullscreen) {
      return
    }

    if (shouldPreferPseudoFullscreen(target)) {
      enterPseudoFullscreen(target)
      pseudoTargetRef.current = target
      modeRef.current = 'pseudo'
      setIsFullscreen(true)

      return
    }

    const nativeOk = await requestNativeFullscreen(target)

    if (nativeOk) {
      modeRef.current = 'native'
      setIsFullscreen(true)

      return
    }

    enterPseudoFullscreen(target)
    pseudoTargetRef.current = target
    modeRef.current = 'pseudo'
    setIsFullscreen(true)
  }, [isFullscreen, targetRef])

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen])

  useEffect(() => {
    const handleNativeChange = () => syncNativeState()

    document.addEventListener('fullscreenchange', handleNativeChange)
    document.addEventListener('webkitfullscreenchange', handleNativeChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleNativeChange)
      document.removeEventListener('webkitfullscreenchange', handleNativeChange)
    }
  }, [syncNativeState])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || modeRef.current !== 'pseudo') {
        return
      }

      event.preventDefault()
      void exitFullscreen()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [exitFullscreen])

  useEffect(() => {
    return () => {
      if (modeRef.current === 'pseudo') {
        exitPseudoFullscreen(pseudoTargetRef.current)
        pseudoTargetRef.current = null
        modeRef.current = null
      }
    }
  }, [])

  // eslint-disable-next-line react-hooks/refs
  return { isFullscreen, isPseudoFullscreen: modeRef?.current === 'pseudo' ? true : false, toggleFullscreen, enterFullscreen, exitFullscreen }
}
