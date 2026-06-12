import { UserRole } from '~/api/user'

export type LoginEmailDto = {
  email: string
  password: string
}

export type RegisterDto = {
  email: string
  password: string
  /** Public handle; required for self-service sign-up, optional for admin/first-admin flows. */
  username?: string | null
}

export interface RegisterByAdminDto extends RegisterDto {
  role: UserRole
}

export type SignUpCompleteDto = {
  email: string
  code: string
}
