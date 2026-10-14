import assert from 'node:assert/strict'
import test from 'node:test'
import { computed, nextTick, ref } from 'vue'
import { mountSetup } from './helpers/frontend-runtime.mjs'

const { useMyProjectList } = await import('../app/composables/useMyProjectList.ts')
const { useMyApplications } = await import('../app/composables/useMyApplications.ts')
const { useProjectApplicants } = await import('../app/composables/useProjectApplicants.ts')
const { serializeApplicationQuery } = await import('../app/services/application.service.ts')
const flush = async () => { await nextTick(); await new Promise(resolve => setImmediate(resolve)); await nextTick() }
const paginated = { status: 200, data: [], meta: { page: 1, limit: 6, total: 0, total_pages: 0 } }

test('application search is serialized using the semantic search query parameter', () => {
  const params = new URLSearchParams(serializeApplicationQuery({ search: '  kolaboria  ', page: 1 }))
  assert.equal(params.get('search'), 'kolaboria')
  assert.equal(params.has('q'), false)
})

test('my projects sends the SearchField value to the server using search', async t => {
  const originals = Object.fromEntries(['useState'].map(key => [key, globalThis[key]]))
  const states = new Map()
  globalThis.useState = (key, init = () => null) => { if (!states.has(key)) states.set(key, ref(init())); return states.get(key) }
  const { ProjectService } = await import('../app/services/project.service.ts')
  const original = ProjectService.getMyProjectSummaries
  const calls = []
  ProjectService.getMyProjectSummaries = async query => { calls.push(query); return { ...paginated, meta: { ...paginated.meta, page: query.page } } }
  const accountId = ref('account-a')
  const search = ref({ search: undefined })
  const mounted = mountSetup(() => useMyProjectList(accountId, search))
  try {
    await flush()
    assert.deepEqual(calls.map(({ search }) => search), [undefined])
    search.value = { search: 'kolaboria' }
    await flush()
    assert.deepEqual(calls.map(({ search }) => search), [undefined, 'kolaboria'])
  } finally {
    mounted.unmount()
    ProjectService.getMyProjectSummaries = original
    for (const [key, value] of Object.entries(originals)) value === undefined ? delete globalThis[key] : globalThis[key] = value
  }
})

test('my applications loads the debounced search without refetching its summary', async t => {
  const states = new Map()
  globalThis.useState = (key, init = () => null) => { if (!states.has(key)) states.set(key, ref(init())); return states.get(key) }
  const calls = []
  const gateway = {
    getMyApplicationSummary: async () => ({ status: 200, data: { stats: { total: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 } } }),
    getMyApplications: async query => { calls.push(query); return paginated },
    getApplicationDetail: async () => ({ status: 200, data: null }),
    withdrawApplication: async () => ({ status: 200, data: null })
  }
  const accountId = ref('account-a')
  const searchText = ref('')
  const query = computed(() => ({ search: searchText.value || undefined, sort: 'newest' }))
  const mounted = mountSetup(() => useMyApplications(accountId, query, gateway))
  try {
    await flush()
    searchText.value = 'proyek pilihan'
    await flush()
    assert.equal(calls.length, 2)
    assert.equal(calls[1].search, 'proyek pilihan')
  } finally { mounted.unmount(); delete globalThis.useState }
})

test('applicant management sends SearchField values to the server', async t => {
  const states = new Map()
  globalThis.useState = (key, init = () => null) => { if (!states.has(key)) states.set(key, ref(init())); return states.get(key) }
  const calls = []
  const gateway = {
    getApplicantSummary: async () => ({ status: 200, data: { stats: { total: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 }, capacity: { total_capacity: 0, filled_capacity: 0, remaining_capacity: 0 }, roles: [] } }),
    getProjectApplicants: async (_project, query) => { calls.push(query); return paginated },
    getApplicationDetail: async () => ({ status: 200, data: null }),
    reviewApplication: async () => ({ status: 200, data: null })
  }
  const accountId = ref('account-a')
  const projectId = ref('project-a')
  const searchText = ref('')
  const query = computed(() => ({ search: searchText.value || undefined, sort: 'newest' }))
  const mounted = mountSetup(() => useProjectApplicants(accountId, projectId, query, gateway))
  try {
    await flush()
    searchText.value = 'nama pelamar'
    await flush()
    assert.equal(calls.length, 2)
    assert.equal(calls[1].search, 'nama pelamar')
  } finally { mounted.unmount(); delete globalThis.useState }
})
