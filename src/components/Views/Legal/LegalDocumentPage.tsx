import { Typography } from '~/components/ui/Typography/Typography'
import { AppMessageKey } from '~/lib/i18n'
import { getServerT } from '~/lib/i18n/server'
import { seoConfig } from '~/lib/seo/config'

type Props = {
  docKey: 'privacy' | 'terms'
  sectionIds: readonly string[]
}

export const LegalDocumentPage = async ({ docKey, sectionIds }: Props) => {
  const { t } = await getServerT()
  const base = `legal.${docKey}` as AppMessageKey

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header>
        <Typography variant="Body/L/Semibold" asTag="h1">
          {t(`${base}.title` as AppMessageKey)}
        </Typography>
        <Typography variant="Body/M/Regular" asTag="p" className="mt-2 text-muted-foreground">
          {t(`${base}.intro` as AppMessageKey)}
        </Typography>
        <p className="mt-3 text-xs text-muted-foreground">
          {t('legal.updatedLabel')}: {t(`${base}.updated` as AppMessageKey)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('legal.siteLabel')}: {seoConfig.siteName}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {sectionIds.map((id) => {
          const body = t(`${base}.sections.${id}.body` as AppMessageKey)

          return (
            <section key={id} className="rounded-2xl border border-border bg-card p-6">
              <Typography variant="Body/M/Semibold" asTag="h2" className="mb-3">
                {t(`${base}.sections.${id}.title` as AppMessageKey)}
              </Typography>
              <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
                {body.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </article>
  )
}
