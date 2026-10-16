import assert from 'node:assert/strict'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const state = await import('../app/utils/workspace-discussion-state.ts').catch(() => ({}))
const presentation = await import('../app/utils/workspace-discussion-presentation.ts').catch(() => ({}))

test('a retry keeps its idempotency key until a changed payload or successful clear', () => {
  assert.equal(typeof state.stableDiscussionMutationKey, 'function')
  const keys = new Map()
  let generated = 0
  const nextKey = () => `key-${++generated}`

  const first = state.stableDiscussionMutationKey(keys, 'topic:create:platform', { title: 'Topik', body: 'Isi' }, nextKey)
  const retry = state.stableDiscussionMutationKey(keys, 'topic:create:platform', { title: 'Topik', body: 'Isi' }, nextKey)
  const changed = state.stableDiscussionMutationKey(keys, 'topic:create:platform', { title: 'Topik', body: 'Isi baru' }, nextKey)

  assert.equal(first, retry)
  assert.notEqual(changed, retry)
  state.clearDiscussionMutationKey(keys, 'topic:create:platform')
  assert.notEqual(state.stableDiscussionMutationKey(keys, 'topic:create:platform', { title: 'Topik', body: 'Isi baru' }, nextKey), changed)
})

test('idempotency keys are isolated per topic/reply scope', () => {
  const keys = new Map()
  let generated = 0
  const nextKey = () => `key-${++generated}`
  const topic = state.stableDiscussionMutationKey(keys, 'topic:create:platform', { body: 'Isi' }, nextKey)
  const reply = state.stableDiscussionMutationKey(keys, 'reply:create:topic-1:root', { body: 'Isi' }, nextKey)
  assert.notEqual(topic, reply)
})

test('replying to a follow-up keeps the new reply at the same hierarchy level', () => {
  assert.equal(typeof presentation.workspaceDiscussionReplyParentId, 'function')

  const root = { id: 'root-1', parentReplyId: null }
  const followUp = { id: 'reply-2', parentReplyId: 'root-1' }

  assert.equal(presentation.workspaceDiscussionReplyParentId(root), 'root-1')
  assert.equal(presentation.workspaceDiscussionReplyParentId(followUp), 'root-1')
})

test('discussion timestamps use Indonesian formatting in the selected timezone', () => {
  assert.equal(typeof presentation.formatWorkspaceDiscussionDate, 'function')

  assert.equal(
    presentation.formatWorkspaceDiscussionDate('2026-10-15T15:28:12.937Z', 'Asia/Jakarta'),
    '15 Okt 2026, 22.28'
  )
  assert.equal(presentation.formatWorkspaceDiscussionDate('not-a-date', 'Asia/Jakarta'), 'Waktu tidak tersedia')
})
