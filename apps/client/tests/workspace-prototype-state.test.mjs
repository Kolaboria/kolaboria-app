import assert from 'node:assert/strict'
import test from 'node:test'
import './helpers/frontend-runtime.mjs'
import { createWorkspaceTestState } from './helpers/workspace-state-fixture.mjs'

const {
  canCloseProject,
  closeProject,
  addTaskComment,
  closeTask,
  createWorkspacePrototypeState,
  createTask,
  deleteTask,
  replyDiscussion,
  isProjectManager,
  canManageTasks,
  migrateWorkspacePrototypeState,
  projectActivityList,
  moveTask,
  proposeContributions,
  reviewContribution,
  shareContribution,
  setContributionSharing,
  setRoleReadiness,
  setTaskManagerAccess,
  toggleWorkspaceAssigneeFilter,
  startProject
} = await import('../app/utils/workspace-prototype-state.ts')

const workspaceStateModule = await import('../app/utils/workspace-prototype-state.ts')

test('workspace state exports do not expose demo-named domain identifiers', () => {
  assert.deepEqual(
    Object.keys(workspaceStateModule).filter((name) => name.includes('Demo')),
    []
  )
})

const setup = () => createWorkspaceTestState()

test('workspace initial state includes representative local scenarios', () => {
  const state = createWorkspacePrototypeState()

  assert.deepEqual(Object.keys(state).sort(), ['activeProjectId', 'currentUserId', 'people', 'projects'])
  assert.equal(state.activeProjectId, 'platform-edukasi-digital')
  assert.equal(state.currentUserId, 'fahmi')
  assert.deepEqual(state.projects.map((project) => project.status), ['in_progress', 'preparing', 'completed'])
  assert.ok(state.people.length >= 4)
})

test('assignee filter selects a member and toggles off when selected again', () => {
  assert.equal(toggleWorkspaceAssigneeFilter(null, 'nisa'), 'nisa')
  assert.equal(toggleWorkspaceAssigneeFilter('nisa', 'raka'), 'raka')
  assert.equal(toggleWorkspaceAssigneeFilter('nisa', 'nisa'), null)
})

test('discussion replies can be nested under another reply', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  const discussion = project.discussions[0]

  assert.equal(replyDiscussion(state, project.id, discussion.id, 'raka', 'Saya setuju dengan topik ini.'), true)
  const parentReply = discussion.replies.at(-1)
  assert.equal(replyDiscussion(state, project.id, discussion.id, 'nisa', 'Menanggapi jawaban Raka.', parentReply.id), true)

  assert.equal(parentReply.body, 'Saya setuju dengan topik ini.')
  assert.equal(parentReply.replies[0].body, 'Menanggapi jawaban Raka.')
  assert.equal(parentReply.replies[0].authorId, 'nisa')
})

test('legacy discussion replies are normalized to support nested responses', () => {
  const state = setup()
  const discussionId = state.projects[0].discussions[0].id
  delete state.projects[0].discussions[0].replies[0].replies

  migrateWorkspacePrototypeState(state)

  const discussion = state.projects[0].discussions.find((item) => item.id === discussionId)
  assert.deepEqual(discussion.replies[0].replies, [])
})

test('contributors can move their own task but cannot change another member task', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  const ownTask = project.tasks.find((task) => task.assigneeId === 'nisa')
  const otherTask = project.tasks.find((task) => task.assigneeId === 'raka')

  assert.equal(moveTask(state, project.id, ownTask.id, 'doing', 'nisa'), true)
  assert.equal(ownTask.status, 'doing')
  assert.equal(moveTask(state, project.id, otherTask.id, 'doing', 'nisa'), false)
  assert.equal(otherTask.status, 'todo')
})

test('only owner can close a task for scope change and the reason is retained', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  const task = project.tasks.find((item) => item.status === 'todo')

  assert.equal(closeTask(state, project.id, task.id, 'nisa', 'Scope changed'), false)
  assert.equal(closeTask(state, project.id, task.id, 'fahmi', '  '), false)
  assert.equal(closeTask(state, project.id, task.id, 'fahmi', 'Kebutuhan digabung ke task lain'), true)
  assert.equal(task.status, 'closed')
  assert.equal(task.closeReason, 'Kebutuhan digabung ke task lain')
  assert.equal(addTaskComment(state, project.id, task.id, 'fahmi', 'Update'), false)
})

test('a scope-closed task can be reopened and its old close reason is cleared', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  const task = project.tasks.find((item) => item.status === 'todo')
  task.assigneeId = 'nisa'

  assert.equal(closeTask(state, project.id, task.id, 'fahmi', 'Scope berubah'), true)
  assert.equal(moveTask(state, project.id, task.id, 'doing', 'nisa'), true)
  assert.equal(task.status, 'doing')
  assert.equal(task.closeReason, undefined)
})

test('project cannot close with unfinished tasks but scope-closed tasks do not block review', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  assert.equal(canCloseProject(project), false)

  for (const task of project.tasks) task.status = 'done'
  project.tasks[0].status = 'closed'
  project.tasks[0].closeReason = 'Dihapus dari scope setelah validasi'
  assert.equal(canCloseProject(project), true)
})

