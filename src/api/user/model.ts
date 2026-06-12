export type UserEmailOrigin = 'credentials' | 'oauth' | 'admin'

export type UserEmailTrust = 'native' | 'external' | 'disputed' | null

export type UserModel = {
  id: string
  role: UserRole
  passwordHash?: string | null
  email: string
  /** Public handle shown instead of email (unique, lowercase). Null for legacy/OAuth accounts until set. */
  username?: string | null
  status: UserStatus
  languageCode?: string | null
  emailOrigin?: UserEmailOrigin | null
  emailTrust?: UserEmailTrust
  createdAt?: string | null
  updatedAt?: string | null
}

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

export enum UserRole {
  ADMIN = 'admin',
  /**
   * Regular user, has no admin access
   */
  USER = 'user',
  /**
   * Like admin, but has no access to all admin features, only articles and other
   */
  EDITOR = 'editor',
}

/** Fields returned by auth login / register / profile / verify-token APIs. */
export type AuthUserSnapshot = Pick<UserModel, 'id' | 'email' | 'username' | 'role' | 'status'>
