import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const workspace = new URL('../app/pages/projects/[slug]/workspace/', import.meta.url)

test('plural discussion list route is canonical and uses the actual project slug', async () => {
  const routePath = new URL('discussions/index.vue', workspace)
  await access(fileURLToPath(routePath))
  const source = await readFile(fileURLToPath(routePath), 'utf8')
  assert.match(source, /WorkspaceDiscussionView/)
  assert.match(source, /route\.params\.slug/)
  assert.doesNotMatch(source, /currentProject\.value\?\.id/)
})

test('legacy singular discussion route redirects to the plural route', async () => {
  const path = fileURLToPath(new URL('discussion.vue', workspace))
  const source = await readFile(path, 'utf8')
  assert.match(source, /navigateTo\(/)
  assert.match(source, /projectWorkspacePath\(String\(route\.params\.slug \?\? ''\), 'discussion'\)/)
})

test('discussion list and detail no longer use localStorage prototype records as source of truth', async () => {
  const listPath = fileURLToPath(new URL('../../../../components/workspace/views/WorkspaceDiscussionView.vue', workspace))
  const detailPath = fileURLToPath(new URL('../../../../components/workspace/WorkspaceDiscussionDetailPage.vue', workspace))
  const [list, detail] = await Promise.all([readFile(listPath, 'utf8'), readFile(detailPath, 'utf8')])
  for (const source of [list, detail]) {
    assert.doesNotMatch(source, /workspace-prototype-state|currentProject\.value\?\.discussions|localStorage/)
    assert.match(source, /useWorkspaceDiscussions/)
  }
})
