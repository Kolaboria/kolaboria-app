import assert from 'node:assert/strict'
import test from 'node:test'
import { nextTick, ref } from 'vue'
import { mountSetup } from './helpers/frontend-runtime.mjs'

const { createProjectLifecycleApi } = await import('../app/composables/useProjectLifecycleApi.ts')
const { useProjectLifecycle } = await import('../app/composables/useProjectLifecycle.ts')
const { isProjectDefinitionEditableBy } = await import('../app/utils/project-presentation.ts')
const target = { id: 'project-a', title: 'Proyek A', status: 'open', version: 3 }
const detail = { ...target, status: 'draft', version: 4 }
const flush = async () => { await nextTick(); await new Promise(resolve => setImmediate(resolve)) }

test('lifecycle API sends versioned status and draft delete requests', async () => {
  const calls = []
  const api = createProjectLifecycleApi(async (path, options) => {
    calls.push({ path, options })
    return { status: 200, data: options.method === 'PATCH' ? detail : undefined }
  })
  assert.deepEqual(await api.changeStatus('project-a', { status: 'draft', version: 3 }), detail)
  await api.deleteDraft('project-a', { version: 4 })
  assert.deepEqual(calls, [
    { path: '/projects/project-a/status', options: { method: 'PATCH', body: { status: 'draft', version: 3 } } },
    { path: '/projects/project-a', options: { method: 'DELETE', body: { version: 4 } } }
  ])
})

test('lifecycle confirmation submits once and refreshes only after success', async () => {
  const accountId = ref('owner-a')
  let resolve
  const calls = []
  const changed = []
  const mounted = mountSetup(() => useProjectLifecycle({
    accountId,
    gateway: { changeStatus: (...args) => { calls.push(args); return new Promise(done => { resolve = done }) } },
    onChanged: (...args) => changed.push(args)
  }))
  try {
    const state = mounted.bindings
    state.request('draft', target)
    const first = state.confirm()
    await state.confirm()
    state.close()
    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0], ['project-a', { status: 'draft', version: 3 }])
    assert.equal(state.target.value.id, 'project-a')
    assert.equal(changed.length, 0)
    resolve(detail)
    await first
    assert.equal(state.target.value, null)
    assert.equal(changed[0][0], 'draft')
  } finally { mounted.unmount() }
})

test('failed draft transition preserves the confirmation and never reports success', async () => {
  const accountId = ref('owner-a')
  let changed = false
  const mounted = mountSetup(() => useProjectLifecycle({ accountId,
    gateway: { changeStatus: async () => { throw Object.assign(new Error('Proyek memiliki riwayat lamaran.'), { statusCode: 409 }) } },
    onChanged: () => { changed = true }
  }))
  try {
    const state = mounted.bindings
    state.request('draft', target)
    await state.confirm()
    assert.equal(state.target.value.id, 'project-a')
    assert.equal(state.pending.value, false)
    assert.match(state.errorMessage.value, /riwayat lamaran/)
    assert.equal(changed, false)
  } finally { mounted.unmount() }
})

test('account changes discard stale mutation callbacks', async () => {
  const accountId = ref('owner-a')
  let resolve
  let changed = false
  const mounted = mountSetup(() => useProjectLifecycle({ accountId,
    gateway: { deleteDraft: () => new Promise(done => { resolve = done }) },
    onChanged: () => { changed = true }
  }))
  try {
    const state = mounted.bindings
    state.request('delete', { ...target, status: 'draft' })
    const pending = state.confirm()
    accountId.value = 'owner-b'
    await flush()
    resolve()
    await pending
    assert.equal(changed, false)
    assert.equal(state.target.value, null)
  } finally { mounted.unmount() }
})

test('claimed organization editing follows its owner instead of its creator', () => {
  const project = { status: 'draft', creation_mode: 'organization_initiated', owner_id: 'owner-b', creator_id: 'creator-a', initiator_organization_id: 'organization-a' }
  assert.equal(isProjectDefinitionEditableBy(project, { id: 'owner-b' }), true)
  assert.equal(isProjectDefinitionEditableBy(project, { id: 'creator-a', initiableOrganizations: [{ id: 'organization-a' }] }), false)
})

test('claimed organization draft can be republished by its lead without initiation permissions', async () => {
  const { useProjectEditor } = await import('../app/composables/useProjectEditor.ts')
  const { createProjectEditorFixture, createProjectEditorReferences } = await import('./helpers/project-editor-fixtures.ts')
  const { toProjectDefinition, toProjectEditorRecord } = await import('../app/utils/project-editor-api.ts')
  const record = createProjectEditorFixture('platform-portofolio-talenta-digital')
  record.status = 'draft'
  record.version = 4
  record.ownership = { created_by_user_id: 'creator-a', owner_id: 'lead-b', initiator_organization_id: 'bc9e7805-6000-4e0e-9d00-95fc8b85fe6a' }
  Object.assign(record.draft, { creation_mode: 'organization_initiated', initiator_organization_id: record.ownership.initiator_organization_id,
    owner_commitment: '', owner_contribution_role_id: undefined, lead_expectations: 'Memimpin diskusi dan seleksi kontributor.' })
  const definition = toProjectDefinition(record.draft)
  const ownerRole = createProjectEditorReferences().contribution_roles[0]
  const published = { ...definition, id: record.id, slug: record.slug, status: 'open', version: 5,
    created_at: record.saved_at, updated_at: record.saved_at, published_at: record.saved_at, ownership: record.ownership,
    owner_role: { contribution_role_id: ownerRole.id, contribution_role: ownerRole }, viewer_application: null, roles: definition.roles.map((role, index) => ({ ...role, id: role.id ?? `role-${index}`,
      position: index, filled_capacity: 0, remaining_capacity: role.capacity, status: 'open', skills: [], tools: [] })) }
  const returnedDraft = toProjectEditorRecord({ ...published, status: 'draft', version: 4, published_at: null })
  const mounted = mountSetup(() => useProjectEditor({ mode: 'edit', currentUserId: 'lead-b', initialRecord: returnedDraft,
    references: createProjectEditorReferences(), eligibility: { email_verified: true, onboarding_completed: true },
    creationContext: { system_role: 'user', initiable_organizations: [] }, persistence: { publish: async () => published } }))
  try {
    assert.equal(mounted.bindings.canPublish.value, true)
    assert.equal(await mounted.bindings.publish(), true)
    assert.equal(mounted.bindings.record.value.status, 'open')
    assert.equal(mounted.bindings.record.value.ownership.owner_id, 'lead-b')
  } finally { mounted.unmount() }
})
