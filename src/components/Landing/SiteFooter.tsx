import Link from 'next/link'

import { Logo } from '~/components/ui/Logo'
import { routes } from '~/constants'
import { getServerT } from '~/lib/i18n/server'

/** Site-wide public footer — platform links only, no author/repo funnel. */
export const SiteFooter = async () => {
  const { t } = await getServerT()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Logo size={24} showText />
            <p className="text-xs text-muted-foreground">{t('platform.footer.tagline')}</p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href={routes.gamesPublic.path} className="hover:text-foreground transition-colors">
              {t('navigation.gamesPublic')}
            </Link>
            <Link href={routes.gamesSubmit.path} className="hover:text-foreground transition-colors">
              {t('navigation.gamesSubmit')}
            </Link>
            <Link href={routes.articlesPublic.path} className="hover:text-foreground transition-colors">
              {t('platform.layout.navArticles')}
            </Link>
            <a href="/rss.xml" className="hover:text-foreground transition-colors">
              RSS
            </a>
            <Link href={routes.privacyPolicy.path} className="hover:text-foreground transition-colors">
              {t('navigation.privacyPolicy')}
            </Link>
            <Link href={routes.termsOfService.path} className="hover:text-foreground transition-colors">
              {t('navigation.termsOfService')}
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            © {year} · {t('platform.footer.copyright')}
          </p>
          <p>{t('platform.footer.bottomLine')}</p>
        </div>
      </div>
    </footer>
  )
}
