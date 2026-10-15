import assert from 'node:assert/strict'
import test from 'node:test'
import { reactive, ref } from 'vue'
import { mountSetup } from './helpers/frontend-runtime.mjs'

const { useProjectEditor } = await import('../app/composables/useProjectEditor.ts')
const { createProjectEditorFixture, createProjectEditorReferences } = await import('./helpers/project-editor-fixtures.ts')
const { createProjectEditorTestPersistence } = await import('./helpers/project-editor-persistence.ts')
const { validateProjectEditorDraft } = await import('../app/data/project-editor-validation.ts')

const organization = { id: 'bc9e7805-6000-4e0e-9d00-95fc8b85fe6a', name: 'Kolaboria' }
const validDraft = () => createProjectEditorFixture('platform-portofolio-talenta-digital').draft
const mountEditor = (options = {}) => {
  const { delayMs = 0, ...editorOptions } = options
  return mountSetup(() => useProjectEditor({
    mode: 'create', currentUserId: 'internal-a', references: createProjectEditorReferences(),
    initialDraft: validDraft(), eligibility: { email_verified: true, onboarding_completed: true },
    persistence: editorOptions.persistence ?? createProjectEditorTestPersistence({
      delayMs,
      currentUserId: editorOptions.currentUserId ?? 'internal-a'
    }),
    ...editorOptions
  }))
}
const internal = { system_role: 'admin', initiable_organizations: [organization] }

test('atomic publication records the server result when eligibility changes while the request is pending', async () => {
  const eligibility = reactive({ email_verified: true, onboarding_completed: true })
  const editor = mountEditor({ eligibility, delayMs: 20 })
  const pending = editor.bindings.publish()
  assert.equal(editor.bindings.isSubmitting.value, true)
  eligibility.email_verified = false
  assert.equal(await pending, true)
  assert.equal(editor.bindings.record.value.status, 'open')
  assert.equal(editor.bindings.saveResult.value.kind, 'published')
  editor.unmount()
})

test('mounted editor revokes organization mutations while retaining the unsaved draft', async () => {
  const context = reactive({ system_role: 'admin', initiable_organizations: [organization] })
  const available = ref(true)
  const editor = mountEditor({ creationContext: context, contextAvailable: () => available.value })
  const vm = editor.bindings
  vm.setCreationMode('organization_initiated')
  Object.assign(vm.draft.value, validDraft(), { creation_mode: 'organization_initiated', initiator_organization_id: organization.id, owner_commitment: '', owner_contribution_role_id: undefined, lead_expectations: 'Memimpin diskusi tim dan mengelola arah proyek.', title: 'Draft organisasi belum disimpan' })
  context.initiable_organizations = []
  assert.equal(vm.selectedOrganization.value, null)
  assert.equal(vm.canPublish.value, false)
  assert.equal(await vm.saveDraft(), false)
  assert.equal(await vm.publish(), false)
  assert.equal(vm.draft.value.title, 'Draft organisasi belum disimpan')
  context.initiable_organizations = [organization]
  available.value = false
  assert.equal(await vm.saveDraft(), false)
  assert.equal(vm.canPublish.value, false)
  available.value = true
  assert.equal(await vm.saveDraft(), true)
  context.system_role = 'user'
  assert.equal(vm.selectedOrganization.value, null)
  assert.equal(vm.canPublish.value, false)
  assert.equal(await vm.saveDraft(), false)
  editor.unmount()
})

test('talent cannot choose or save an organization project; internal still defaults to personal ownership', async () => {
  const talent = mountEditor()
  assert.equal(talent.bindings.setCreationMode('organization_initiated'), false)
  talent.bindings.draft.value.creation_mode = 'organization_initiated'
  assert.equal(await talent.bindings.saveDraft(), false)
  talent.unmount()

  const editor = mountEditor({ creationContext: internal })
  assert.equal(editor.bindings.draft.value.creation_mode, 'personal')
  assert.equal(await editor.bindings.publish(), true)
  assert.equal(editor.bindings.record.value.ownership.owner_id, 'internal-a')
  assert.equal(editor.bindings.record.value.ownership.show_initiator, false)
  editor.unmount()
})

test('organization publication leaves owner empty and does not allow contributors', async () => {
  const editor = mountEditor({ creationContext: internal })
  const vm = editor.bindings
  assert.equal(vm.setCreationMode('organization_initiated'), true)
  // Each creation mode has a separate brief, not an automatic conversion.
  Object.assign(vm.draft.value, validDraft(), { creation_mode: 'organization_initiated', initiator_organization_id: organization.id, owner_commitment: '', lead_expectations: 'Memimpin diskusi dan seleksi kontributor.' })
  assert.equal(await vm.publish(), true)
  assert.equal(vm.record.value.status, 'awaiting_owner')
  assert.deepEqual(vm.record.value.ownership, {
    created_by_user_id: 'internal-a', initiator_user_id: null,
    initiator_organization_id: organization.id, owner_id: null,
    show_initiator: true, can_accept_contributors: false
  })
  editor.unmount()
})

