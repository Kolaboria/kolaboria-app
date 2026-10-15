import assert from 'node:assert/strict'
import test from 'node:test'

import { mountSetup } from './helpers/frontend-runtime.mjs'

const { useProjectEditor } = await import('../app/composables/useProjectEditor.ts')
const { createProjectEditorFixture, createProjectEditorReferences } = await import('./helpers/project-editor-fixtures.ts')
const { createProjectEditorTestPersistence } = await import('./helpers/project-editor-persistence.ts')

const memoryStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    keys: () => [...values.keys()]
  }
}

const createEditor = (options = {}) => {
  const { delayMs = 0, ...editorOptions } = options
  return mountSetup(() => useProjectEditor({
    mode: 'create',
    currentUserId: 'user-a',
    references: createProjectEditorReferences(),
    persistence: editorOptions.persistence ?? createProjectEditorTestPersistence({ delayMs }),
    ...editorOptions
  }))
}

test('create navigation remains sequential while edit navigation can visit any section', () => {
  const create = createEditor()
  const edit = createEditor({
    mode: 'edit',
    slug: 'platform-portofolio-talenta-digital',
    initialRecord: createProjectEditorFixture('platform-portofolio-talenta-digital')
  })

  assert.equal(create.bindings.goToStep(3), false)
  assert.equal(edit.bindings.goToStep(3), true)
  assert.equal(edit.bindings.currentStep.value, 3)
  create.unmount()
  edit.unmount()
})

test('leaving client origin resets its owner acknowledgement', () => {
  const editor = createEditor({
    initialDraft: {
      ...createProjectEditorFixture('platform-portofolio-talenta-digital').draft,
      origin: 'client',
      client_acknowledgement: true
    }
  })

  editor.bindings.setOrigin('community')
  assert.equal(editor.bindings.draft.value.client_acknowledgement, false)
  editor.unmount()
})

test('editing loaded data is dirty until a successful server save replaces the baseline', async () => {
  const editor = createEditor({
    mode: 'edit',
    slug: 'platform-portofolio-talenta-digital',
    initialRecord: createProjectEditorFixture('platform-portofolio-talenta-digital')
  })
  const vm = editor.bindings

  assert.equal(vm.isDirty.value, false)
  vm.draft.value.title = 'Judul proyek diperbarui'
  assert.equal(vm.isDirty.value, true)
  await vm.saveChanges()
  assert.equal(vm.isDirty.value, false)
  assert.equal(vm.record.value.draft.title, 'Judul proyek diperbarui')
  editor.unmount()
})

test('editor uses the current server version from the loaded project', () => {
  const detail = createProjectEditorFixture('platform-portofolio-talenta-digital')
  detail.version = 7
  const editor = createEditor({
    mode: 'edit', slug: detail.slug, initialRecord: detail
  })

  assert.equal(editor.bindings.record.value?.version, 7)
  editor.unmount()
})

test('an incomplete draft can be saved without publication eligibility', async () => {
  const fixture = createProjectEditorFixture('platform-portofolio-talenta-digital')
  const incomplete = {
    ...fixture.draft,
    summary: '',
    description: '',
    roles: [{ ...fixture.draft.roles[0], contribution_role_id: undefined, description: '', skill_ids: [] }],
    why_collaborative: '',
    contributor_outcome: '',
    owner_commitment: '',
    collaboration_agreement: false
  }
  const requests = []
  const persistence = {
    create: async request => {
      requests.push(structuredClone(request))
      const definition = request.definition
      return {
        ...definition,
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        status: 'draft',
        version: 1,
        created_at: '2026-10-08T00:00:00.000Z',
        updated_at: '2026-10-08T00:01:00.000Z',
        published_at: null,
        ownership: {
          created_by_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          initiator_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          initiator_organization_id: null,
          owner_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          show_initiator: false,
          can_accept_contributors: false
        },
        owner_role: null,
        roles: definition.roles.map((role, index) => ({
          ...role,
          id: `cccccccc-cccc-4ccc-8ccc-${String(index + 1).padStart(12, '0')}`,
          contribution_role: null,
          position: index,
          skills: [],
          tools: [],
          filled_capacity: 0,
          remaining_capacity: role.capacity,
          status: 'open'
        }))
      }
    },
    update: async () => { throw new Error('not used') },
    publish: async () => { throw new Error('not used') },
    loadBySlug: async () => { throw new Error('not used') }
  }
  const editor = createEditor({
    initialDraft: incomplete,
    persistence,
    eligibility: { email_verified: false, onboarding_completed: false },
    storage: null
  })

  assert.equal(await editor.bindings.saveDraft(), true)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].definition.summary, '')
  assert.equal(requests[0].definition.collaboration_agreement, false)
  editor.unmount()
})

