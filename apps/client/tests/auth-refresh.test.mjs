import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { effectScope, nextTick, ref, watch } from 'vue'
import { mountSetup } from './helpers/frontend-runtime.mjs'

const require = createRequire(import.meta.resolve('nuxt/package.json'))
const { ofetch } = await import(pathToFileURL(require.resolve('ofetch')).href)
const { useApi, useApiFetch } = await import('../app/composables/useApi.ts')

async function fixture(t, settings = {}) {
  const calls = []
  const listeners = []
  const waitForCalls = predicate => new Promise(resolve => {
    if (predicate(calls)) resolve()
    else listeners.push(() => { if (predicate(calls)) resolve() })
  })
  const cookies = { auth_token: ref('expired-access'), auth_refresh_token: ref('valid-refresh') }
  const states = new Map(['user', 'current_profile', 'current_talent_profile', 'is_onboarded'].map(key => [key, ref({ id: 'old-user' })]))
  const navigations = []
  const app = { _scope: effectScope(true), runWithContext: fn => fn() }
  const cookieWrites = []
  const server = createServer(async (request, response) => {
    let body = ''
    for await (const chunk of request) body += chunk
    calls.push({ url: request.url, method: request.method, authorization: request.headers.authorization, body: body ? JSON.parse(body) : undefined, custom: request.headers['x-custom'] })
    for (const listener of listeners) listener()
    response.setHeader('Content-Type', 'application/json')
    if (request.url === '/auth/refresh') {
      if (settings.waitForRefresh) await settings.waitForRefresh
      response.statusCode = settings.refreshStatus ?? 200
      response.end(JSON.stringify(settings.refreshEnvelope ?? {
        status: response.statusCode,
        data: response.statusCode === 200 ? {
          access_token: 'fresh-access', refresh_token: settings.nextRefreshToken ?? 'fresh-refresh',
          user: { id: 'old-user', name: 'Test', username: 'test', email: 'test@example.com', email_verified_at: null, is_active: true, system_role: 'user', created_at: '2026-10-01T00:00:00Z' }
        } : { trace_id: 'refresh-trace' }
      }))
    } else {
      if (settings.waitForOldRequest && request.headers.authorization === 'Bearer expired-access' && request.url === '/late') await settings.waitForOldRequest
      response.statusCode = request.url === '/auth/login' || settings.alwaysUnauthorized || request.headers.authorization !== 'Bearer fresh-access' ? 401 : 200
      response.end(JSON.stringify({ status: response.statusCode, data: response.statusCode === 200 ? { saved: true } : { trace_id: 'request-trace' } }))
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  globalThis.useRuntimeConfig = () => ({ public: { apiBaseUrl: `http://127.0.0.1:${server.address().port}` } })
  globalThis.useNuxtApp = () => app
  globalThis.useCookie = name => {
    if (settings.watchCookies) watch(cookies[name], value => cookieWrites.push([name, value]))
    return cookies[name]
  }
  globalThis.useState = (key, init = () => null) => { if (!states.has(key)) states.set(key, ref(init())); return states.get(key) }
  globalThis.navigateTo = path => { navigations.push(path) }
  globalThis.$fetch = ofetch.create({ retry: 0 })
  globalThis.useFetch = (request, options) => (options.$fetch ?? globalThis.$fetch)(request, options)
  t.after(async () => {
    app._scope.stop()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    for (const key of ['useRuntimeConfig', 'useNuxtApp', 'useCookie', 'useState', 'navigateTo', '$fetch', 'useFetch']) delete globalThis[key]
  })
  return { calls, cookies, states, navigations, app, cookieWrites, waitForCalls }
}

test('401 refresh follows API contract and replays a mutation once with its body and headers', async t => {
  const f = await fixture(t)
  assert.deepEqual(await useApi().$api('/protected?sort=recent', { method: 'POST', body: { name: 'New' }, headers: { 'X-Custom': 'kept' } }), { status: 200, data: { saved: true } })
  assert.deepEqual(f.calls.map(c => c.url), ['/protected?sort=recent', '/auth/refresh', '/protected?sort=recent'])
  assert.equal(f.calls[1].method, 'POST')
  assert.deepEqual(f.calls[1].body, { refreshToken: 'valid-refresh' })
  assert.equal(f.calls[1].authorization, undefined)
  assert.deepEqual(f.calls[2].body, { name: 'New' })
  assert.equal(f.calls[2].custom, 'kept')
  assert.equal(f.calls[2].authorization, 'Bearer fresh-access')
  assert.equal(f.cookies.auth_refresh_token.value, 'fresh-refresh')
  assert.deepEqual(f.navigations, [])
})

test('declarative fetch retries after refresh without reloading the page', async t => {
  const f = await fixture(t)
  assert.deepEqual(await useApiFetch('/protected'), { status: 200, data: { saved: true } })
  assert.equal(f.calls.length, 3)
  assert.equal(f.cookies.auth_token.value, 'fresh-access')
})

test('concurrent composable instances share a single refresh', async t => {
  let release
  const waitForRefresh = new Promise(resolve => { release = resolve })
  const f = await fixture(t, { waitForRefresh })
  const requests = [useApi().$api('/first'), useApi().$api('/second'), useApiFetch('/third')]
  const completed = Promise.all(requests)
  await f.waitForCalls(calls => calls.filter(c => c.authorization === 'Bearer expired-access').length === 3)
  release()
  await completed
  assert.equal(f.calls.filter(c => c.url === '/auth/refresh').length, 1)
  assert.equal(f.calls.filter(c => c.authorization === 'Bearer fresh-access').length, 3)
})

test('a late 401 for the old token reuses the token already refreshed', async t => {
  let release
  const waitForOldRequest = new Promise(resolve => { release = resolve })
  const f = await fixture(t, { waitForOldRequest })
  const late = useApi().$api('/late')
  await useApi().$api('/first')
  release()
  await late
  assert.equal(f.calls.filter(c => c.url === '/auth/refresh').length, 1)
})

test('login 401 does not refresh or destroy an existing session', async t => {
  const f = await fixture(t)
  await assert.rejects(useApi().$api('/auth/login', { method: 'POST', body: { email: 'test@example.com', password: 'wrong' } }), { statusCode: 401 })
  assert.equal(f.calls.length, 1)
  assert.equal(f.cookies.auth_token.value, 'expired-access')
  assert.deepEqual(f.navigations, [])
})

for (const refreshStatus of [401, 403]) {
  test(`refresh ${refreshStatus} clears token and private state and redirects`, async t => {
    const f = await fixture(t, { refreshStatus })
    await assert.rejects(useApi().$api('/protected'))
    assert.equal(f.calls.length, 2)
    assert.equal(f.cookies.auth_token.value, null)
    assert.equal(f.cookies.auth_refresh_token.value, null)
    for (const state of f.states.values()) assert.equal(state.value, null)
    assert.deepEqual(f.navigations, ['/login'])
  })
}

test('refresh 503 preserves the session and surfaces a retryable error', async t => {
  const f = await fixture(t, { refreshStatus: 503 })
  await assert.rejects(useApi().$api('/protected'), { statusCode: 503 })
  assert.equal(f.cookies.auth_token.value, 'expired-access')
  assert.equal(f.cookies.auth_refresh_token.value, 'valid-refresh')
  assert.deepEqual(f.navigations, [])
})

test('a failed refresh envelope never installs tokens even when HTTP transport succeeds', async t => {
  const f = await fixture(t, { refreshEnvelope: { status: 401, data: { access_token: 'bogus', refresh_token: 'bogus' } } })
  await assert.rejects(useApi().$api('/protected'))
  assert.equal(f.cookies.auth_token.value, null)
})

test('a second 401 stops after one replay and clears the invalid session', async t => {
  const f = await fixture(t, { alwaysUnauthorized: true })
  await assert.rejects(useApi().$api('/protected'), { statusCode: 401 })
  assert.equal(f.calls.length, 3)
  assert.equal(f.cookies.auth_token.value, null)
  assert.deepEqual(f.navigations, ['/login'])
})

test('an anonymous 401 does not redirect public pages', async t => {
  const f = await fixture(t)
  f.cookies.auth_token.value = null
  f.cookies.auth_refresh_token.value = null
  await assert.rejects(useApi().$api('/protected'), { statusCode: 401 })
  assert.equal(f.calls.length, 1)
  assert.deepEqual(f.navigations, [])
})

test('logout during refresh cannot restore a cleared session', async t => {
  let release
  const waitForRefresh = new Promise(resolve => { release = resolve })
  const f = await fixture(t, { waitForRefresh })
  const result = useApi().$api('/protected').catch(error => error)
  await f.waitForCalls(calls => calls.some(c => c.url === '/auth/refresh'))
  f.cookies.auth_token.value = null
  f.cookies.auth_refresh_token.value = null
  release()
  assert.equal((await result).statusCode, 401)
  assert.equal(f.cookies.auth_token.value, null)
  assert.equal(f.calls.length, 2)
})

test('cookies continue persisting after the first component using the session unmounts', async t => {
  const f = await fixture(t, { watchCookies: true })
  const firstPage = mountSetup(() => useApi())
  firstPage.unmount()
  await useApi().$api('/protected')
  await nextTick()
  assert.deepEqual(f.cookieWrites, [['auth_token', 'fresh-access'], ['auth_refresh_token', 'fresh-refresh']])
})

test('a delayed old-account request cannot replay after refresh followed by login as another account', async t => {
  let release
  const waitForOldRequest = new Promise(resolve => { release = resolve })
  const f = await fixture(t, { waitForOldRequest })
  const late = useApi().$api('/late', { method: 'POST', body: { name: 'Account A mutation' } }).catch(error => error)
  await useApi().$api('/first')
  f.cookies.auth_token.value = 'account-b-access'
  f.cookies.auth_refresh_token.value = 'account-b-refresh'
  release()
  assert.equal((await late).statusCode, 401)
  assert.equal(f.calls.filter(c => c.url === '/late').length, 1)
  assert.equal(f.cookies.auth_token.value, 'account-b-access')
  assert.deepEqual(f.navigations, [])
})

test('refresh accepts the unchanged refresh token returned by the Go backend', async t => {
  const f = await fixture(t, { nextRefreshToken: 'valid-refresh' })
  await useApi().$api('/protected')
  assert.equal(f.cookies.auth_token.value, 'fresh-access')
  assert.equal(f.cookies.auth_refresh_token.value, 'valid-refresh')
})

test('an incomplete successful refresh response preserves cookies and stops replay', async t => {
  const f = await fixture(t, { refreshEnvelope: { status: 200, data: { access_token: 'fresh-access' } } })
  await assert.rejects(useApi().$api('/protected'))
  assert.equal(f.calls.length, 2)
  assert.equal(f.cookies.auth_token.value, 'expired-access')
  assert.equal(f.cookies.auth_refresh_token.value, 'valid-refresh')
  assert.deepEqual(f.navigations, [])
})

test('separate Nuxt apps never share an in-flight refresh or token refs', async t => {
  let release
  const waitForRefresh = new Promise(resolve => { release = resolve })
  const f = await fixture(t, { waitForRefresh })
  const first = useApi().refreshAccessToken()
  const otherApp = { _scope: effectScope(true), runWithContext: fn => fn() }
  const otherCookies = { auth_token: ref('other-access'), auth_refresh_token: ref('other-refresh') }
  globalThis.useNuxtApp = () => otherApp
  globalThis.useCookie = name => otherCookies[name]
  const second = useApi().refreshAccessToken()
  const completed = Promise.all([first, second])
  await f.waitForCalls(calls => calls.filter(c => c.url === '/auth/refresh').length === 2)
  release()
  assert.deepEqual(await completed, [true, true])
  assert.deepEqual(f.calls.map(c => c.body.refreshToken).sort(), ['other-refresh', 'valid-refresh'])
  assert.equal(f.cookies.auth_token.value, 'fresh-access')
  assert.equal(otherCookies.auth_token.value, 'fresh-access')
  otherApp._scope.stop()
})

test('an account switch in a refresh completion callback prevents a waiting mutation from replaying', async t => {
  let release
  const waitForRefresh = new Promise(resolve => { release = resolve })
  const f = await fixture(t, { waitForRefresh })
  const api = useApi()
  const switchAccount = api.refreshAccessToken().then(() => {
    f.cookies.auth_token.value = 'account-b-access'
    f.cookies.auth_refresh_token.value = 'account-b-refresh'
  })
  const request = api.$api('/mutation', { method: 'POST', body: { name: 'Account A mutation' } }).catch(error => error)
  await f.waitForCalls(calls => calls.some(c => c.url === '/mutation'))
  // Allow the 401 handler to join the refresh promise before completing it.
  await new Promise(resolve => setImmediate(resolve))
  release()
  await switchAccount
  assert.equal((await request).statusCode, 401)
  assert.equal(f.calls.filter(c => c.url === '/mutation').length, 1)
  assert.equal(f.cookies.auth_token.value, 'account-b-access')
})
