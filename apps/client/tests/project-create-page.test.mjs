import assert from 'node:assert/strict'
import test from 'node:test'
import { effectScope, nextTick, ref } from 'vue'
import { mountSetup } from './helpers/frontend-runtime.mjs'

test('create loader retries failed onboarding and reflects refreshed grants without discarding editor context', async () => {
  const account = ref({ id: 'account-a', systemRole: 'admin', emailVerifiedAt: '2026-10-08', initiableOrganizations: [{ id: 'organization-a', name: 'Community A' }] })
  let failStatus = true
  globalThis.useAuth = () => ({ user: account, fetchCurrentUser: async () => account.value })
  globalThis.useProfile = () => ({ checkOnboardingStatus: async (_force, options) => {
    assert.equal(options.throwOnError, true)
    if (failStatus) throw new Error('Temporary outage')
    return true
  } })
  globalThis.definePageMeta = () => {}
  globalThis.useHead = () => {}
  globalThis.useRuntimeConfig = () => ({ public: { apiBaseUrl: 'http://localhost' } })
  globalThis.useCookie = () => ({ value: null })
  const app = { _scope: effectScope(true), runWithContext: fn => fn() }
  globalThis.useNuxtApp = () => app
  const { default: Page } = await import('../app/pages/projects/create.vue')
  const mounted = mountSetup(() => Page.setup({}, { expose() {} }))
  const vm = mounted.bindings
  try {
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(vm.failed.value, true)
    assert.equal(vm.creationContext.value, null)
    assert.equal(vm.contextAvailable.value, false)
    failStatus = false
    await vm.loadContext()
    assert.equal(vm.contextAvailable.value, true)
    assert.equal(vm.creationContext.value.system_role, 'admin')
    assert.equal(vm.creationContext.value.initiable_organizations.length, 1)
    account.value = { ...account.value, systemRole: 'user' }
    await nextTick()
    assert.deepEqual(vm.creationContext.value.initiable_organizations, [])
    assert.equal(vm.creationContext.value.system_role, 'user')
    assert.equal(vm.contextAvailable.value, true)
    failStatus = true
    await vm.loadContext()
    assert.notEqual(vm.creationContext.value, null)
    assert.equal(vm.contextAvailable.value, false)
  } finally {
    mounted.unmount()
    for (const key of ['useAuth', 'useProfile', 'definePageMeta', 'useHead', 'useRuntimeConfig', 'useCookie', 'useNuxtApp']) delete globalThis[key]
  }
})
