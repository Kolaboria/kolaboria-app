import assert from 'node:assert/strict'
import { createRequire, registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'
import { effectScope } from 'vue'

const nuxtRequire = createRequire(import.meta.resolve('nuxt/package.json'))

// Use the project's compiler; no extra test runtime or dependencies required.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (specifier === 'defu') return nextResolve(pathToFileURL(nuxtRequire.resolve(specifier)).href, context)
      if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context)
      }
      throw error
    }
  },
  load(url, context, nextLoad) {
    if (!url.endsWith('.ts')) return nextLoad(url, context)
    return {
      format: 'module',
      shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), 'utf8').replaceAll('import.meta.env.PROD', 'false'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
      }).outputText
    }
  }
})

const errors = await import('../app/utils/error.ts')

test('known auth failures provide actionable Indonesian copy without token jargon', () => {
  for (const [input, expected] of [
    ['invalid credentials', /email.*kata sandi/i],
    ['email already registered', /email.*terdaftar/i],
    ['token has expired', /tautan.*kedaluwarsa/i],
    ['token is invalid', /tautan.*minta tautan baru/i],
    ['account is inactive', /hubungi tim/i]
  ]) {
    const message = errors.getApiErrorMessage({ status: 400, data: { message: input } })
    assert.match(message, expected)
    assert.doesNotMatch(message, /token|invalid|credentials|inactive|expired/i)
  }
  const spoof = errors.getApiErrorMessage({ status: 500, data: { status: 400, message: 'invalid credentials' } })
  assert.match(spoof, /layanan.*kendala/i)
  assert.doesNotMatch(spoof, /email/i)
})

test('malformed payloads and prototype keys fall back safely', () => {
  for (const input of [null, undefined, 500, 'SQLSTATE secret', {},
    { data: { message: 42 } }, { data: { message: ['database'] } },
    { message: 'constructor' }, { message: '__proto__' }, { status: 'database' }]) {
    assert.equal(errors.getApiErrorMessage(input, 'Belum bisa menyimpan profil.'), 'Belum bisa menyimpan profil.')
  }
})

test('network and timeout errors guide users to a next step', () => {
  assert.match(errors.getApiErrorMessage(new TypeError('Failed to fetch')), /koneksi internet/i)
  assert.match(errors.getApiErrorMessage({ cause: new TypeError('Failed to fetch') }), /koneksi internet/i)
  assert.match(errors.getApiErrorMessage({ cause: { name: 'TimeoutError' } }), /waktu lebih lama/i)
})

test('safe transport errors retain status, trace and cause without rendering raw validation', () => {
  const original = { statusCode: 422, data: {
    message: 'SQLSTATE 23514', data: { trace_id: 'trace-123' },
    errors: { email: ['internal validation'], verificationResendAvailableAt: '2026-10-04T12:00:00Z' }
  } }
  const safe = errors.toUserFacingError(original)
  assert.equal(safe.statusCode, 422)
  assert.equal(safe.data.data.trace_id, 'trace-123')
  assert.equal(safe.cause, original)
  assert.equal(safe.verificationResendAvailableAt, '2026-10-04T12:00:00Z')
  assert.doesNotMatch(JSON.stringify(safe), /SQLSTATE|internal validation/)
  assert.equal(errors.toUserFacingError(safe), safe)
  assert.equal(errors.getApiErrorMessage(safe), safe.message)
  assert.equal(errors.getApiErrorMessage({ statusCode: 422, data: safe.data }), safe.message)
})

test('error pages describe missing, inaccessible and failed pages without technical copy', () => {
  const missing = errors.getErrorPageContent({ statusCode: 404, message: 'Not Found' })
  const failure = errors.getErrorPageContent({ statusCode: 500, message: 'database failure' })
  assert.notEqual(missing.title, failure.title)
  assert.match(errors.getErrorPageContent({ statusCode: 403 }).message, /akses/i)
  for (const input of [404, 500, 403, undefined]) {
    const content = errors.getErrorPageContent({ statusCode: input, message: 'SQLSTATE' })
    assert.doesNotMatch(`${content.title} ${content.message}`, /404|500|403|SQLSTATE|not found|database/i)
  }
})

