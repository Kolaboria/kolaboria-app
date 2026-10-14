import type { Ref } from 'vue'

interface AuthSession {
  accessToken: Ref<string | null>
  refreshToken: Ref<string | null>
  refreshing?: Promise<boolean>
  refreshedFrom?: {
    accessToken: string | null
    refreshToken: string
    nextAccessToken: string
    nextRefreshToken: string
  }
}

// One session per Nuxt app, including one per SSR request. Keep promises out of
// useState because Nuxt serializes that state into the hydration payload.
const sessions = new WeakMap<ReturnType<typeof useNuxtApp>, AuthSession>()

export const useAuthSession = (): AuthSession => {
  const app = useNuxtApp()
  let session = sessions.get(app)
  if (!session) {
    const options = { path: '/', sameSite: 'lax' as const, secure: import.meta.env.PROD }
    // useCookie's watchers must outlive the page that first uses the session.
    session = app._scope.run(() => ({
      accessToken: useCookie<string | null>('auth_token', options),
      refreshToken: useCookie<string | null>('auth_refresh_token', options)
    }))
    if (!session) throw new Error('Nuxt app scope is unavailable')
    sessions.set(app, session)
  }
  return session
}
