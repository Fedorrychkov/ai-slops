'use client'

import { AxiosError } from 'axios'
import Link from 'next/link'
import { useState } from 'react'

import { GameModel, GameStatus } from '~/api/game'
import { GAME_LIMITS } from '~/api/game/limits'
import type { GameUpdateOwnDto } from '~/api/game/types'
import { TitleWithBadge } from '~/components/Blocks/TitleWithBadge'
import { InputField, TextAreaField } from '~/components/Fields'
import { usePagination } from '~/components/List/usePagination'
import { Badge, Button, Typography } from '~/components/ui'
import { gameGenreLabel, gameToolLabel } from '~/components/Views/Game/gameLabels'
import { routes } from '~/constants'
import { useT } from '~/providers'
import { useNotify } from '~/providers/notify'
import { useMyGamesQuery, useUpdateOwnGameMutation } from '~/query/game'
import { Logger } from '~/utils/logger'

const logger = new Logger(['MyGamesScreen', '[src/components/Views/Game/Screen/MyGamesScreen.tsx]'])

const PAGE_LIMIT = 10

type EditState = {
  title: string
  description: string
  about: string
  reviewNotes: string
  promptText: string
  coverEmoji: string
  allowEmbed: boolean
  htmlContent: string
}

const editHasChanges = (game: GameModel, edit: EditState): boolean =>
  edit.title.trim() !== (game.title ?? '') ||
  edit.description.trim() !== (game.description ?? '') ||
  edit.about.trim() !== (game.about ?? '') ||
  edit.reviewNotes.trim() !== (game.reviewNotes ?? '') ||
  edit.promptText.trim() !== (game.promptText ?? '') ||
  edit.coverEmoji.trim() !== (game.coverEmoji ?? '') ||
  edit.allowEmbed !== (game.allowEmbed !== false) ||
  edit.htmlContent.trim().length > 0

const editStateFromGame = (game: GameModel): EditState => ({
  title: game.title ?? '',
  description: game.description ?? '',
  about: game.about ?? '',
  reviewNotes: game.reviewNotes ?? '',
  promptText: game.promptText ?? '',
  coverEmoji: game.coverEmoji ?? '',
  allowEmbed: game.allowEmbed !== false,
  htmlContent: '',
})

