'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LandingAuthLink } from '~/components/Layouts/LandingAuthLink'
import { Logo } from '~/components/ui/Logo'
import { routes } from '~/constants'
import { useT } from '~/providers'
import { cn } from '~/utils/cn'
import { matchesPathname } from '~/utils/matchPath'

export const LandingHeader = () => {
  const t = useT()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: routes.gamesPublic.path, label: t('navigation.gamesPublic') },
    { href: routes.articlesPublic.path, label: t('platform.layout.navArticles') },
    { href: routes.gamesSubmit.path, label: t('navigation.gamesSubmit') },
    { href: routes.gamesMy.path, label: t('navigation.gamesMy') },
  ]

  useEffect(() => {
    queueMicrotask(() => {
      setOpen(false)
    })
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 group">
          <Logo size={28} showText />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LandingAuthLink />
          <Link
            href={routes.gamesSubmit.path}
            className="hidden sm:flex h-8 items-center rounded-full bg-foreground px-4 text-sm font-semibold text-background hover:opacity-80 transition-opacity"
          >
            {t('platform.layout.ctaSubmit')}
          </Link>

          <button
            type="button"
            className="flex md:hidden size-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            aria-label={open ? t('common.close') : t('navigation.menu')}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label={t('common.close')}
              className="fixed inset-0 z-[60] bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
            />
            <motion.nav
              id="landing-mobile-nav"
              className="fixed inset-x-0 top-14 z-[70] border-b border-border bg-background shadow-lg md:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ul className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className={cn(
                        'flex h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                        matchesPathname(item.href, pathname) && 'bg-muted text-foreground',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li className="mt-2 flex flex-col gap-2 border-t border-border pt-3 sm:hidden">
                  <LandingAuthLink variant="mobileMenu" onNavigate={close} />
                  <Link
                    href={routes.gamesSubmit.path}
                    onClick={close}
                    className="flex h-10 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background hover:opacity-80 transition-opacity"
                  >
                    {t('platform.layout.ctaSubmit')}
                  </Link>
                </li>
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
