'use client'

import type { ModerationNotifyUiState } from '~/api/moderation/types'
import { TextAreaField } from '~/components/Fields'
import { Checkbox, Label, Typography } from '~/components/ui'
import { useT } from '~/providers'

type Props = {
  mode: 'approve' | 'reject'
  value: ModerationNotifyUiState
  onChange: (next: ModerationNotifyUiState) => void
}

export function ModerationNotifyControls({ mode, value, onChange }: Props) {
  const t = useT()

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3">
      <Typography variant="Body/XS/Semibold" className="text-muted-foreground uppercase tracking-wide">
        {t('moderation.notify.sectionTitle')}
      </Typography>

      {mode === 'approve' && (
        <TextAreaField
          name="moderatorNote"
          label={t('moderation.notify.moderatorNote')}
          hintText={t('moderation.notify.moderatorNoteHint')}
          value={value.moderatorNote}
          rows={2}
          onChange={(e) => onChange({ ...value, moderatorNote: e.target.value })}
        />
      )}

      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <Checkbox checked={value.notifyAuthor} onCheckedChange={(checked) => onChange({ ...value, notifyAuthor: checked === true })} className="mt-0.5" />
        <span>{t('moderation.notify.notifyAuthor')}</span>
      </label>

      {value.notifyAuthor && (
        <div className="flex flex-wrap gap-4 pl-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`moderation-web-push-${mode}`}
              checked={value.webPush}
              onCheckedChange={(checked) => onChange({ ...value, webPush: checked === true })}
            />
            <Label htmlFor={`moderation-web-push-${mode}`} className="cursor-pointer text-sm font-normal">
              {t('platformNotifications.channel.web_push')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`moderation-email-${mode}`} checked={value.email} onCheckedChange={(checked) => onChange({ ...value, email: checked === true })} />
            <Label htmlFor={`moderation-email-${mode}`} className="cursor-pointer text-sm font-normal">
              {t('platformNotifications.channel.email')}
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}
