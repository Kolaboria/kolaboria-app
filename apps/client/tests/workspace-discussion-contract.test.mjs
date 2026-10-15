import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const contract = await import('../app/types/workspace-discussion.ts').catch(() => ({}))

test('frontend discussion text limits match the backend contract', async () => {
  assert.deepEqual(contract.WORKSPACE_DISCUSSION_LIMITS, {
    title: 160,
    body: 10000,
    reply: 2000
  })

  const backendPath = fileURLToPath(new URL('../../../../kolaboria-api/internal/modules/workspace/discussion_dto.go', import.meta.url))
  const backend = await readFile(backendPath, 'utf8')
  assert.match(backend, /DiscussionTitleMaxLength\s*=\s*160/)
  assert.match(backend, /DiscussionBodyMaxLength\s*=\s*10000/)
  assert.match(backend, /DiscussionReplyMaxLength\s*=\s*2000/)
})

test('discussion contract keeps author moderation permissions without redundant write capabilities', () => {
  assert.equal(typeof contract.mapWorkspaceDiscussion, 'function')
  const mapped = contract.mapWorkspaceDiscussion({
    id: 'topic-1',
    project_id: 'project-1',
    title: 'Rencana rilis',
    body: 'Menyelaraskan jadwal.',
    author: { id: 'member-1', name: 'Ayu' },
    reply_count: 2,
    participant_count: 3,
    last_activity_at: '2026-10-15T09:00:00Z',
    created_at: '2026-10-14T09:00:00Z',
    updated_at: '2026-10-15T09:00:00Z',
    can_edit: false,
    can_delete: true
  })

  assert.equal(mapped.projectId, 'project-1')
  assert.equal(mapped.replyCount, 2)
  assert.equal(mapped.canEdit, false)
  assert.equal(mapped.canDelete, true)
  assert.equal('canReply' in mapped, false)
})

test('discussion list uses the shared paginated API envelope and conventional meta fields', async () => {
  const apiTypesPath = fileURLToPath(new URL('../app/types/api.ts', import.meta.url))
  const servicePath = fileURLToPath(new URL('../app/services/workspace-discussion.service.ts', import.meta.url))
  const [apiTypes, service] = await Promise.all([
    readFile(apiTypesPath, 'utf8'),
    readFile(servicePath, 'utf8')
  ])
  assert.match(apiTypes, /ApiResponse<[^,>]+,\s*TMeta/)
  assert.match(service, /ApiPaginatedResponse<WorkspaceDiscussionListItemDTO>/)
  assert.doesNotMatch(service, /DiscussionApiResponse/)
})
