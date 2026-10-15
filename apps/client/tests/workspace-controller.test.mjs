import assert from 'node:assert/strict'
import test from 'node:test'
import { nextTick, reactive, ref } from 'vue'
import { mountSetup } from './helpers/frontend-runtime.mjs'
import { createWorkspaceTestState } from './helpers/workspace-state-fixture.mjs'

const { useWorkspaceController } = await import('../app/composables/useWorkspaceController.ts')
const {
  countDiscussionReplies,
  discussionParticipantIds,
  paginateDiscussionList,
  paginateItems,
} = await import('../app/utils/workspace-presentation.ts')
const {
  migrateWorkspacePrototypeState,
  replyDiscussion,
} = await import('../app/utils/workspace-prototype-state.ts')

const mountController = (initialRoute = {}, initialStorage = {}, withFixture = true) => {
  const originalUseState = globalThis.useState
  const originalWindow = globalThis.window
  const originalUseRoute = globalThis.useRoute
  const originalUseRouter = globalThis.useRouter
  const states = new Map()
  const storage = new Map()
  for (const [key, value] of Object.entries(initialStorage)) storage.set(key, value)
  const route = reactive({
    path: '/projects/website-komunitas-kreatif/workspace',
    params: { slug: 'website-komunitas-kreatif' },
    query: {},
    ...initialRoute,
  })
  const navigation = []

  globalThis.useState = (key, init = () => null) => {
    if (!states.has(key)) {
      const initialState = withFixture && key === 'kolaboria-workspace-state-v2'
        ? createWorkspaceTestState()
        : init()
      states.set(key, ref(initialState))
    }
    return states.get(key)
  }
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key)
    }
  }
  globalThis.useRoute = () => route
  globalThis.useRouter = () => ({
    push(location) {
      navigation.push(location)
      route.path = typeof location === 'string' ? location : location.path
      route.query = typeof location === 'string' ? {} : location.query ?? {}
      return Promise.resolve()
    },
  })

  const mounted = mountSetup(() => useWorkspaceController())
  return {
    ...mounted,
    route,
    navigation,
    storage,
    restore() {
      mounted.unmount()
      if (originalUseState) globalThis.useState = originalUseState
      else delete globalThis.useState
      if (originalWindow) globalThis.window = originalWindow
      else delete globalThis.window
      if (originalUseRoute) globalThis.useRoute = originalUseRoute
      else delete globalThis.useRoute
      if (originalUseRouter) globalThis.useRouter = originalUseRouter
      else delete globalThis.useRouter
    }
  }
}

test('workspace removes the legacy prototype key and keeps the current seed', () => {
  const mounted = mountController({}, {
    'kolaboria-workspace-prototype-v1': JSON.stringify({ projects: [{ id: 'sample' }] }),
  }, false)
  try {
    assert.equal(mounted.storage.has('kolaboria-workspace-prototype-v1'), false)
    assert.equal(mounted.bindings.state.value.activeProjectId, 'platform-edukasi-digital')
    assert.deepEqual(
      mounted.bindings.state.value.projects.map((project) => project.status),
      ['in_progress', 'preparing', 'completed'],
    )
  } finally {
    mounted.restore()
  }
})

test('discussion pagination shows 12 topics per page and clamps the requested page', () => {
  const discussions = Array.from({ length: 25 }, (_, index) => `topic-${index + 1}`)

  assert.deepEqual(paginateDiscussionList(discussions, 1), {
    items: discussions.slice(0, 12),
    page: 1,
    pageCount: 3,
    total: 25,
  })
  assert.deepEqual(paginateDiscussionList(discussions, 3), {
    items: discussions.slice(24),
    page: 3,
    pageCount: 3,
    total: 25,
  })
  assert.deepEqual(paginateDiscussionList(discussions, 9), {
    items: discussions.slice(24),
    page: 3,
    pageCount: 3,
    total: 25,
  })
})

test('activity pagination supports batches of 50 and clamps the requested page', () => {
  const activities = Array.from({ length: 123 }, (_, index) => `activity-${index + 1}`)

  assert.deepEqual(paginateItems(activities, 1, 50), {
    items: activities.slice(0, 50),
    page: 1,
    pageCount: 3,
    total: 123,
  })
  assert.deepEqual(paginateItems(activities, 3, 50), {
    items: activities.slice(100),
    page: 3,
    pageCount: 3,
    total: 123,
  })
  assert.equal(paginateItems(activities, 9, 50).page, 3)
})

test('discussion reply count includes responses at every nesting level', () => {
  const discussion = {
    replies: [
      { id: 'reply-1', replies: [{ id: 'reply-2', replies: [{ id: 'reply-3', replies: [] }] }] },
      { id: 'reply-4', replies: [] },
    ],
  }

  assert.equal(countDiscussionReplies(discussion.replies), 4)
})

