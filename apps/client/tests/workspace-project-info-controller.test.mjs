import assert from 'node:assert/strict'
import test from 'node:test'
import { nextTick, ref } from 'vue'

import './helpers/frontend-runtime.mjs'
import { mountSetup } from './helpers/frontend-runtime.mjs'

const { createWorkspaceProjectInfoController } = await import('../app/composables/useWorkspaceProjectInfo.ts')

const info = ({ slug = 'platform', remaining = 1, version = 4 } = {}) => {
  const position = {
    id: 'role-1', name: 'Developer', description: '', capacity: 3,
    active_contributor_count: 3 - remaining,
    remaining_capacity: remaining,
    recruitment_status: remaining > 0 ? 'open' : 'filled',
    readiness_state: remaining > 0 ? 'to_fill' : 'ready'
  }
  return {
    project: {
      id: `id-${slug}`, slug, version, status: 'open', title: slug, summary: '', description: '',
      project_category: 'product', creation_mode: 'personal', initiator_organization_id: null,
      start_date: null, deadline: null,
      ownership: { owner_id: 'owner', owner_profile: null, initiator_organization_id: null, initiator_organization: null, initiator_profile: null, show_initiator: false }
    },
    positions: [position],
    position_capacity_summary: { all_positions_filled: remaining === 0, underfilled_position_count: remaining > 0 ? 1 : 0, total_remaining_capacity: remaining },
    viewer: { scope: 'owner', capabilities: { can_view_info: true, can_start_project: true, can_manage_workspace: true } }
  }
}

const flush = async () => { await nextTick(); await new Promise(resolve => setImmediate(resolve)); await nextTick() }

test('start confirmation sends the latest version and explicit underfilled acknowledgement', async () => {
  const requests = []
  const harness = mountSetup(() => createWorkspaceProjectInfoController(ref('platform'), {
    getInfo: async () => info({ remaining: 1, version: 8 }),
    startProject: async (id, body) => requests.push({ id, body })
  }))
  await flush()

  harness.bindings.requestStart()
  await harness.bindings.confirmStart()

  assert.deepEqual(requests, [{ id: 'id-platform', body: { version: 8, confirm_underfilled_positions: true } }])
  assert.equal(harness.bindings.confirmingStart.value, false)
  assert.equal(harness.bindings.data.value.project.status, 'open')
  harness.unmount()
})

test('full positions use a false acknowledgement and never create an underfilled warning', async () => {
  const requests = []
  const harness = mountSetup(() => createWorkspaceProjectInfoController(ref('platform'), {
    getInfo: async () => info({ remaining: 0 }),
    startProject: async (_id, body) => requests.push(body)
  }))
  await flush()
  assert.equal(harness.bindings.hasUnderfilledPositions.value, false)
  harness.bindings.requestStart()
  await harness.bindings.confirmStart()
  assert.deepEqual(requests, [{ version: 4, confirm_underfilled_positions: false }])
  harness.unmount()
})

test('a conflict reloads current quota and waits for another explicit confirmation', async () => {
  let reads = 0
  const requests = []
  const harness = mountSetup(() => createWorkspaceProjectInfoController(ref('platform'), {
    getInfo: async () => info({ remaining: reads++ === 0 ? 1 : 0, version: reads }),
    startProject: async (_id, body) => {
      requests.push(body)
      if (requests.length === 1) throw { status: 409, data: { status: 409, message: 'Project changed' } }
    }
  }))
  await flush()
  harness.bindings.requestStart()
  await harness.bindings.confirmStart()

  assert.equal(requests.length, 1, 'conflict must not retry the mutation')
  assert.equal(harness.bindings.confirmingStart.value, true)
  assert.equal(harness.bindings.hasUnderfilledPositions.value, false)
  assert.match(harness.bindings.startError.value, /kuota terbaru/i)

  await harness.bindings.confirmStart()
  assert.deepEqual(requests.map(request => request.confirm_underfilled_positions), [true, false])
  harness.unmount()
})

test('route slug changes ignore a late response from the previous project', async () => {
  let resolveOld
  const slug = ref('old')
  const harness = mountSetup(() => createWorkspaceProjectInfoController(slug, {
    getInfo: projectSlug => projectSlug === 'old'
      ? new Promise(resolve => { resolveOld = resolve })
      : Promise.resolve(info({ slug: projectSlug })),
    startProject: async () => {}
  }))
  slug.value = 'new'
  await flush()
  resolveOld(info({ slug: 'old' }))
  await flush()
  assert.equal(harness.bindings.data.value.project.slug, 'new')
  harness.unmount()
})
