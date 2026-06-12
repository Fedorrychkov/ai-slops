import { defaultGuard, PageProps } from '@lib/page'

import { GameSubmitForm } from '~/components/Views/Game/Submit/GameSubmitForm'

const GamesSubmitRoot = async (props: PageProps) => {
  await defaultGuard({
    ...props,
    segments: ['games', 'submit'],
    fallbackNavigatePath: '/login',
  })

  return (
    <div className="flex w-full flex-1 justify-center py-6 mx-auto max-w-6xl px-4 sm:px-6">
      <GameSubmitForm />
    </div>
  )
}

export default GamesSubmitRoot