test('publishing persists the project and locks duplicate submissions', async () => {
  const fixture = createProjectEditorFixture('platform-portofolio-talenta-digital')
  const editor = createEditor({
    initialDraft: fixture.draft,
    delayMs: 20,
    eligibility: { email_verified: true, onboarding_completed: true }
  })
  const pending = editor.bindings.publish()
  assert.equal(editor.bindings.isSubmitting.value, true)
  await editor.bindings.publish()
  await pending

  assert.equal(editor.bindings.record.value.status, 'open')
  assert.equal(editor.bindings.saveResult.value.message, 'Proyek berhasil dipublikasikan.')
  editor.unmount()
})

test('publishing a new project sends one publish request without creating a draft', async () => {
  const fixture = createProjectEditorFixture('platform-portofolio-talenta-digital')
  const base = createProjectEditorTestPersistence({ currentUserId: 'internal-a' })
  const requests = []
  const persistence = {
    ...base,
    create: async (request) => {
      requests.push('draft')
      return base.create(request)
    },
    publishNew: async (request) => {
      requests.push('publish')
      const draft = await base.create(request)
      return base.publish(draft.id, { version: draft.version })
    }
  }
  const editor = createEditor({
    initialDraft: fixture.draft,
    eligibility: { email_verified: true, onboarding_completed: true },
    persistence
  })

  assert.equal(await editor.bindings.publish(), true)
  assert.deepEqual(requests, ['publish'])
  assert.equal(editor.bindings.record.value.status, 'open')
  editor.unmount()
})

test('saving a new draft calls only the draft endpoint', async () => {
  const fixture = createProjectEditorFixture('platform-portofolio-talenta-digital')
  const base = createProjectEditorTestPersistence({ currentUserId: 'internal-a' })
  const requests = []
  const persistence = {
    ...base,
    create: async (request) => {
      requests.push('draft')
      return base.create(request)
    },
    publishNew: async (request) => {
      requests.push('publish')
      return base.publishNew(request)
    }
  }
  const editor = createEditor({ initialDraft: fixture.draft, persistence })

  assert.equal(await editor.bindings.saveDraft(), true)
  assert.deepEqual(requests, ['draft'])
  assert.equal(editor.bindings.record.value.status, 'draft')
  editor.unmount()
})

