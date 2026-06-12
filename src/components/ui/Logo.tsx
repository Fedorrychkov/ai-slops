import { cn } from '~/utils/cn'

type Props = {
  className?: string
  size?: number
  showText?: boolean
  textClassName?: string
}

/**
 * aigames.art logo — a gradient tile with a pixel-invader glyph and a slop drip.
 * Works in both light and dark themes.
 */
export const Logo = ({ className, size = 32, showText = true, textClassName }: Props) => {
  return (
    <span className={cn('flex items-center gap-2 select-none', className)}>
      {/* Icon mark */}
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="slop-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        {/* Rounded tile — the slop container */}
        <rect width="32" height="32" rx="9" fill="url(#slop-gradient)" />
        {/* Pixel invader-ish glyph */}
        <rect x="9" y="8" width="3" height="3" fill="white" />
        <rect x="20" y="8" width="3" height="3" fill="white" />
        <rect x="12" y="11" width="3" height="3" fill="white" opacity="0.9" />
        <rect x="17" y="11" width="3" height="3" fill="white" opacity="0.9" />
        <rect x="9" y="14" width="14" height="3" fill="white" />
        <rect x="9" y="17" width="3" height="3" fill="white" opacity="0.9" />
        <rect x="14" y="17" width="4" height="3" fill="white" />
        <rect x="20" y="17" width="3" height="3" fill="white" opacity="0.9" />
        {/* The drip */}
        <rect x="14" y="20" width="4" height="5" rx="2" fill="white" opacity="0.7" />
      </svg>

      {showText && (
        <span className={cn('font-bold tracking-tight text-foreground leading-none', textClassName)}>
          <span className="text-foreground">aigames</span>
          <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">.art</span>
        </span>
      )}
    </span>
  )
}
