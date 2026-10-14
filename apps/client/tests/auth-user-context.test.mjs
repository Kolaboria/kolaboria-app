import assert from 'node:assert/strict'
import test from 'node:test'
import { effectScope, ref } from 'vue'
import './helpers/frontend-runtime.mjs'

const { parseCurrentUserContext } = await import('../app/utils/auth-user-context.ts')
const { AuthService } = await import('../app/services/auth.service.ts')
const { useAuth } = await import('../app/composables/useAuth.ts')
const { ProfileService } = await import('../app/services/profile.service.ts')
const { useProfile } = await import('../app/composables/useProfile.ts')

const organization = { id: 'bc9e7805-6000-4e0e-9d00-95fc8b85fe6a', name: 'Community A', slug: 'community-a' }
const wireContext = (extras = {}) => ({ name: 'Test user', email: 'test@example.com', email_verified_at: '2026-10-08T01:00:00Z', is_active: true, created_at: '2026-10-01T01:00:00Z', ...extras })

test('strict onboarding lookup reports transport failures without overwriting known onboarding status', async () => {
  const onboarded = ref(true)
  globalThis.useState = (key, init) => key === 'is_onboarded' ? onboarded : ref(init())
  globalThis.useCookie = () => ref(null)
  const app = { _scope: effectScope(true), runWithContext: fn => fn() }
  globalThis.useNuxtApp = () => app
  globalThis.useRuntimeConfig = () => ({ public: { apiBaseUrl: 'http://unused.test' } })
  globalThis.$fetch = async () => { throw new Error('transport failure') }
  try {
    await assert.rejects(ProfileService.checkOnboardingStatus({ throwOnError: true }))
    await assert.rejects(useProfile().checkOnboardingStatus(true, { throwOnError: true }))
    assert.equal(onboarded.value, true)
    globalThis.$fetch = async () => ({ status: 200, data: { is_onboarded: false } })
    assert.equal(await useProfile().checkOnboardingStatus(true, { throwOnError: true }), false)
    assert.equal(onboarded.value, false)
  } finally {
    for (const key of ['useState', 'useCookie', 'useNuxtApp', 'useRuntimeConfig', '$fetch']) delete globalThis[key]
  }
})

test('ordinary and old account responses fail closed for organization choices', () => {
  const old = parseCurrentUserContext(wireContext())
  assert.equal(old.system_role, 'user')
  assert.deepEqual(old.initiable_organizations, [])
  const user = parseCurrentUserContext(wireContext({ system_role: 'user', initiable_organizations: [organization] }))
  assert.deepEqual(user.initiable_organizations, [])
})

test('admin context validates unique organizations and never accepts malformed privilege data', () => {
  const admin = parseCurrentUserContext(wireContext({ system_role: 'admin', initiable_organizations: [organization] }))
  assert.deepEqual(admin.initiable_organizations, [organization])
  for (const extras of [
    { system_role: 'staff' },
    { system_role: 'admin', initiable_organizations: [{ ...organization, id: 'invalid' }] },
    { system_role: 'admin', initiable_organizations: [organization, organization] }
  ]) assert.throws(() => parseCurrentUserContext(wireContext(extras)))
})

test('context refresh replaces revoked rights and transport errors clear rights without deleting the session', async () => {
  const payload = { user_id: '6376d976-a9ef-483d-8b60-71df1aaebf64', username: 'test-user', system_role: 'admin' }
  const token = ['e30', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'test'].join('.')
  const cookies = new Map([['auth_token', ref(token)], ['auth_refresh_token', ref('refresh')]])
  const states = new Map()
  globalThis.useCookie = name => cookies.get(name)
  const app = { _scope: effectScope(true), runWithContext: fn => fn() }
  globalThis.useNuxtApp = () => app
  globalThis.useState = (key, init = () => null) => { if (!states.has(key)) states.set(key, ref(init())); return states.get(key) }
  const original = AuthService.getMe
  try {
    const auth = useAuth()
    AuthService.getMe = async () => ({ data: wireContext({ system_role: 'admin', initiable_organizations: [organization] }) })
    await auth.fetchCurrentUser()
    assert.deepEqual(auth.user.value.initiableOrganizations, [organization])
    AuthService.getMe = async () => ({ data: wireContext({ system_role: 'user', initiable_organizations: [] }) })
    await auth.fetchCurrentUser()
    assert.equal(auth.user.value.systemRole, 'user')
    assert.deepEqual(auth.user.value.initiableOrganizations, [])
    AuthService.getMe = async () => { throw new Error('transport failure') }
    assert.equal(await auth.fetchCurrentUser({ preserveSessionOnError: true }), null)
    assert.equal(cookies.get('auth_token').value, token)
    assert.deepEqual(auth.user.value.initiableOrganizations, [])
  } finally {
    AuthService.getMe = original
    delete globalThis.useCookie
    delete globalThis.useNuxtApp
    delete globalThis.useState
  }
})

test('cold create entry keeps an existing session on temporary context failures and still rejects invalid sessions', async () => {
  globalThis.defineNuxtRouteMiddleware = fn => fn
  const authenticated = ref(true)
  const calls = []
  globalThis.useAuth = () => ({ isAuthenticated: authenticated, user: ref(null), fetchCurrentUser: async options => { calls.push(options); return null } })
  globalThis.navigateTo = path => path
  const { default: guard } = await import('../app/middleware/auth.ts')
  try {
    assert.equal(await guard({ path: '/projects/create' }), undefined)
    assert.equal(calls[0].preserveSessionOnError, true)
    authenticated.value = false
    assert.equal(await guard({ path: '/projects/create' }), '/login')
    authenticated.value = true
    assert.equal(await guard({ path: '/home' }), '/login')
  } finally {
    for (const key of ['defineNuxtRouteMiddleware', 'useAuth', 'navigateTo']) delete globalThis[key]
  }
})
