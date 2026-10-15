import assert from 'node:assert/strict'
import test from 'node:test'
import { ref, nextTick } from 'vue'
import { mountSetup } from './helpers/frontend-runtime.mjs'

const applicationStates = new Map()
globalThis.useState ??= (key, init = () => null) => {
  if (!applicationStates.has(key)) applicationStates.set(key, ref(init()))
  return applicationStates.get(key)
}

const { ProjectService } = await import('../app/services/project.service.ts')
const { useMyProjectList } = await import('../app/composables/useMyProjectList.ts')
const settle = async () => { await nextTick(); await new Promise(resolve => setImmediate(resolve)); await nextTick() }
const batch = (ids, page, totalPages, ownerId = 'account-a') => ({
  status: 200, message: 'ok', data: ids.map(id => ({ id, owner_id: ownerId, my_scope: 'owned' })),
  meta: { page, limit: 100, total: ids.length, total_pages: totalPages }
})

test('progressive list loads one combined scope per page', async () => {
  const original = ProjectService.getMyProjectSummaries
  const requests = []
  ProjectService.getMyProjectSummaries = async ({ page }) => {
    requests.push(page)
    return page === 1
      ? {
          ...batch([], page, 2),
          data: [
            { id: 'owned-first', owner_id: 'account-a', my_scope: 'owned' },
            { id: 'initiated-only', owner_id: null, my_scope: 'initiated' },
            { id: 'member-project', owner_id: 'project-lead', my_scope: 'owned' }
          ]
        }
      : {
          ...batch([], page, 2),
          data: [
            { id: 'owned-second', owner_id: 'account-a', my_scope: 'owned' },
            { id: 'another-member-project', owner_id: 'project-lead', my_scope: 'owned' }
          ]
        }
  }
  const mounted = mountSetup(() => useMyProjectList(ref('account-a')))
  try {
    await settle()
    assert.deepEqual(mounted.bindings.projects.value.map(p => p.id).sort(), ['initiated-only', 'owned-first', 'owned-second'])
    assert.deepEqual(requests, [1, 2])
    assert.equal(mounted.bindings.loadingMore.value, false)
  } finally { mounted.unmount(); ProjectService.getMyProjectSummaries = original }
})

test('later-page failure keeps the first batch visible and a refresh can recover', async () => {
  const original = ProjectService.getMyProjectSummaries
  let fail = true
  ProjectService.getMyProjectSummaries = async ({ page }) => {
    if (page === 2 && fail) throw new Error('network unavailable')
    return batch([`project-${page}`], page, 2)
  }
  const mounted = mountSetup(() => useMyProjectList(ref('account-a')))
  try {
    await settle()
    assert.equal(mounted.bindings.pending.value, false)
    assert.equal(mounted.bindings.error.value, null)
    assert.equal(mounted.bindings.projects.value[0].id, 'project-1')
    assert.ok(mounted.bindings.loadMoreError.value)
    fail = false
    await mounted.bindings.refresh()
    assert.deepEqual(mounted.bindings.projects.value.map(p => p.id), ['project-1', 'project-2'])
    assert.equal(mounted.bindings.loadMoreError.value, null)
  } finally { mounted.unmount(); ProjectService.getMyProjectSummaries = original }
})

test('late responses from the previous account cannot repopulate a cleared list', async () => {
  const original = ProjectService.getMyProjectSummaries
  let release
  const oldResponse = new Promise(resolve => { release = resolve })
  const account = ref('account-a')
  ProjectService.getMyProjectSummaries = ({ page }) => account.value === 'account-a'
    ? oldResponse : Promise.resolve(batch(['account-b-project'], page, 1, 'account-b'))
  const mounted = mountSetup(() => useMyProjectList(account))
  try {
    account.value = 'account-b'
    await settle()
    release(batch(['account-a-project'], 1, 2))
    await settle()
    assert.deepEqual(mounted.bindings.projects.value.map(p => p.id), ['account-b-project'])
    account.value = null
    await settle()
    assert.deepEqual(mounted.bindings.projects.value, [])
    assert.equal(mounted.bindings.pending.value, false)
  } finally { release(batch([], 1, 1)); mounted.unmount(); ProjectService.getMyProjectSummaries = original }
})

test('list excludes active contributor projects while retaining the users own and unclaimed initiated projects', async () => {
  const original = ProjectService.getMyProjectSummaries
  ProjectService.getMyProjectSummaries = async () => ({
    status: 200,
    message: 'ok',
    data: [
      { id: 'owned-project', owner_id: 'account-a', my_scope: 'owned' },
      { id: 'unclaimed-initiative', owner_id: null, my_scope: 'initiated' },
      { id: 'accepted-contributor-project', owner_id: 'another-lead', my_scope: 'owned' },
      { id: 'claimed-by-another-lead', owner_id: 'another-lead', my_scope: 'initiated' }
    ],
    meta: { page: 1, limit: 100, total: 4, total_pages: 1 }
  })
  const mounted = mountSetup(() => useMyProjectList(ref('account-a')))
  try {
    await settle()
    assert.deepEqual(
      mounted.bindings.projects.value.map(project => project.id).sort(),
      ['owned-project', 'unclaimed-initiative']
    )
  } finally { mounted.unmount(); ProjectService.getMyProjectSummaries = original }
})

test('unmount prevents a pending response from writing state or fetching later pages', async () => {
  const original = ProjectService.getMyProjectSummaries
  let release
  const response = new Promise(resolve => { release = resolve })
  const requests = []
  ProjectService.getMyProjectSummaries = ({ page }) => { requests.push(page); return response }
  const mounted = mountSetup(() => useMyProjectList(ref('account-a')))
  mounted.unmount()
  try {
    release(batch(['late-project'], 1, 3))
    await settle()
    assert.deepEqual(mounted.bindings.projects.value, [])
    assert.deepEqual(requests, [1])
  } finally { ProjectService.getMyProjectSummaries = original }
})
