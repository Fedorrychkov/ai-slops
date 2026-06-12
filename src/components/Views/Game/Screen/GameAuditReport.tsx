'use client'

import type { GameSecurityAudit } from '~/api/game'
import { Typography } from '~/components/ui'
import { useT } from '~/providers'
import { cn } from '~/utils/cn'
import { time } from '~/utils/time'

type Props = {
  audit: GameSecurityAudit
  auditedAt?: string | null
}

const RISK_STYLES: Record<GameSecurityAudit['riskLevel'], string> = {
  low: 'bg-status-up-subtle text-status-up border-status-up/40',
  medium: 'bg-status-slow-subtle text-status-slow border-status-slow/40',
  high: 'bg-status-down-subtle text-status-down border-status-down/40',
}

const FindingList = ({ title, items, tone }: { title: string; items: string[]; tone?: 'bad' | 'good' }) => {
  if (!items.length) return null

  return (
    <div>
      <span className={cn('text-xs font-semibold', tone === 'bad' ? 'text-status-down' : tone === 'good' ? 'text-status-up' : 'text-muted-foreground')}>
        {title}
      </span>
      <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5 text-xs text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

/** Structured AI security audit rendering for the moderation card. */
export const GameAuditReport = ({ audit, auditedAt }: Props) => {
  const t = useT()

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide', RISK_STYLES[audit.riskLevel])}>
          {t(`game.audit.risk.${audit.riskLevel}`)}
        </span>
        <Typography variant="Body/XS/Regular" className="text-muted-foreground">
          🛡 {t('game.audit.title')}
          {auditedAt ? ` · ${time(auditedAt).format('DD.MM.YYYY HH:mm')}` : ''}
          {audit.htmlTruncated ? ` · ${t('game.audit.truncatedNote')}` : ''}
        </Typography>
      </div>

      {audit.summary && (
        <Typography variant="Body/S/Regular" className="whitespace-pre-line">
          {audit.summary}
        </Typography>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FindingList title={t('game.audit.suspiciousPatterns')} items={audit.suspiciousPatterns} tone="bad" />
        <FindingList title={t('game.audit.networkRequests')} items={audit.networkRequests} tone="bad" />
        <FindingList title={t('game.audit.storageUsage')} items={audit.storageUsage} />
        <FindingList title={t('game.audit.browserApis')} items={audit.browserApis} />
        <FindingList title={t('game.audit.safeFindings')} items={audit.safeFindings} tone="good" />
        <FindingList title={t('game.audit.recommendations')} items={audit.recommendations} />
      </div>
    </div>
  )
}