/** Author dashboard: own submissions with statuses, reject reasons and inline editing. */
export const MyGamesScreen = () => {
  const t = useT()
  const { notify } = useNotify()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [error, setError] = useState('')

  const { page, setPage, offset } = usePagination({ limit: PAGE_LIMIT })

  const { data, isLoading, refetch } = useMyGamesQuery({ limit: PAGE_LIMIT, offset })

  const { updateOwnGameMutation } = useUpdateOwnGameMutation()

  const startEdit = (game: GameModel) => {
    setEditingId(game.id)
    setEdit(editStateFromGame(game))
    setError('')
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => setEdit((prev) => (prev ? { ...prev, htmlContent: String(reader.result ?? '') } : prev))
    reader.readAsText(file)
  }

  const handleSave = async (game: GameModel) => {
    if (!edit) {
      return
    }

    setError('')

    const dto: GameUpdateOwnDto = {
      title: edit.title.trim(),
      description: edit.description.trim() || null,
      about: edit.about.trim() || null,
      reviewNotes: edit.reviewNotes.trim() || null,
      promptText: edit.promptText.trim() || null,
      coverEmoji: edit.coverEmoji.trim() || null,
      allowEmbed: edit.allowEmbed,
      ...(edit.htmlContent.trim() ? { htmlContent: edit.htmlContent } : {}),
    }

    try {
      await updateOwnGameMutation.mutateAsync({ id: game.id, ...dto })

      const willRequeue = (game.status === GameStatus.APPROVED || game.status === GameStatus.REJECTED) && editHasChanges(game, edit)

      notify(willRequeue ? t('game.my.savedBackToModeration') : t('game.my.saved'), 'success')
      setEditingId(null)
      setEdit(null)
      await refetch()
    } catch (saveError) {
      logger.error(saveError)

      if (saveError instanceof AxiosError) {
        setError(saveError.response?.data?.message ?? t('errors.unknown'))

        return
      }

      setError(t('errors.unknown'))
    }
  }

  const statusBadgeKey = (status?: GameStatus | null) =>
    status === GameStatus.APPROVED ? 'game.ui.statusApproved' : status === GameStatus.REJECTED ? 'game.ui.statusRejected' : 'game.ui.statusPending'

  const pages = data?.pages ?? 0

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TitleWithBadge title={t('game.ui.myGames')} badgeContent={<Typography variant="Body/XS/Regular">{data?.count ?? 0}</Typography>} />
        <Link
          href={routes.gamesSubmit.path}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {t('game.ui.submitYourGame')}
        </Link>
      </div>

      {isLoading && <Typography variant="Body/M/Regular">{t('common.loading')}</Typography>}

      {!isLoading && (data?.list ?? []).length === 0 && (
        <Typography variant="Body/M/Regular" className="text-muted-foreground">
          {t('game.my.empty')}
        </Typography>
      )}

      <div className="flex flex-col gap-3">
        {(data?.list ?? []).map((game) => (
          <div key={game.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl select-none">{game.coverEmoji || '🎮'}</span>
              <div className="min-w-0">
                <Typography variant="Body/M/Semibold" asTag="h3">
                  {game.status === GameStatus.APPROVED && game.slug ? (
                    <Link href={routes.gamePublic.path.replace(':slug', game.slug)} className="hover:underline">
                      {game.title}
                    </Link>
                  ) : (
                    game.title
                  )}
                </Typography>
                <Typography variant="Body/XS/Regular" className="text-muted-foreground">
                  {gameToolLabel(t, game.tool, game.toolOther)} · {gameGenreLabel(t, game.genre)} · ▲ {game.upvoteCountTotal ?? 0} · {game.playCountTotal ?? 0}{' '}
                  {t('game.ui.plays')}
                </Typography>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline">{t(statusBadgeKey(game.status))}</Badge>
                <Button variant="outline" size="sm-md" onClick={() => (editingId === game.id ? setEditingId(null) : startEdit(game))}>
                  {editingId === game.id ? t('common.cancel') : t('game.my.edit')}
                </Button>
              </div>
            </div>

            {game.status === GameStatus.REJECTED && game.rejectReason && (
              <Typography variant="Body/XS/Regular" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-destructive">
                {t('game.ui.rejectReason')}: {game.rejectReason}
              </Typography>
            )}

            {editingId === game.id && edit && (
              <div className="flex flex-col gap-3 border-t border-border pt-3">
                {game.status === GameStatus.APPROVED && (
                  <Typography
                    variant="Body/XS/Regular"
                    className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-100"
                  >
                    {t('game.my.editApprovedWarning')}
                  </Typography>
                )}

                <InputField
                  name="title"
                  label={t('game.ui.fieldTitle')}
                  value={edit.title}
                  maxLength={GAME_LIMITS.titleMaxLength}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
                <InputField
                  name="description"
                  label={t('game.ui.fieldDescription')}
                  value={edit.description}
                  maxLength={GAME_LIMITS.descriptionMaxLength}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                />
                <TextAreaField
                  name="about"
                  label={t('game.ui.fieldAbout')}
                  value={edit.about}
                  rows={4}
                  maxLength={GAME_LIMITS.aboutMaxLength}
                  onChange={(e) => setEdit({ ...edit, about: e.target.value })}
                />
                <TextAreaField
                  name="reviewNotes"
                  label={t('game.ui.fieldReviewNotes')}
                  value={edit.reviewNotes}
                  rows={3}
                  maxLength={GAME_LIMITS.reviewNotesMaxLength}
                  onChange={(e) => setEdit({ ...edit, reviewNotes: e.target.value })}
                />
                <TextAreaField
                  name="promptText"
                  label={t('game.ui.fieldPromptText')}
                  value={edit.promptText}
                  rows={3}
                  maxLength={GAME_LIMITS.promptTextMaxLength}
                  onChange={(e) => setEdit({ ...edit, promptText: e.target.value })}
                />
                <InputField
                  name="coverEmoji"
                  label={t('game.ui.fieldCoverEmoji')}
                  value={edit.coverEmoji}
                  maxLength={GAME_LIMITS.coverEmojiMaxLength}
                  onChange={(e) => setEdit({ ...edit, coverEmoji: e.target.value })}
                />

                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={edit.allowEmbed}
                    onChange={(e) => setEdit({ ...edit, allowEmbed: e.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span>
                    {t('game.ui.fieldAllowEmbed')}
                    <span className="block text-xs text-muted-foreground">{t('game.ui.fieldAllowEmbedHint')}</span>
                  </span>
                </label>

                <div className="flex flex-col gap-1">
                  <label className="text-sm" htmlFor={`game-html-file-${game.id}`}>
                    {t('game.my.replaceHtml')}
                  </label>
                  <input
                    id={`game-html-file-${game.id}`}
                    type="file"
                    accept=".html,text/html"
                    onChange={handleFile}
                    className="text-sm text-muted-foreground"
                  />
                  <span className="text-xs text-muted-foreground">{t('game.my.replaceHtmlHint')}</span>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div>
                  <Button size="sm-md" disabled={updateOwnGameMutation.isLoading} onClick={() => handleSave(game)}>
                    {updateOwnGameMutation.isLoading ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm-md" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('common.prev')}
          </Button>
          <Typography variant="Body/XS/Regular" className="text-muted-foreground">
            {page} / {pages}
          </Typography>
          <Button variant="outline" size="sm-md" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
