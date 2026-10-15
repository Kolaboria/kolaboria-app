import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const paths = await import('../app/utils/workspace-paths.ts').catch(() => ({}))

test('workspace path is built from the selected real project slug', () => {
  assert.equal(typeof paths.projectWorkspacePath, 'function')
  assert.equal(
    paths.projectWorkspacePath('website-komunitas-kreatif'),
    '/projects/website-komunitas-kreatif/workspace/overview'
  )
  assert.equal(
    paths.projectWorkspacePath('website-komunitas-kreatif', 'tasks'),
    '/projects/website-komunitas-kreatif/workspace/tasks'
  )
})

test('workspace path safely encodes the project slug segment', () => {
  assert.equal(
    paths.projectWorkspacePath('project with spaces', 'info'),
    '/projects/project%20with%20spaces/workspace/info'
  )
})

test('discussion routes use a plural canonical list and project slug in detail links', () => {
  assert.equal(
    paths.projectWorkspacePath('website-komunitas-kreatif', 'discussion'),
    '/projects/website-komunitas-kreatif/workspace/discussions'
  )
  assert.equal(typeof paths.projectWorkspaceDiscussionPath, 'function')
  assert.equal(
    paths.projectWorkspaceDiscussionPath('website komunitas', 'topic/1'),
    '/projects/website%20komunitas/workspace/discussions/topic%2F1'
  )
})

test('project entry points use the selected project slug helper', async () => {
  const cardPath = fileURLToPath(new URL('../app/components/project/MyProjectCard.vue', import.meta.url))
  const applicationsPath = fileURLToPath(new URL('../app/pages/projects/my-applications.vue', import.meta.url))
  const [card, applications] = await Promise.all([
    readFile(cardPath, 'utf8'),
    readFile(applicationsPath, 'utf8')
  ])

  assert.match(card, /projectWorkspacePath\(props\.project\.slug\)/)
  assert.match(applications, /projectWorkspacePath\(app\.projects\.slug\)/)
})