test('discussion participants are unique and ordered from the topic author through nested replies', () => {
  const discussion = {
    authorId: 'fahmi',
    replies: [
      {
        authorId: 'nisa',
        replies: [
          { authorId: 'raka', replies: [] },
          { authorId: 'fahmi', replies: [] },
        ],
      },
      { authorId: 'nisa', replies: [] },
    ],
  }

  assert.deepEqual(discussionParticipantIds(discussion), ['fahmi', 'nisa', 'raka'])
})

test('legacy discussion replies are flattened to two levels while retaining the addressed reply', () => {
  const state = createWorkspaceTestState()
  const discussion = state.projects[0].discussions[0]
  discussion.replies = [{
    id: 'root', authorId: 'nisa', body: 'Top level', createdAt: '2026-10-15', replies: [{
      id: 'child', authorId: 'fahmi', body: 'Second level', createdAt: '2026-10-16', replies: [{
        id: 'grandchild', authorId: 'raka', body: 'Legacy deeper reply', createdAt: '2026-10-17', replies: [],
      }],
    }],
  }]

  migrateWorkspacePrototypeState(state)
  const migratedDiscussion = state.projects[0].discussions[0]

  assert.deepEqual(migratedDiscussion.replies[0].replies.map((reply) => reply.id), ['child', 'grandchild'])
  assert.equal(migratedDiscussion.replies[0].replies[1].replyToId, 'child')
  assert.deepEqual(migratedDiscussion.replies[0].replies.map((reply) => reply.replies), [[], []])
})

test('replying to a level two response stays grouped at level two and keeps the exact target', () => {
  const state = createWorkspaceTestState()
  const discussion = state.projects[0].discussions[0]
  discussion.replies = [{
    id: 'root', authorId: 'nisa', body: 'Top level', createdAt: '2026-10-15', replies: [{
      id: 'child', authorId: 'fahmi', body: 'Second level', createdAt: '2026-10-16', replyToId: 'root', replies: [],
    }],
  }]

  assert.equal(replyDiscussion(state, state.projects[0].id, discussion.id, 'raka', 'Following up', 'child'), true)

  assert.deepEqual(discussion.replies[0].replies.map((reply) => reply.authorId), ['fahmi', 'raka'])
  assert.equal(discussion.replies[0].replies[1].replyToId, 'child')
  assert.deepEqual(discussion.replies[0].replies[1].replies, [])
})

test('workspace discussion example includes a contextual level two conversation', () => {
  const state = createWorkspaceTestState()
  const discussion = state.projects[0].discussions[0]

  assert.equal(countDiscussionReplies(discussion.replies), 3)
  assert.equal(discussion.replies[0].replies[1].replyToId, discussion.replies[0].replies[0].id)
})

test('switching project preserves the route-backed view and resets task filters and search', async () => {
  const mounted = mountController()
  try {
    const vm = mounted.bindings
    vm.goToPersonTasks('nisa')
    vm.searchQuery.value = 'onboarding'

    vm.switchProject('website-komunitas-kreatif')
    await nextTick()

    assert.equal(vm.activeView.value, 'tasks')
    assert.equal(vm.taskFilter.value, 'all')
    assert.equal(vm.assigneeFilter.value, null)
    assert.equal(vm.searchQuery.value, '')
  } finally {
    mounted.restore()
  }
})

test('workspace navigation reads its active view from the route path', async () => {
  const mounted = mountController({ path: '/projects/website-komunitas-kreatif/workspace/tasks' })
  try {
    const vm = mounted.bindings
    assert.equal(vm.activeView.value, 'tasks')

    mounted.route.path = '/projects/website-komunitas-kreatif/workspace/discussion'
    await nextTick()
    assert.equal(vm.activeView.value, 'discussion')

    mounted.route.path = '/projects/website-komunitas-kreatif/workspace/discussions/topic-1'
    await nextTick()
    assert.equal(vm.activeView.value, 'discussion')
  } finally {
    mounted.restore()
  }
})

test('opening a task from overview navigates to Kanban and opens that task', async () => {
  const mounted = mountController({ path: '/projects/website-komunitas-kreatif/workspace/overview' })
  try {
    const vm = mounted.bindings
    const task = vm.currentProject.value.tasks[0]

    vm.openTask(task)
    await nextTick()

    assert.equal(vm.activeView.value, 'tasks')
    assert.equal(vm.selectedTaskId.value, task.id)
    assert.equal(vm.selectedTask.value?.id, task.id)
    assert.equal(vm.dialogKind.value, 'task')
    assert.equal(vm.dialogOpen.value, true)
    assert.equal(mounted.navigation.at(-1), '/projects/website-komunitas-kreatif/workspace/tasks')
  } finally {
    mounted.restore()
  }
})

