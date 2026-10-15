import assert from 'node:assert/strict'
import test from 'node:test'
import { ref } from 'vue'

import { mountSetup } from './helpers/frontend-runtime.mjs'

const { useWorkspaceDiscussions } = await import('../app/composables/useWorkspaceDiscussions.ts')

const topic = (replyCount = 1) => ({
  id: 'topic-1',
  project_id: 'project-1',
  project_title: 'Platform',
  title: 'Rencana rilis',
  body: 'Menyelaraskan jadwal.',
  author: { id: 'member-owner', name: 'Ayu' },
  reply_count: replyCount,
  participant_count: 2,
  last_activity_at: '2026-10-14T09:00:00Z',
  created_at: '2026-10-14T08:00:00Z',
  updated_at: '2026-10-14T09:00:00Z',
  can_edit: false,
  can_delete: false
})

const reply = ({ id, parent_reply_id = null, body }) => ({
  id,
  discussion_id: 'topic-1',
  parent_reply_id,
  body,
  author: { id: 'member-current', name: 'Bima' },
  created_at: '2026-10-15T09:00:00Z',
  updated_at: '2026-10-15T09:00:00Z',
  is_deleted: false,
  can_edit: true,
  can_delete: true,
  replies: []
})

const paginated = (data, total = data.length, page = 1) => ({
  status: 200,
  message: 'ok',
  data,
  meta: { page, limit: 20, total, total_pages: Math.ceil(total / 20) }
})

const mountReplyMutation = async (savedReply, { failSummaryRefresh = false, initialRoots } = {}) => {
  const previousGlobals = {
    useNuxtApp: globalThis.useNuxtApp,
    useRuntimeConfig: globalThis.useRuntimeConfig,
    useCookie: globalThis.useCookie,
    useAsyncData: globalThis.useAsyncData,
    $fetch: globalThis.$fetch
  }
  const calls = []
  const app = { _scope: { run: (callback) => callback() } }
  const refreshedTopic = {
    ...topic(initialRoots?.length ?? 1),
    reply_count: (initialRoots?.length ?? 1) + 1,
    participant_count: 3,
    last_activity_at: savedReply.created_at,
    updated_at: savedReply.updated_at
  }
  const listItem = {
    id: 'topic-1', title: 'Rencana rilis', body_preview: 'Menyelaraskan jadwal.',
    author: { id: 'member-owner', name: 'Ayu' }, reply_count: (initialRoots?.length ?? 1) + 1, participant_count: 3,
    last_activity_at: savedReply.created_at, created_at: refreshedTopic.created_at,
    updated_at: savedReply.updated_at, can_edit: false, can_delete: false
  }

  globalThis.useNuxtApp = () => app
  globalThis.useRuntimeConfig = () => ({ public: { apiBaseUrl: 'http://api.local' } })
  globalThis.useCookie = () => ref(null)
  globalThis.useAsyncData = (_key, fetcher, options) => {
    const data = ref(options.default())
    return {
      data,
      pending: ref(false),
      error: ref(null),
      refresh: async () => { data.value = await fetcher() }
    }
  }
  globalThis.$fetch = async (request, options = {}) => {
    const path = new URL(String(request), 'http://api.local').pathname
    const method = options.method ?? 'GET'
    calls.push({ path, method })

    if (path === '/workspaces/platform/discussions/topic-1' && method === 'GET') {
      return { status: 200, message: 'ok', data: topic(initialRoots?.length ?? 1) }
    }
    if (path === '/workspaces/platform/discussions/topic-1/replies' && method === 'GET') {
      if (options.query?.page === 2) return paginated([savedReply], initialRoots.length + 1, 2)
      return paginated(initialRoots ?? [reply({ id: 'reply-1', body: 'Mari mulai.' })], initialRoots?.length ?? 1)
    }
    if (path === '/workspaces/platform/discussions/topic-1/replies' && method === 'POST') {
      return { status: 201, message: 'created', data: savedReply }
    }
    if (path === '/workspaces/platform/discussions' && method === 'GET') {
      if (failSummaryRefresh) throw new Error('summary unavailable')
      return paginated([listItem])
    }
    throw new Error(`Unexpected request: ${method} ${path}`)
  }

  const mounted = mountSetup(() => useWorkspaceDiscussions('platform'))
  await mounted.bindings.loadDiscussion('topic-1')
  calls.length = 0

  return {
    bindings: mounted.bindings,
    calls,
    cleanup: () => {
      mounted.unmount()
      for (const [key, value] of Object.entries(previousGlobals)) {
        if (value === undefined) delete globalThis[key]
        else globalThis[key] = value
      }
    }
  }
}

test('creating a root reply posts once and refreshes only the discussion summary', async () => {
  const savedReply = reply({ id: 'reply-new', body: 'Saya setuju dengan jadwal.' })
  const initialRoots = Array.from({ length: 20 }, (_, index) => reply({
    id: `root-${index + 1}`,
    body: `Tanggapan ${index + 1}`
  }))
  const mounted = await mountReplyMutation(savedReply, { initialRoots })
  try {
    const created = await mounted.bindings.createReply({ body: 'Saya setuju dengan jadwal.' })

    assert.equal(created, true)
    assert.deepEqual(mounted.calls, [
      { path: '/workspaces/platform/discussions/topic-1/replies', method: 'POST' },
      { path: '/workspaces/platform/discussions', method: 'GET' }
    ])
    assert.equal(mounted.bindings.replies.value.length, 21)
    assert.equal(mounted.bindings.replies.value.at(-1).id, 'reply-new')
    assert.equal(mounted.bindings.discussion.value.replyCount, 21)
    assert.equal(mounted.bindings.discussion.value.participantCount, 3)
    assert.equal(mounted.bindings.discussion.value.lastActivityAt, savedReply.created_at)
    assert.equal(mounted.bindings.hasMoreReplies.value, true)

    await mounted.bindings.loadMoreReplies()
    assert.equal(mounted.bindings.replies.value.filter((item) => item.id === 'reply-new').length, 1)
    assert.equal(mounted.bindings.hasMoreReplies.value, false)
  } finally {
    mounted.cleanup()
  }
})

test('creating a nested reply appends it under its parent without increasing root pagination total', async () => {
  const savedReply = reply({ id: 'reply-2', parent_reply_id: 'reply-1', body: 'Saya setuju.' })
  const mounted = await mountReplyMutation(savedReply)
  try {
    const created = await mounted.bindings.createReply({ body: 'Saya setuju.', parent_reply_id: 'reply-1' })

    assert.equal(created, true)
    assert.equal(mounted.bindings.replies.value.length, 1)
    assert.equal(mounted.bindings.replies.value[0].replies[0].id, 'reply-2')
    assert.equal(mounted.bindings.discussion.value.replyCount, 2)
    assert.equal(mounted.bindings.hasMoreReplies.value, false)
  } finally {
    mounted.cleanup()
  }
})

test('a saved reply remains successful and visible if refreshing the discussion summary fails', async () => {
  const savedReply = reply({ id: 'reply-2', body: 'Tercatat.' })
  const mounted = await mountReplyMutation(savedReply, { failSummaryRefresh: true })
  try {
    const created = await mounted.bindings.createReply({ body: 'Tercatat.' })

    assert.equal(created, true)
    assert.equal(mounted.bindings.replies.value[1].id, 'reply-2')
    assert.equal(mounted.bindings.discussion.value.replyCount, 2)
  } finally {
    mounted.cleanup()
  }
})