test('mode-specific drafts survive switches within the editor session', async () => {
  const editor = mountEditor({ creationContext: internal })
  const vm = editor.bindings
  vm.draft.value.title = 'Personal draft'
  await vm.saveDraft()
  vm.setCreationMode('organization_initiated')
  assert.equal(vm.draft.value.title, '')
  assert.equal(vm.draft.value.visibility, 'public')
  vm.draft.value.title = 'Organization draft'
  await vm.saveDraft()
  vm.setCreationMode('personal')
  assert.equal(vm.draft.value.title, 'Personal draft')
  editor.unmount()
})

test('organization validation requires lead expectations and public visibility, not owner fields', () => {
  const draft = { ...validDraft(), creation_mode: 'organization_initiated', owner_commitment: '', lead_expectations: '' }
  let errors = validateProjectEditorDraft(draft, createProjectEditorReferences())
  assert.equal(errors.owner_commitment, undefined)
  assert.ok(errors.lead_expectations)
  draft.lead_expectations = 'Mengelola arah proyek.'
  draft.visibility = 'invite_only'
  errors = validateProjectEditorDraft(draft, createProjectEditorReferences())
  assert.ok(errors.visibility)
})

test('unsaved inactive draft still triggers the leave-page guard after changing creation mode', () => {
  const editor = mountEditor({ creationContext: internal })
  editor.bindings.draft.value.title = 'Unsaved personal idea'
  editor.bindings.setCreationMode('organization_initiated')
  assert.equal(editor.bindings.isDirty.value, true)
  editor.bindings.setCreationMode('personal')
  assert.equal(editor.bindings.draft.value.title, 'Unsaved personal idea')
  editor.unmount()
})

test('invalid organization project data is rejected before reaching the API', async () => {
  for (const badFields of [{ visibility: 'invite_only' }, { owner_commitment: 'Unexpected owner' }, { owner_contribution_role_id: 'role-frontend' }]) {
    const editor = mountEditor({ creationContext: internal })
    editor.bindings.setCreationMode('organization_initiated')
    Object.assign(editor.bindings.draft.value, badFields)
    assert.equal(await editor.bindings.saveDraft(), false)
    assert.equal(editor.bindings.record.value, null)
    editor.unmount()
  }
})

test('publication requires verified email and completed onboarding; no profile score gate', async () => {
  for (const eligibility of [{ email_verified: false, onboarding_completed: true }, { email_verified: true, onboarding_completed: false }]) {
    const editor = mountEditor({ eligibility })
    assert.equal(await editor.bindings.publish(), false)
    assert.equal(editor.bindings.record.value, null)
    editor.unmount()
  }
  const ready = mountEditor()
  assert.equal(await ready.bindings.publish(), true)
  ready.unmount()
})

test('organization selection follows authorized relationships and keeps each organization draft isolated', async () => {
  const orgB = { id: '6376d976-a9ef-483d-8b60-71df1aaebf64', name: 'Community B' }
  const editor = mountEditor({ creationContext: { system_role: 'admin', initiable_organizations: [organization, orgB] } })
  const vm = editor.bindings
  vm.setCreationMode('organization_initiated')
  assert.equal(vm.draft.value.initiator_organization_id, organization.id)
  vm.draft.value.title = 'Draft A'
  await vm.saveDraft()
  assert.equal(vm.selectOrganization(orgB.id), true)
  assert.equal(vm.draft.value.title, '')
  vm.draft.value.title = 'Draft B'
  await vm.saveDraft()
  vm.selectOrganization(organization.id)
  assert.equal(vm.draft.value.title, 'Draft A')
  assert.equal(vm.selectOrganization('unlisted-organization'), false)
  vm.draft.value.initiator_organization_id = 'unlisted-organization'
  assert.equal(await vm.saveDraft(), false)
  editor.unmount()
})

test('revoked organization context cannot authorize an organization project', () => {
  const revoked = mountEditor({ creationContext: { system_role: 'user', initiable_organizations: [] } })
  assert.equal(revoked.bindings.setCreationMode('organization_initiated'), false)
  assert.equal(revoked.bindings.draft.value.creation_mode, 'personal')
  revoked.unmount()
})
