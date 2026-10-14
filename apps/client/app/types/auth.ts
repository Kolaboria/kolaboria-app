// --- Request ---
export type SystemRole = 'user' | 'admin'
export interface InitiableOrganization {
  id: string
  name: string
  slug: string
}
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}

// --- Response ---
export interface User {
  id: string
  name: string
  email: string
  username: string
  emailVerifiedAt: string | null
  isActive?: boolean
  createdAt?: string
  systemRole?: SystemRole
  initiableOrganizations?: InitiableOrganization[]
}

export interface CurrentUserResponse {
  id?: string
  username?: string
  system_role?: SystemRole
  initiable_organizations?: InitiableOrganization[]
  name: string
  email: string
  email_verified_at: string | null
  is_active: boolean
  created_at: string
}

export interface VerificationCooldown {
  verification_resend_available_at: string
}

export interface RegistrationResponse extends User, VerificationCooldown {}

export interface ResendVerificationResponse extends VerificationCooldown {}

export interface AuthResponsePayload {
  system_role?: SystemRole
  access_token: string
  refresh_token: string
  name: string
  email: string
  email_verified_at: string | null
}

export interface RefreshAuthResponsePayload {
  access_token: string
  refresh_token: string
  user: {
    id: string
    name: string
    username: string
    email: string
    email_verified_at: string | null
    is_active: boolean
    system_role: SystemRole
    created_at: string
  }
}

export interface VerificationCooldownErrorDetails {
  verification_resend_available_at?: string
  retry_after_seconds?: number
}
