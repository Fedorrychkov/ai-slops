'use client'

import { AxiosError } from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useState } from 'react'

import { GameGenre, GameTool } from '~/api/game'
import { GAME_LIMITS } from '~/api/game/limits'
import type { GameSubmitDto } from '~/api/game/types'
import { InputField, TextAreaField } from '~/components/Fields'
import { Button, Typography } from '~/components/ui'
import { gameGenreLabel, gameToolLabel } from '~/components/Views/Game/gameLabels'
import { routes } from '~/constants'
import { useT } from '~/providers'
import { useNotify } from '~/providers/notify'
import { useSubmitGameMutation } from '~/query/game'
import { Logger } from '~/utils/logger'

const logger = new Logger(['GameSubmitForm', '[src/components/Views/Game/Submit/GameSubmitForm.tsx]'])

const selectClassName =
  'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50'

export function GameSubmitForm() {
  const t = useT()
  const router = useRouter()
  const { notify } = useNotify()
  const { submitGameMutation } = useSubmitGameMutation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [about, setAbout] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [tool, setTool] = useState<GameTool>(GameTool.CLAUDE)
  const [toolOther, setToolOther] = useState('')
  const [genre, setGenre] = useState<GameGenre>(GameGenre.ARCADE)
  const [promptCount, setPromptCount] = useState('')
  const [promptText, setPromptText] = useState('')
  const [coverEmoji, setCoverEmoji] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [allowEmbed, setAllowEmbed] = useState(true)
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => setHtmlContent(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (title.trim().length < GAME_LIMITS.titleMinLength || title.trim().length > GAME_LIMITS.titleMaxLength) {
      setError(t('game.errors.titleLength', { min: GAME_LIMITS.titleMinLength, max: GAME_LIMITS.titleMaxLength }))

      return
    }

    if (!htmlContent.trim()) {
      setError(t('game.errors.htmlContentRequired'))

      return
    }

    const dto: GameSubmitDto = {
      title: title.trim(),
      description: description.trim() || null,
      about: about.trim() || null,
      reviewNotes: reviewNotes.trim() || null,
      tool,
      toolOther: tool === GameTool.OTHER ? toolOther.trim() || null : null,
      genre,
      promptCount: promptCount.trim() ? Number(promptCount) : null,
      promptText: promptText.trim() || null,
      coverEmoji: coverEmoji.trim() || null,
      htmlContent,
      allowEmbed,
    }

    try {
      await submitGameMutation.mutateAsync(dto)

      notify(t('game.ui.submitSent'), 'success')
      router.push(routes.gamesPublic.path)
    } catch (submitError) {
      logger.error(submitError)

      if (submitError instanceof AxiosError) {
        setError(submitError.response?.data?.message ?? t('game.errors.submitFailed'))

        return
      }

      setError(t('game.errors.submitFailed'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-4">
      <div>
        <Typography variant="Body/L/Semibold" asTag="h1" className="mb-1">
          {t('game.ui.submitTitle')}
        </Typography>
        <Typography variant="Body/M/Regular" asTag="p" className="text-muted-foreground">
          {t('game.ui.submitDescription')}
        </Typography>
      </div>

      <InputField
        name="title"
        label={t('game.ui.fieldTitle')}
        value={title}
        required
        maxLength={GAME_LIMITS.titleMaxLength}
        onChange={(e) => setTitle(e.target.value)}
      />

      <InputField
        name="description"
        label={t('game.ui.fieldDescription')}
        value={description}
        maxLength={GAME_LIMITS.descriptionMaxLength}
        onChange={(e) => setDescription(e.target.value)}
      />

      <TextAreaField
        name="about"
        label={t('game.ui.fieldAbout')}
        hintText={t('game.ui.fieldAboutHint')}
        value={about}
        rows={5}
        maxLength={GAME_LIMITS.aboutMaxLength}
        onChange={(e) => setAbout(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm" htmlFor="game-tool">
            {t('game.ui.fieldTool')} <span className="text-destructive">*</span>
          </label>
          <select id="game-tool" className={selectClassName} value={tool} onChange={(e) => setTool(e.target.value as GameTool)}>
            {Object.values(GameTool).map((value) => (
              <option key={value} value={value}>
                {gameToolLabel(t, value)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm" htmlFor="game-genre">
            {t('game.ui.fieldGenre')} <span className="text-destructive">*</span>
          </label>
          <select id="game-genre" className={selectClassName} value={genre} onChange={(e) => setGenre(e.target.value as GameGenre)}>
            {Object.values(GameGenre).map((value) => (
              <option key={value} value={value}>
                {gameGenreLabel(t, value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tool === GameTool.OTHER && (
        <InputField name="toolOther" label={t('game.ui.fieldToolOther')} value={toolOther} onChange={(e) => setToolOther(e.target.value)} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          name="promptCount"
          label={t('game.ui.fieldPromptCount')}
          type="number"
          value={promptCount}
          onChange={(e) => setPromptCount(e.target.value)}
        />
        <InputField
          name="coverEmoji"
          label={t('game.ui.fieldCoverEmoji')}
          value={coverEmoji}
          maxLength={GAME_LIMITS.coverEmojiMaxLength}
          onChange={(e) => setCoverEmoji(e.target.value)}
        />
      </div>

      <TextAreaField
        name="promptText"
        label={t('game.ui.fieldPromptText')}
        value={promptText}
        rows={4}
        maxLength={GAME_LIMITS.promptTextMaxLength}
        onChange={(e) => setPromptText(e.target.value)}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm" htmlFor="game-html-file">
          {t('game.ui.fieldHtmlContent')} <span className="text-destructive">*</span>
        </label>
        <input id="game-html-file" type="file" accept=".html,text/html" onChange={handleFile} className="text-sm text-muted-foreground" />
        <TextAreaField
          name="htmlContent"
          value={htmlContent}
          rows={10}
          classNames={{ input: 'font-mono text-xs' }}
          onChange={(e) => setHtmlContent(e.target.value)}
        />
      </div>

      <TextAreaField
        name="reviewNotes"
        label={t('game.ui.fieldReviewNotes')}
        hintText={t('game.ui.fieldReviewNotesHint')}
        value={reviewNotes}
        rows={3}
        maxLength={GAME_LIMITS.reviewNotesMaxLength}
        onChange={(e) => setReviewNotes(e.target.value)}
      />

      <p className="text-xs text-muted-foreground">
        {t('game.ui.submitRequirementsBefore')}{' '}
        <Link href={routes.gamesRequirements.path} target="_blank" className="text-primary underline underline-offset-2 hover:brightness-110">
          {t('game.ui.submitRequirementsLink')}
        </Link>
      </p>

      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input type="checkbox" checked={allowEmbed} onChange={(e) => setAllowEmbed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
        <span>
          {t('game.ui.fieldAllowEmbed')}
          <span className="block text-xs text-muted-foreground">{t('game.ui.fieldAllowEmbedHint')}</span>
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitGameMutation.isLoading}>
        {submitGameMutation.isLoading ? t('common.loading') : t('game.ui.submitYourGame')}
      </Button>
    </form>
  )
}
