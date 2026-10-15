import assert from 'node:assert/strict'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const { createWorkspaceDiscussionService } = await import('../app/services/workspace-discussion.service.ts').catch(() => ({}))

test('discussion service follows the project page pagination envelope without capability flags', async () => {
  assert.equal(typeof createWorkspaceDiscussionService, 'function')
  const calls = []
  const service = createWorkspaceDiscussionService(async (url, options) => {
    calls.push({ url, options })
    return {
      status: 200,
      message: 'ok',
      data: [{
        id: 'topic-1', title: 'Topik', body_preview: 'Ringkasan',
        author: { id: 'member-1', name: 'Ayu' }, reply_count: 4, participant_count: 3,
        last_activity_at: '2026-10-15T09:00:00Z', created_at: '2026-10-14T09:00:00Z',
        updated_at: '2026-10-15T09:00:00Z', can_edit: false, can_delete: true
      }],
      meta: { page: 2, limit: 25, total: 42, total_pages: 2 }
    }
  })

  const page = await service.list('platform edukasi', { page: 2, limit: 25 })
  assert.equal(calls[0].url, '/workspaces/platform%20edukasi/discussions')
  assert.deepEqual(calls[0].options.query, { page: 2, limit: 25 })
  assert.equal(page.items[0].replyCount, 4)
  assert.equal(page.items[0].canDelete, true)
  assert.deepEqual(page, {
    items: [page.items[0]], page: 2, limit: 25, total: 42, totalPages: 2
  })
})

test('discussion service sends snake_case payload and idempotency key for create operations', async () => {
  const calls = []
  const service = createWorkspaceDiscussionService(async (url, options) => {
    calls.push({ url, options })
    return {
      status: 201, message: 'created', data: {
        id: 'topic-1', project_id: 'project-1', project_title: 'Platform', title: 'Topik', body: 'Isi',
        author: { id: 'member-1', name: 'Ayu' }, reply_count: 0, participant_count: 1,
        last_activity_at: '2026-10-15T09:00:00Z', created_at: '2026-10-15T09:00:00Z',
        updated_at: '2026-10-15T09:00:00Z', can_edit: true, can_delete: true, can_reply: true
      }
    }
  })

  await service.create('platform', { title: 'Topik', body: 'Isi' }, 'request-key')
  assert.equal(calls[0].url, '/workspaces/platform/discussions')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'request-key')
  assert.deepEqual(calls[0].options.body, { title: 'Topik', body: 'Isi' })
})

test('discussion replies use page pagination metadata from the shared response envelope', async () => {
  const calls = []
  const service = createWorkspaceDiscussionService(async (url, options) => {
    calls.push({ url, options })
    return {
      status: 200,
      message: 'ok',
      data: [],
      meta: { page: 3, limit: 10, total: 21, total_pages: 3 }
    }
  })

  const page = await service.listReplies('platform', 'topic-1', { page: 3, limit: 10 })
  assert.equal(calls[0].url, '/workspaces/platform/discussions/topic-1/replies')
  assert.deepEqual(calls[0].options.query, { page: 3, limit: 10 })
  assert.deepEqual(page, { items: [], page: 3, limit: 10, total: 21, totalPages: 3 })
})

test('discussion service rejects a successful envelope without data instead of inventing a saved record', async () => {
  const service = createWorkspaceDiscussionService(async () => ({ status: 200, message: 'ok' }))
  await assert.rejects(() => service.get('platform', 'topic-1'), /diskusi/i)
})
