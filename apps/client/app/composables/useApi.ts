import { defu } from 'defu'
import type { UseFetchOptions } from 'nuxt/app'
import type { ApiResponse } from '../types/api'
import type { RefreshAuthResponsePayload } from '../types/auth'
import { API_ENDPOINTS } from '../constants/api-endpoints'
import { assertApiResponse, getApiErrorStatus, toUserFacingError } from '../utils/error'
import { useAuthSession } from './useAuthSession'

const isSessionEndpoint = (request: Parameters<typeof $fetch>[0]) => {
  const path = typeof request === 'string'
    ? new URL(request, 'http://api.local').pathname
    : request.url ? new URL(request.url).pathname : ''
  return Object.values(API_ENDPOINTS.AUTH).some(endpoint =>
    endpoint !== API_ENDPOINTS.AUTH.ME && path.endsWith(endpoint)
  )
}

// Declarative requests use the same refresh/replay path as service actions.
export const useApiFetch = <T = unknown>(
  url: string | (() => string),
  options: UseFetchOptions<ApiResponse<T>> = {}
) => {
  const { $api } = useApi()
  const apiFetch = Object.assign($api, $fetch)
  return useFetch(url, defu(options, {
    key: typeof url === 'function' ? url() : url,
    $fetch: apiFetch
  }))
}

export const useApi = () => {
  const app = useNuxtApp()
  const config = useRuntimeConfig()
  const session = useAuthSession()
  const { accessToken, refreshToken } = session
  async function forceLogout() {
    const hadSession = !!(accessToken.value || refreshToken.value)
    accessToken.value = null
    refreshToken.value = null
    session.refreshedFrom = undefined
    await app.runWithContext(() => {
      for (const key of ['user', 'current_profile', 'current_talent_profile', 'is_onboarded']) {
        useState<unknown>(key, () => null).value = null
      }
      if (hadSession) return navigateTo('/login')
    })
  }

  async function refreshAccessToken(): Promise<boolean> {
    if (session.refreshing) return session.refreshing
    const previousAccess = accessToken.value
    const previousRefresh = refreshToken.value
    if (!previousRefresh) {
      await forceLogout()
      return false
    }

    const refresh = async () => {
      try {
        const response = assertApiResponse(await $fetch<ApiResponse<RefreshAuthResponsePayload>>(
          API_ENDPOINTS.AUTH.REFRESH,
          {
            baseURL: config.public.apiBaseUrl,
            method: 'POST',
            body: { refreshToken: previousRefresh },
            retry: 0
          }
        ))
        // Ignore a response belonging to a session that logged out or changed account.
        if (accessToken.value !== previousAccess || refreshToken.value !== previousRefresh) return false
        if (typeof response.data?.access_token !== 'string' || !response.data.access_token.trim() ||
            typeof response.data.refresh_token !== 'string' || !response.data.refresh_token.trim()) {
          throw new Error('Response refresh tidak memuat token sesi yang lengkap')
        }
        session.refreshedFrom = {
          accessToken: previousAccess,
          refreshToken: previousRefresh,
          nextAccessToken: response.data.access_token,
          nextRefreshToken: response.data.refresh_token
        }
        accessToken.value = response.data.access_token
        refreshToken.value = response.data.refresh_token
        return true
      } catch (error) {
        if (accessToken.value !== previousAccess || refreshToken.value !== previousRefresh) return false
        if ([401, 403].includes(getApiErrorStatus(error) ?? 0)) {
          await forceLogout()
          return false
        }
        // Network/server failures keep the session available for another attempt.
        throw toUserFacingError(error)
      }
    }
    session.refreshing = refresh()
    try {
      return await session.refreshing
    } finally {
      session.refreshing = undefined
    }
  }

  const $api = async <T = unknown>(
    request: Parameters<typeof $fetch>[0],
    opts: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> => {
    const sessionEndpoint = isSessionEndpoint(request)
    const sentToken = accessToken.value
    const sentRefresh = refreshToken.value
    const send = async () => {
      const headers = new Headers(opts.headers)
      if (accessToken.value) headers.set('Authorization', `Bearer ${accessToken.value}`)
      else headers.delete('Authorization')
      return assertApiResponse(await $fetch<T>(request, {
        baseURL: config.public.apiBaseUrl,
        ...opts,
        retry: 0,
        headers
      }))
    }

    try {
      return await send()
    } catch (error) {
      if (getApiErrorStatus(error) !== 401 || sessionEndpoint || (!sentToken && !sentRefresh)) {
        throw toUserFacingError(error)
      }
      // Reuse a token replaced by a parallel refresh, but never replay an old
      // account's mutation after the visitor logs in as a different account.
      const refreshedSameSession = () => session.refreshedFrom?.accessToken === sentToken &&
        session.refreshedFrom?.refreshToken === sentRefresh &&
        session.refreshedFrom?.nextAccessToken === accessToken.value &&
        session.refreshedFrom?.nextRefreshToken === refreshToken.value
      if (refreshToken.value !== sentRefresh && !refreshedSameSession()) throw toUserFacingError(error)
      if (accessToken.value === sentToken || !accessToken.value) {
        if (!(await refreshAccessToken())) throw toUserFacingError(error)
      }
      // Another waiter can log out/change accounts as the refresh resolves.
      if (refreshToken.value !== sentRefresh && !refreshedSameSession()) throw toUserFacingError(error)
      const retryToken = accessToken.value
      try {
        return await send()
      } catch (retryError) {
        if (getApiErrorStatus(retryError) === 401 && accessToken.value === retryToken) await forceLogout()
        throw toUserFacingError(retryError)
      }
    }
  }

  return { $api, refreshAccessToken, forceLogout }
}