test('board drag moves a task directly between routine statuses', () => {
  const mounted = mountController({ path: '/projects/platform-edukasi-digital/workspace/tasks' })
  try {
    const vm = mounted.bindings
    const task = vm.currentProject.value.tasks.find((item) => item.status === 'todo')

    assert.equal(vm.moveTaskFromBoard(task.id, 'doing'), true)
    assert.equal(task.status, 'doing')
    assert.equal(vm.dialogOpen.value, false)
  } finally {
    mounted.restore()
  }
})

test('board drag moves tasks to review and completion without confirmation', () => {
  const mounted = mountController({ path: '/projects/platform-edukasi-digital/workspace/tasks' })
  try {
    const vm = mounted.bindings
    const task = vm.currentProject.value.tasks.find((item) => item.status === 'todo')

    assert.equal(vm.moveTaskFromBoard(task.id, 'review'), true)
    assert.equal(task.status, 'review')
    assert.equal(vm.dialogOpen.value, false)

    assert.equal(vm.moveTaskFromBoard(task.id, 'done'), true)
    assert.equal(task.status, 'done')
    assert.equal(vm.dialogOpen.value, false)
  } finally {
    mounted.restore()
  }
})

test('task detail saves review and completion status without confirmation', () => {
  const mounted = mountController({ path: '/projects/platform-edukasi-digital/workspace/tasks' })
  try {
    const vm = mounted.bindings
    const task = vm.currentProject.value.tasks.find((item) => item.status === 'todo')

    vm.openTask(task)
    vm.taskForm.status = 'review'
    vm.saveTask()
    assert.equal(task.status, 'review')
    assert.equal(vm.dialogOpen.value, false)

    vm.openTask(task)
    vm.taskForm.status = 'done'
    vm.saveTask()
    assert.equal(task.status, 'done')
    assert.equal(vm.dialogOpen.value, false)
  } finally {
    mounted.restore()
  }
})

test('board drag confirms reopening a closed task and rejects unauthorized moves', () => {
  const mounted = mountController({ path: '/projects/platform-edukasi-digital/workspace/tasks' })
  try {
    const vm = mounted.bindings
    const task = vm.currentProject.value.tasks.find((item) => item.status === 'todo')
    const otherMemberTask = vm.currentProject.value.tasks.find((item) => item.assigneeId === 'raka')
    task.status = 'closed'
    task.closeReason = 'Scope berubah'

    assert.equal(vm.moveTaskFromBoard(task.id, 'doing'), false)
    assert.equal(task.status, 'closed')
    assert.equal(vm.dialogKind.value, 'confirm')
    vm.confirmPendingAction()
    assert.equal(task.status, 'doing')
    assert.equal(task.closeReason, undefined)

    vm.state.value.currentUserId = 'nisa'
    assert.equal(vm.canDragTask(otherMemberTask), false)
  } finally {
    mounted.restore()
  }
})

test('dropping a task in closed asks for a reason and confirmation before closing it', () => {
  const mounted = mountController({ path: '/projects/platform-edukasi-digital/workspace/tasks' })
  try {
    const vm = mounted.bindings
    const task = vm.currentProject.value.tasks.find((item) => item.status === 'todo')

    assert.equal(vm.moveTaskFromBoard(task.id, 'closed'), false)
    assert.equal(task.status, 'todo')
    assert.equal(vm.selectedTask.value?.id, task.id)
    assert.equal(vm.dialogKind.value, 'task')

    vm.taskForm.closeReason = 'Scope berubah setelah sinkronisasi kebutuhan'
    vm.submitTaskClosure()
    assert.equal(task.status, 'todo')
    assert.equal(vm.dialogKind.value, 'confirm')
    vm.confirmPendingAction()

    assert.equal(task.status, 'closed')
    assert.equal(task.closeReason, 'Scope berubah setelah sinkronisasi kebutuhan')
  } finally {
    mounted.restore()
  }
})

test('workspace navigation defaults the base and unknown view paths to overview', () => {
  const missing = mountController()
  try {
    assert.equal(missing.bindings.activeView.value, 'overview')
  } finally {
    missing.restore()
  }

  const invalid = mountController({ path: '/projects/platform-edukasi-digital/workspace/unknown' })
  try {
    assert.equal(invalid.bindings.activeView.value, 'overview')
  } finally {
    invalid.restore()
  }
})

