import { getServerT } from '~/lib/i18n/server'

const FEATURE_IDS = ['pedigree', 'sandbox', 'curated', 'daily'] as const

const FEATURE_EMOJI: Record<(typeof FEATURE_IDS)[number], string> = {
  pedigree: '🧬',
  sandbox: '🔒',
  curated: '🧑‍⚖️',
  daily: '📅',
}

/** Why-us grid: pedigree, sandboxed play, human curation, daily exhibit. */
export const WhySlop = async () => {
  const { t } = await getServerT()

  return (
    <section className="border-b border-border/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('platform.why.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('platform.why.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_IDS.map((id) => (
            <div key={id} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
              <span className="text-2xl">{FEATURE_EMOJI[id]}</span>
              <h3 className="mt-3 font-semibold text-foreground">{t(`platform.why.items.${id}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`platform.why.items.${id}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
