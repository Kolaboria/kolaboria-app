import { computed, nextTick } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { AuthService } from '../services/auth.service'
import type { AuthResponsePayload, User } from '../types/auth'
import { parseCurrentUserContext } from '../utils/auth-user-context'
import { getApiErrorStatus } from '../utils/error'
import { useAuthSession } from './useAuthSession'

export const useAuth = () => {
  const session = useAuthSession()
  const { accessToken, refreshToken } = session
  const user = useState<User | null>('user', () => null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const isVerified = computed(() => !!user.value?.emailVerifiedAt)

  const applyAuthResponse = async (data?: AuthResponsePayload) => {
    if (
      !data?.access_token ||
      !data.refresh_token ||
      !data.name ||
      !data.email
    ) {
      throw new Error('Response login tidak memuat data sesi yang lengkap')
    }

    let identity: DecodedToken
    try {
      identity = jwtDecode<DecodedToken>(data.access_token)
    } catch {
      throw new Error('Access token dari server tidak valid')
    }
    if (!identity.user_id || !identity.username) {
      throw new Error('Access token tidak memuat identitas pengguna')
    }

    session.refreshedFrom = undefined
    accessToken.value = data.access_token
    refreshToken.value = data.refresh_token
    user.value = {
      id: identity.user_id,
      username: identity.username,
      name: data.name,
      email: data.email,
      emailVerifiedAt: data.email_verified_at,
      systemRole: data.system_role === 'admin' ? 'admin' : 'user',
      initiableOrganizations: []
    }

    await nextTick()
    if (
      import.meta.client &&
      (!hasCookieValue('auth_token', data.access_token) ||
        !hasCookieValue('auth_refresh_token', data.refresh_token))
    ) {
      accessToken.value = null
      refreshToken.value = null
      user.value = null
      throw new Error('Browser tidak menyimpan cookie sesi')
    }
  }

  const login = async (email: string, password: string) => {
    const res = await AuthService.login({ email, password })
    await applyAuthResponse(res.data)
    return res
  }

  const logout = async () => {
    try {
      if (refreshToken.value) {
        await AuthService.logout(refreshToken.value)
      }
    } catch (err) {
      console.warn('Backend logout failed', err)
    } finally {
      session.refreshedFrom = undefined
      accessToken.value = null
      refreshToken.value = null
      user.value = null

      const currentProfile = useState('current_profile')
      const currentTalentProfile = useState('current_talent_profile')
      const isOnboardedState = useState('is_onboarded')

      currentProfile.value = null
      currentTalentProfile.value = null
      isOnboardedState.value = null

      navigateTo('/login')
    }
  }

  const register = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    return await AuthService.register({ email, password, fullName })
  }

  const loginWithGoogle = () => {
    AuthService.loginWithGoogle()
  }

  const loginWithGoogleCallback = async (code: string) => {
    const res = await AuthService.loginWithGoogleCallback(code)
    await applyAuthResponse(res.data)
    return res
  }

  const resendVerification = async (email?: string) => {
    const targetEmail = email || user.value?.email
    if (!targetEmail) throw new Error('Email tidak ditemukan')
    return await AuthService.resendVerification(targetEmail)
  }

  const forgotPassword = async (email: string) => {
    await AuthService.forgotPassword(email)
  }

  const resetPassword = async (token: string, newPassword: string) => {
    await AuthService.resetPassword({ token, newPassword })
  }

  const fetchCurrentUser = async (options: { preserveSessionOnError?: boolean } = {}) => {
    if (!accessToken.value) return null
    try {
      const res = await AuthService.getMe()
      if (res.data) {
        const context = parseCurrentUserContext(res.data)
        const identity = getDecodedToken()
        if (!identity?.user_id || !identity.username) {
          throw new Error('Token autentikasi tidak memuat identitas pengguna')
        }
        if (context.id && context.id !== identity.user_id) {
          throw new Error('Identitas akun tidak sesuai dengan sesi.')
        }

        user.value = {
          id: identity.user_id,
          username: identity.username,
          name: context.name,
          email: context.email,
          emailVerifiedAt: context.email_verified_at,
          isActive: context.is_active,
          createdAt: context.created_at,
          systemRole: context.system_role ?? 'user',
          initiableOrganizations: context.initiable_organizations ?? []
        }
      } else throw new Error('Data akun belum tersedia.')
      return user.value
    } catch (err) {
      const status = getApiErrorStatus(err)
      if (options.preserveSessionOnError === false || !accessToken.value || status === 401 || status === 403 || status === 404) {
        accessToken.value = null
        refreshToken.value = null
        user.value = null
      } else if (user.value) {
        // A failed refresh must not retain previously granted organization rights.
        user.value = { ...user.value, systemRole: 'user', initiableOrganizations: [] }
      }
      return null
    }
  }

  interface DecodedToken {
    user_id?: string
    username?: string
    exp?: number
  }

  const getDecodedToken = (): DecodedToken | null => {
    if (!accessToken.value) return null
    try {
      return jwtDecode<DecodedToken>(accessToken.value)
    } catch (e) {
      console.error('Failed to parse JWT token:', e)
      return null
    }
  }

  const hasCookieValue = (name: string, expectedValue: string) => {
    try {
      const cookie = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`))
      if (!cookie) return false
      return decodeURIComponent(cookie.slice(name.length + 1)) === expectedValue
    } catch {
      return false
    }
  }

  const currentUserId = computed(() => getDecodedToken()?.user_id || null)
  const currentUsername = computed(() => getDecodedToken()?.username || null)

  const verifyEmail = async (token: string) => {
    return await AuthService.verifyEmail(token)
  }

  return {
    user,
    isAuthenticated,
    isVerified,
    login,
    logout,
    register,
    loginWithGoogle,
    loginWithGoogleCallback,
    resendVerification,
    verifyEmail,
    forgotPassword,
    resetPassword,
    fetchCurrentUser,
    currentUserId,
    currentUsername
  }
}
