import { defaultGuard, PageProps } from '@lib/page'

import { UserRole } from '~/api/user'
import { GameModerationScreen } from '~/components/Views/Game/Screen/GameModerationScreen'

const AdminGamesRoot = async (props: PageProps) => {
  await defaultGuard({
    ...props,
    segments: ['admin', 'games'],
    fallbackNavigatePath: '/',
    roles: [UserRole.ADMIN, UserRole.EDITOR],
    fallbackRolesNavigatePath: { [UserRole.USER]: '/' },
  })

  return (
    <div className="w-full h-full flex justify-center flex-col flex-1 gap-6">
      <GameModerationScreen />
    </div>
  )
}

export default AdminGamesRoot