test('workspace tab navigation keeps the real project route while localStorage still selects dummy content', async () => {
  const mounted = mountController({
    path: '/projects/website-komunitas-kreatif/workspace/discussions/topic-1',
    params: { slug: 'website-komunitas-kreatif', discussionId: 'topic-1' },
  })
  try {
    mounted.bindings.goToView('tasks')
    await nextTick()

    assert.equal(mounted.navigation.at(-1), '/projects/website-komunitas-kreatif/workspace/tasks')

    mounted.bindings.goToView('overview')
    await nextTick()
    assert.equal(mounted.navigation.at(-1), '/projects/website-komunitas-kreatif/workspace/overview')

    mounted.bindings.goToView('info')
    await nextTick()
    assert.equal(mounted.navigation.at(-1), '/projects/website-komunitas-kreatif/workspace/info')
    assert.equal(mounted.bindings.activeView.value, 'info')
    assert.equal(mounted.bindings.currentProject.value.id, 'platform-edukasi-digital')
    assert.equal(
      JSON.parse(mounted.storage.get('kolaboria-workspace-state-v2')).activeProjectId,
      'platform-edukasi-digital'
    )
  } finally {
    mounted.restore()
  }
})

test('critical task-access confirmation can be canceled or executed once', () => {
  const mounted = mountController()
  try {
    const vm = mounted.bindings
    const project = vm.currentProject.value

    vm.confirmTaskAccessChange('raka', true)
    assert.deepEqual(project.taskManagerIds, [])
    vm.cancelConfirmation()
    assert.deepEqual(project.taskManagerIds, [])

    vm.confirmTaskAccessChange('raka', true)
    vm.confirmPendingAction()
    vm.confirmPendingAction()
    assert.deepEqual(project.taskManagerIds, ['raka'])
  } finally {
    mounted.restore()
  }
})

test('changing task filter clears the selected assignee', () => {
  const mounted = mountController()
  try {
    const vm = mounted.bindings
    vm.assigneeFilter.value = 'nisa'

    vm.setTaskFilter('review')

    assert.equal(vm.taskFilter.value, 'review')
    assert.equal(vm.assigneeFilter.value, null)
  } finally {
    mounted.restore()
  }
})

test('task dialog submit creates a task while cancel discards the draft', () => {
  const mounted = mountController()
  try {
    const vm = mounted.bindings
    const project = vm.currentProject.value
    const initialTaskCount = project.tasks.length

    vm.openNewTask()
    vm.taskForm.title = 'Susun panduan contributor'
    vm.saveTask()

    assert.equal(project.tasks.length, initialTaskCount + 1)
    assert.ok(project.tasks.some((task) => task.title === 'Susun panduan contributor'))

    vm.openNewTask()
    vm.taskForm.title = 'Draft yang dibatalkan'
    vm.closeDialog()

    assert.equal(project.tasks.length, initialTaskCount + 1)
    assert.equal(vm.dialogOpen.value, false)
  } finally {
    mounted.restore()
  }
})

test('discussion dialog publishes a complete draft and cancel leaves no entry', () => {
  const mounted = mountController()
  try {
    const vm = mounted.bindings
    const project = vm.currentProject.value
    const initialDiscussionCount = project.discussions.length

    vm.openDiscussionDialog()
    vm.discussionForm.title = 'Kriteria handoff'
    vm.discussionForm.body = 'Sepakati kriteria sebelum implementasi.'
    vm.submitDiscussion()

    assert.equal(project.discussions.length, initialDiscussionCount + 1)
    assert.ok(project.discussions.some((discussion) => discussion.title === 'Kriteria handoff'))

    vm.openDiscussionDialog()
    vm.discussionForm.title = 'Draft dibatalkan'
    vm.closeDialog()

    assert.equal(project.discussions.length, initialDiscussionCount + 1)
    assert.equal(vm.dialogOpen.value, false)
  } finally {
    mounted.restore()
  }
})

test('project close review requires a summary and closes after owner review', () => {
  const mounted = mountController()
  try {
    const vm = mounted.bindings
    const project = vm.currentProject.value
    project.tasks.forEach((task) => { task.status = 'done' })

    vm.openCloseProjectDialog()
    assert.equal(vm.dialogKind.value, 'close-project')

    vm.submitProjectClosure()
    assert.equal(project.status, 'in_progress')
    assert.ok(vm.outcomeError.value)

    vm.resultSummary.value = 'Semua hasil telah ditinjau bersama tim.'
    vm.submitProjectClosure()
    assert.equal(project.status, 'in_progress')
    vm.confirmPendingAction()
    assert.equal(project.status, 'completed')
    assert.equal(project.resultSummary, 'Semua hasil telah ditinjau bersama tim.')
  } finally {
    mounted.restore()
  }
})
