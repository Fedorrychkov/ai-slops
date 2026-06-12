import { defaultGuard, PageProps } from '@lib/page'

import { MyGamesScreen } from '~/components/Views/Game/Screen/MyGamesScreen'

const MyGamesRoot = async (props: PageProps) => {
  await defaultGuard({
    ...props,
    segments: ['games', 'my'],
    fallbackNavigatePath: '/login',
  })

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-6">
      <MyGamesScreen />
    </div>
  )
}

export default MyGamesRoot