test('edit mode publishes a saved draft only after saving its latest definition', async () => {
  const fixture = createProjectEditorFixture('platform-portofolio-talenta-digital')
  const updateRequests = []
  const publishVersions = []
  const detailFrom = (definition, version, status = 'draft') => ({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    slug: definition.slug,
    status,
    version,
    created_at: '2026-10-08T00:00:00.000Z',
    updated_at: '2026-10-08T00:01:00.000Z',
    published_at: status === 'draft' ? null : '2026-10-08T00:01:00.000Z',
    ...definition,
    ownership: {
      created_by_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      initiator_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      initiator_organization_id: null,
      owner_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      show_initiator: false,
      can_accept_contributors: status === 'open'
    },
    owner_role: null,
    roles: definition.roles.map((role, index) => ({
      ...role,
      id: role.id || `cccccccc-cccc-4ccc-8ccc-${String(index + 1).padStart(12, '0')}`,
      contribution_role: null,
      position: index,
      skills: [],
      tools: [],
      filled_capacity: 0,
      remaining_capacity: role.capacity,
      status: 'open'
    }))
  })
  const persistence = {
    create: async () => { throw new Error('edit publishing must not create a project') },
    update: async (_id, request) => {
      updateRequests.push(structuredClone(request))
      return detailFrom(request.definition, request.version + 1)
    },
    publish: async (_id, request) => {
      publishVersions.push(request.version)
      return detailFrom(updateRequests.at(-1).definition, request.version + 1, 'open')
    },
    loadBySlug: async () => { throw new Error('not used') }
  }
  const editor = createEditor({
    mode: 'edit',
    slug: fixture.slug,
    initialRecord: { ...fixture, status: 'draft' },
    persistence,
    eligibility: { email_verified: true, onboarding_completed: true },
    storage: null
  })
  editor.bindings.draft.value.title = 'Judul terbaru sebelum publikasi'

  assert.equal(await editor.bindings.publish(), true)
  assert.equal(updateRequests.length, 1)
  assert.equal(updateRequests[0].definition.title, 'Judul terbaru sebelum publikasi')
  assert.deepEqual(publishVersions, [2])
  assert.equal(editor.bindings.record.value.status, 'open')
  assert.equal(editor.bindings.isDirty.value, false)
  editor.unmount()
})

test('publish retry reuses the idempotent direct-publish request after a timeout', async () => {
  const fixture = createProjectEditorFixture('platform-portofolio-talenta-digital')
  const pendingCreateStorage = memoryStorage()
  const publishRequests = []
  let publishAttempt = 0
  const detailFrom = (definition, version, status = 'draft') => ({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    slug: definition.slug,
    status,
    version,
    created_at: '2026-10-08T00:00:00.000Z',
    updated_at: '2026-10-08T00:01:00.000Z',
    published_at: status === 'draft' ? null : '2026-10-08T00:01:00.000Z',
    ...definition,
    ownership: {
      created_by_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      initiator_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      initiator_organization_id: null,
      owner_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      show_initiator: false,
      can_accept_contributors: status === 'open'
    },
    owner_role: null,
    roles: definition.roles.map((role, index) => ({
      ...role,
      id: role.id || `cccccccc-cccc-4ccc-8ccc-${String(index + 1).padStart(12, '0')}`,
      contribution_role: null,
      position: index,
      skills: [],
      tools: [],
      filled_capacity: 0,
      remaining_capacity: role.capacity,
      status: 'open'
    }))
  })
  const persistence = {
    create: async () => { throw new Error('publish must not create a draft') },
    publishNew: async (request) => {
      publishRequests.push(structuredClone(request))
      publishAttempt += 1
      if (publishAttempt === 1) throw new Error('request timed out')
      return detailFrom(request.definition, 1, 'open')
    },
    update: async () => { throw new Error('publish retry must not update a draft') },
    publish: async () => { throw new Error('publish must use atomic create-and-publish') },
    loadBySlug: async () => { throw new Error('not used') }
  }
  const editor = createEditor({
    initialDraft: fixture.draft,
    persistence,
    eligibility: { email_verified: true, onboarding_completed: true },
    storage: null,
    pendingCreateStorage
  })

  assert.equal(await editor.bindings.publish(), false)
  editor.unmount()

  const reloaded = createEditor({
    persistence,
    eligibility: { email_verified: true, onboarding_completed: true },
    storage: null,
    pendingCreateStorage
  })
  assert.equal(reloaded.bindings.draft.value.title, fixture.draft.title)
  assert.equal(await reloaded.bindings.publish(), true)

  assert.equal(publishRequests.length, 2)
  assert.deepEqual(publishRequests[1], publishRequests[0])
  assert.equal(reloaded.bindings.record.value.draft.title, fixture.draft.title)
  assert.equal(reloaded.bindings.isDirty.value, false)
  reloaded.unmount()
})

