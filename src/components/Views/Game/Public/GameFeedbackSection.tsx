'use client'

import { AxiosError } from 'axios'
import Link from 'next/link'
import { useState } from 'react'

import { GAME_FEEDBACK_LIMITS } from '~/api/game-feedback'
import { TextAreaField } from '~/components/Fields'
import { Button, Typography } from '~/components/ui'
import { useT } from '~/providers'
import { useAuth } from '~/providers/auth'
import { useNotify } from '~/providers/notify'
import { usePublicGameFeedbackQuery, useSubmitGameFeedbackMutation } from '~/query/game-feedback'
import { cn } from '~/utils/cn'
import { Logger } from '~/utils/logger'
import { time } from '~/utils/time'

const logger = new Logger(['GameFeedbackSection', '[src/components/Views/Game/Public/GameFeedbackSection.tsx]'])

type Props = {
  gameId: string
}

const Stars = ({ rating }: { rating: number }) => (
  <span className="text-sm text-primary" aria-label={`${rating}/5`}>
    {'★'.repeat(rating)}
    <span className="text-muted-foreground/40">{'★'.repeat(5 - rating)}</span>
  </span>
)

/** Approved player feedback + submission form (auth required; new entries go to moderation). */
export function GameFeedbackSection({ gameId }: Props) {
  const t = useT()
  const { notify } = useNotify()
  const { authUser } = useAuth()
  const { data, isLoading } = usePublicGameFeedbackQuery(gameId)
  const { submitGameFeedbackMutation } = useSubmitGameFeedbackMutation()

  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')

    if (text.trim().length < GAME_FEEDBACK_LIMITS.textMinLength) {
      setError(t('game.feedback.errors.textLength', { min: GAME_FEEDBACK_LIMITS.textMinLength, max: GAME_FEEDBACK_LIMITS.textMaxLength }))

      return
    }

    try {
      await submitGameFeedbackMutation.mutateAsync({ gameId, rating, text: text.trim() })

      setText('')
      notify(t('game.feedback.submitted'), 'success')
    } catch (submitError) {
      logger.error(submitError)

      if (submitError instanceof AxiosError) {
        setError(submitError.response?.data?.message ?? t('game.feedback.errors.submitFailed'))

        return
      }

      setError(t('game.feedback.errors.submitFailed'))
    }
  }

  const items = data?.list ?? []

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <Typography variant="Body/S/Semibold" asTag="h2" className="uppercase tracking-wide text-muted-foreground">
        {t('game.feedback.title')}
        {data?.count ? ` · ${data.count}` : ''}
      </Typography>

      <div className="mt-4 flex flex-col gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}

        {!isLoading && items.length === 0 && <p className="text-sm text-muted-foreground">{t('game.feedback.empty')}</p>}

        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">@{item.authorUsername ?? '—'}</span>
              {item.rating != null && <Stars rating={item.rating} />}
              {item.createdAt && <span className="ml-auto">{time(item.createdAt).format('DD.MM.YYYY')}</span>}
            </div>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        {authUser ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{t('game.feedback.yourRating')}:</span>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={cn('text-xl transition-colors', value <= rating ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground')}
                  aria-label={`${value}/5`}
                >
                  ★
                </button>
              ))}
            </div>

            <TextAreaField
              name="feedbackText"
              placeholder={t('game.feedback.placeholder')}
              value={text}
              rows={3}
              maxLength={GAME_FEEDBACK_LIMITS.textMaxLength}
              onChange={(e) => setText(e.target.value)}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <Button size="sm-md" disabled={submitGameFeedbackMutation.isLoading} onClick={handleSubmit}>
                {submitGameFeedbackMutation.isLoading ? t('common.loading') : t('game.feedback.submit')}
              </Button>
              <span className="text-xs text-muted-foreground">{t('game.feedback.moderationNote')}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary underline underline-offset-2 hover:brightness-110">
              {t('game.feedback.signInToLeave')}
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
