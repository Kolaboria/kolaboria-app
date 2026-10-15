import assert from 'node:assert/strict'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const state = await import('../app/utils/workspace-discussion-state.ts').catch(() => ({}))

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
