'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { UserRole } from '~/api/user'
import { routes } from '~/constants'
import { useAuth, useT } from '~/providers'
import { cn } from '~/utils/cn'

type Props = {
  className?: string
  onNavigate?: () => void
  variant?: 'header' | 'mobileMenu'
}

const linkClass = {
  header: 'hidden sm:flex h-8 items-center rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
  mobileMenu:
    'flex h-10 w-full items-center justify-center rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
}

const skeletonClass = {
  header: 'hidden sm:flex h-8 w-[5.5rem] rounded-full bg-muted animate-pulse',
  mobileMenu: 'flex h-10 w-full rounded-full bg-muted animate-pulse',
}

export const LandingAuthLink = ({ className, onNavigate, variant = 'header' }: Props) => {
  const t = useT()
  const pathname = usePathname()
  const { authUser, isLoading, isClient } = useAuth()

  const loginHref = `/login?nextPath=${encodeURIComponent(pathname || '/')}`

  if (!isClient || isLoading) {
    return <span className={cn(skeletonClass[variant], className)} aria-hidden />
  }

  if (authUser) {
    const isStaff = authUser.role === UserRole.ADMIN || authUser.role === UserRole.EDITOR
    const href = isStaff ? routes.adminGames.path : routes.profile.path
    const label = isStaff ? t('platform.layout.dashboard') : t('navigation.profile')

    return (
      <Link href={href} onClick={onNavigate} className={cn(linkClass[variant], className)}>
        {label}
      </Link>
    )
  }

  return (
    <Link href={loginHref} onClick={onNavigate} className={cn(linkClass[variant], className)}>
      {t('platform.layout.signIn')}
    </Link>
  )
}
