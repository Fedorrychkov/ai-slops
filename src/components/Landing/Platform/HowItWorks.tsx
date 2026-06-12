import Link from 'next/link'

import { routes } from '~/constants'
import { getServerT } from '~/lib/i18n/server'

const STEP_IDS = ['prompt', 'submit', 'fame'] as const

const STEP_EMOJI: Record<(typeof STEP_IDS)[number], string> = {
  prompt: '🤖',
  submit: '📤',
  fame: '🏆',
}

/** Three-step pitch: prompt an AI → submit the file → get played and reviewed. */
export const HowItWorks = async () => {
  const { t } = await getServerT()

  return (
    <section className="border-b border-border/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('platform.how.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('platform.how.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEP_IDS.map((id, index) => (
            <div key={id} className="relative rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-xl">{STEP_EMOJI[id]}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {t('platform.how.stepLabel')} {index + 1}
                </span>
              </div>
              <h3 className="font-semibold text-foreground">{t(`platform.how.steps.${id}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`platform.how.steps.${id}.description`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={routes.gamesSubmit.path}
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-80"
          >
            {t('platform.hero.ctaSubmit')}
          </Link>
        </div>
      </div>
    </section>
  )
}