test('legacy cancelled tasks migrate into the closed status bucket', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  project.tasks[0].status = 'cancelled'
  project.leadIds = ['nisa']

  migrateWorkspacePrototypeState(state)

  assert.equal(project.tasks[0].status, 'closed')
  assert.equal('leadIds' in project, false)
})

test('owner can start only after each required role is ready or removed from scope', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'preparing')

  assert.equal(startProject(state, project.id, 'fahmi'), false)
  project.roleReadiness.forEach((role) => { role.readiness = 'ready' })
  project.roleReadiness[1].readiness = 'not_needed'
  assert.equal(startProject(state, project.id, 'nisa'), false)
  assert.equal(startProject(state, project.id, 'fahmi'), true)
  assert.equal(project.status, 'in_progress')
})

test('project owner can review and close the project after all tasks are done', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  project.tasks.forEach((task) => { task.status = 'done' })

  assert.equal('leadIds' in project, false)
  assert.equal(isProjectManager(project, 'nisa'), false)
  assert.equal(closeProject(state, project.id, 'nisa', 'Hasil sudah direview.'), false)
  assert.equal(closeProject(state, project.id, 'fahmi', 'Hasil sudah direview.'), true)
  assert.equal(project.status, 'completed')
})

test('project owner can grant task create and delete access to a contributor', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')

  assert.equal(setTaskManagerAccess(state, project.id, 'fahmi', 'raka', true), true)
  assert.equal(canManageTasks(project, 'raka'), true)
  assert.equal(project.activities[0].category, 'administrative')
  assert.equal(projectActivityList(project).some((activity) => activity.id === project.activities[0].id), false)
  assert.equal(setTaskManagerAccess(state, project.id, 'raka', 'dina', true), false)

  const task = createTask(state, project.id, 'raka', {
    title: 'Buat dokumentasi', description: '', assigneeId: 'raka', priority: 'medium', dueDate: ''
  })
  assert.ok(task)
  assert.equal(deleteTask(state, project.id, task.id, 'raka'), true)
  assert.equal(project.tasks.includes(task), false)
  assert.equal(deleteTask(state, project.id, 'task-design-tokens', 'raka'), false)
})

test('legacy workspace data removes the removed milestone collection', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  project.milestones = [{
    id: 'legacy-milestone',
    title: 'Beta siap',
    objective: 'Fitur beta diuji.',
    dueDate: '2026-10-20',
    done: false
  }]
  project.activities.unshift({
    id: 'legacy-milestone-activity',
    actorId: 'fahmi',
    text: 'Fahmi menambahkan milestone “Beta siap”',
    createdAt: '2026-10-14'
  })

  migrateWorkspacePrototypeState(state)

  assert.equal(Object.hasOwn(project, 'milestones'), false)
  assert.equal(project.activities.some((item) => item.id === 'legacy-milestone-activity'), false)
})

test('project activity list excludes administrative events and legacy wording avoids duplicate actors', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  project.activities = [
    { id: 'work', actorId: 'fahmi', text: 'Fahmi menandai “Task A” selesai', createdAt: '2026-10-14' },
    { id: 'access', actorId: 'fahmi', text: 'Fahmi mencabut izin kelola task untuk Nisa Putri', createdAt: '2026-10-14' },
  ]

  migrateWorkspacePrototypeState(state)

  assert.deepEqual(projectActivityList(project).map((activity) => activity.id), ['work'])
  assert.equal(project.activities[0].text, 'menandai “Task A” selesai')
  assert.equal(project.activities[1].category, 'administrative')
})

test('new task activity wording keeps the actor name in its dedicated field only', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  const task = project.tasks.find((item) => item.id === 'task-design-tokens')

  moveTask(state, project.id, task.id, 'done', 'fahmi')

  assert.equal(project.activities[0].actorId, 'fahmi')
  assert.equal(project.activities[0].text, 'menandai “Susun design tokens” menyelesaikan task')
  assert.equal(project.activities[0].category, 'project')
})

test('task creation and deletion access does not grant project management', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'in_progress')
  setTaskManagerAccess(state, project.id, 'fahmi', 'raka', true)

  assert.equal(isProjectManager(project, 'raka'), false)
  assert.equal(setRoleReadiness(state, project.id, 'frontend', 'not_needed', 'raka'), false)
  assert.equal(closeProject(state, project.id, 'raka', 'Selesai.'), false)
})

test('contributor reviews a private record and only its owner can opt in to sharing', () => {
  const state = setup()
  const project = state.projects.find((item) => item.status === 'completed')
  const records = proposeContributions(state, project.id, 'fahmi')
  const record = records.find((item) => item.contributorId === 'nisa')

  assert.equal(record.isShared, false)
  assert.equal(shareContribution(state, project.id, record.id, 'fahmi'), false)
  assert.equal(reviewContribution(state, project.id, record.id, 'fahmi', 'accepted'), false)
  assert.equal(reviewContribution(state, project.id, record.id, 'nisa', 'accepted'), true)
  assert.equal(record.isShared, false)
  assert.equal(shareContribution(state, project.id, record.id, 'nisa'), true)
  assert.equal(record.isShared, true)
  assert.equal(setContributionSharing(state, project.id, record.id, 'nisa', false), true)
  assert.equal(record.isShared, false)
})