test('actual HTTP failures and refresh retries produce safe action errors', async () => {
  const { ofetch } = await import(pathToFileURL(nuxtRequire.resolve('ofetch')).href)
  const { useApi, useApiFetch } = await import('../app/composables/useApi.ts')
  let protectedRequests = 0
  const authorizations = []
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json')
    if (request.url === '/auth/refresh') {
      response.end(JSON.stringify({ status: 200, data: { access_token: 'new-access', refresh_token: 'new-refresh' } }))
    } else if (request.url === '/protected') {
      authorizations.push(request.headers.authorization)
      response.statusCode = ++protectedRequests === 1 ? 401 : 500
      response.end(JSON.stringify({ status: response.statusCode, message: 'database secret' }))
    } else if (request.url === '/success') {
      response.end(JSON.stringify({ status: 200, data: { name: 'Fahmi' } }))
    } else if (request.url === '/envelope') {
      response.end(JSON.stringify({ status: 500, message: 'database secret', data: { trace_id: 'envelope-trace' } }))
    } else if (request.url === '/disconnect') {
      request.socket.destroy()
    } else {
      response.statusCode = 404
      response.end(JSON.stringify({ status: 404, message: 'record not found in database', data: { trace_id: 'http-trace' } }))
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const cookies = { auth_token: { value: 'old-access' }, auth_refresh_token: { value: 'old-refresh' } }
  globalThis.useRuntimeConfig = () => ({ public: { apiBaseUrl: `http://127.0.0.1:${server.address().port}` } })
  globalThis.useCookie = name => cookies[name]
  const app = { _scope: effectScope(true), runWithContext: fn => fn() }
  const states = new Map()
  globalThis.useNuxtApp = () => app
  globalThis.useState = (key, init = () => null) => { if (!states.has(key)) states.set(key, { value: init() }); return states.get(key) }
  globalThis.$fetch = ofetch.create({ retry: 0 })
  globalThis.useFetch = (request, options) => (options.$fetch ?? ofetch)(request, { ...options, retry: 0 })
  globalThis.navigateTo = () => {}
  try {
    const { $api } = useApi()
    assert.deepEqual(await $api('/success'), { status: 200, data: { name: 'Fahmi' } })
    await assert.rejects($api('/envelope'), error => {
      assert.equal(error.statusCode, 500)
      assert.equal(error.data.data.trace_id, 'envelope-trace')
      assert.doesNotMatch(error.message, /database|secret|500/i)
      return true
    })
    await assert.rejects($api('/missing'), error => {
      assert.equal(error.statusCode, 404)
      assert.equal(error.data.data.trace_id, 'http-trace')
      assert.doesNotMatch(error.message, /record|database|404|not found/i)
      return true
    })
    await assert.rejects($api('/protected'), error => {
      assert.equal(error.statusCode, 500)
      assert.match(error.message, /layanan.*kendala/i)
      assert.doesNotMatch(error.message, /database|secret|500/i)
      return true
    })
    assert.deepEqual(authorizations, ['Bearer old-access', 'Bearer new-access'])
    assert.equal(cookies.auth_refresh_token.value, 'new-refresh')
    for (const request of ['/missing', '/envelope']) {
      await assert.rejects(useApiFetch(request), error => {
        assert.ok(error instanceof errors.UserFacingError)
        assert.doesNotMatch(error.message, /record|database|secret|404|500|not found/i)
        return true
      })
    }
    await assert.rejects(useApiFetch('/disconnect'), error => {
      assert.match(error.message, /koneksi internet/i)
      return true
    })
  } finally {
    await new Promise(resolve => server.close(resolve))
    for (const name of ['useRuntimeConfig', 'useCookie', 'useNuxtApp', 'useState', '$fetch', 'useFetch', 'navigateTo']) delete globalThis[name]
  }
})

test('unknown exceptions and backend validation never become visible copy', () => {
  for (const error of [
    new Error('database connection failed: password=secret'),
    { status: 404, data: { message: 'record not found in profiles' } },
    { status: 422, data: { message: "Key: 'Request.Email' failed on the 'required' tag" } },
    { status: 409, data: { message: 'duplicate key value violates unique constraint' } },
    { data: { message: '<html>502 Bad Gateway</html>' } },
    { message: '[GET] http://localhost:8080: 500 Internal Server Error' }
  ]) {
    const message = errors.getApiErrorMessage(error)
    assert.doesNotMatch(message, /database|password=|record|profiles|required|constraint|<html>|gateway|localhost|500|422/i)
    assert.ok(message.length > 0)
  }
})