test('draft save retry persists edits made after a timed-out create before reporting success', async () => {
  const fixture = createProjectEditorFixture('platform-portofolio-talenta-digital')
  const pendingCreateStorage = memoryStorage()
  const createRequests = []
  const updateRequests = []
  let createAttempt = 0
  const detailFrom = (definition, version) => ({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    slug: definition.slug,
    status: 'draft',
    version,
    created_at: '2026-10-08T00:00:00.000Z',
    updated_at: '2026-10-08T00:01:00.000Z',
    published_at: null,
    ...definition,
    ownership: {
      created_by_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      initiator_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      initiator_organization_id: null,
      owner_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      show_initiator: false,
      can_accept_contributors: false
    },
    owner_role: null,
    roles: definition.roles.map((role, index) => ({
      ...role,
      id: role.id || `cccccccc-cccc-4ccc-8ccc-${String(index + 1).padStart(12, '0')}`,
      contribution_role: null,
      position: index,
      skills: [],
      tools: [],
      filled_capacity: 0,
      remaining_capacity: role.capacity,
      status: 'open'
    }))
  })
  const persistence = {
    create: async request => {
      createRequests.push(structuredClone(request))
      createAttempt += 1
      if (createAttempt === 1) throw new Error('request timed out')
      return detailFrom(request.definition, 1)
    },
    update: async (_id, request) => {
      updateRequests.push(structuredClone(request))
      return detailFrom(request.definition, request.version + 1)
    },
    publish: async () => { throw new Error('not used') },
    loadBySlug: async () => { throw new Error('not used') }
  }
  const first = createEditor({ initialDraft: fixture.draft, persistence, storage: null, pendingCreateStorage })
  assert.equal(await first.bindings.saveDraft(), false)
  first.unmount()

  const reloaded = createEditor({ persistence, storage: null, pendingCreateStorage })
  reloaded.bindings.draft.value.title = 'Judul setelah retry'
  assert.equal(await reloaded.bindings.saveDraft(), true)

  assert.equal(createRequests.length, 2)
  assert.deepEqual(createRequests[0], createRequests[1])
  assert.equal(updateRequests.length, 1)
  assert.equal(updateRequests[0].definition.title, 'Judul setelah retry')
  assert.equal(reloaded.bindings.record.value.draft.title, 'Judul setelah retry')
  assert.equal(reloaded.bindings.saveResult.value.message, 'Draft proyek berhasil disimpan.')
  assert.equal(reloaded.bindings.isDirty.value, false)
  reloaded.unmount()
})

test('a definitive create conflict releases the rejected idempotency snapshot for correction', async () => {
  const fixture = createProjectEditorFixture('platform-portofolio-talenta-digital')
  fixture.draft.slug = 'taken-slug'
  const requests = []
  const persistence = {
    create: async request => {
      requests.push(structuredClone(request))
      if (requests.length === 1) throw Object.assign(new Error('slug conflict'), { status: 409 })
      const definition = request.definition
      return {
        ...definition,
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        status: 'draft',
        version: 1,
        created_at: '2026-10-08T00:00:00.000Z',
        updated_at: '2026-10-08T00:01:00.000Z',
        published_at: null,
        ownership: {
          created_by_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          initiator_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          initiator_organization_id: null,
          owner_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          show_initiator: false,
          can_accept_contributors: false
        },
        owner_role: null,
        roles: definition.roles.map((role, index) => ({
          ...role,
          id: `cccccccc-cccc-4ccc-8ccc-${String(index + 1).padStart(12, '0')}`,
          contribution_role: null,
          position: index,
          skills: [],
          tools: [],
          filled_capacity: 0,
          remaining_capacity: role.capacity,
          status: 'open'
        }))
      }
    },
    update: async () => { throw new Error('not used') },
    publish: async () => { throw new Error('not used') },
    loadBySlug: async () => { throw new Error('not used') }
  }
  const editor = createEditor({ initialDraft: fixture.draft, persistence, storage: null })

  assert.equal(await editor.bindings.saveDraft(), false)
  editor.bindings.draft.value.slug = 'available-slug'
  assert.equal(await editor.bindings.saveDraft(), true)

  assert.equal(requests.length, 2)
  assert.notEqual(requests[1].client_request_id, requests[0].client_request_id)
  assert.equal(requests[1].definition.slug, 'available-slug')
  editor.unmount()
})
