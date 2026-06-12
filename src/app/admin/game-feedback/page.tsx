import { defaultGuard, PageProps } from '@lib/page'

import { UserRole } from '~/api/user'
import { GameFeedbackModerationScreen } from '~/components/Views/Game/Screen/GameFeedbackModerationScreen'

const AdminGameFeedbackRoot = async (props: PageProps) => {
  await defaultGuard({
    ...props,
    segments: ['admin', 'game-feedback'],
    fallbackNavigatePath: '/',
    roles: [UserRole.ADMIN, UserRole.EDITOR],
    fallbackRolesNavigatePath: { [UserRole.USER]: '/' },
  })

  return (
    <div className="w-full h-full flex justify-center flex-col flex-1 gap-6">
      <GameFeedbackModerationScreen />
    </div>
  )
}

export default AdminGameFeedbackRoot
