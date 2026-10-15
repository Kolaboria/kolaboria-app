import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workspaceApp = await readFile(new URL('../app/components/workspace/WorkspaceApp.vue', import.meta.url), 'utf8')
const projectInfo = await readFile(new URL('../app/components/workspace/views/WorkspaceProjectInfoView.vue', import.meta.url), 'utf8')
const projectInfoPage = await readFile(new URL('../app/pages/projects/[slug]/workspace/info.vue', import.meta.url), 'utf8')

test('workspace exposes local scenario and member selectors without a reset control', () => {
  assert.match(workspaceApp, /id="workspace-demo-project"/)
  assert.match(workspaceApp, /id="workspace-demo-person"/)
  assert.match(workspaceApp, /@change="changeDemoProject"/)
  assert.match(workspaceApp, /@change="changeDemoPerson"/)

  for (const copy of ['Kontrol prototype', 'Data simulasi', 'Prototype interaktif', 'Reset data']) {
    assert.equal(workspaceApp.includes(copy) || projectInfo.includes(copy), false, `unexpected prototype UI copy: ${copy}`)
  }
})

test('project info keeps closure metrics as an unwired prototype and hides contribution records', () => {
  assert.equal(projectInfo.includes('Penutupan proyek'), true, 'closure prototype section should remain visible')
  assert.equal(projectInfo.includes('Rekam kontribusi'), false, 'contribution section should stay hidden')

  for (const heldAction of ['project-review', 'contribution-proposal', 'contribution-review', 'contribution-sharing']) {
    assert.equal(projectInfo.includes(`"${heldAction}"`), false, `held action is still wired: ${heldAction}`)
    assert.equal(projectInfoPage.includes(`@${heldAction}=`), false, `held action is still connected on the Info page: ${heldAction}`)
  }
})

test('project info uses a responsive grid for summary and side panels', () => {
  assert.match(projectInfo, /grid items-start gap-4 lg:grid-cols-\[minmax\(0,2fr\)_minmax\(18rem,1fr\)\]/)
  assert.match(projectInfo, /class="grid items-start gap-4"/)
  assert.match(projectInfo, /lg:col-start-2 lg:row-start-1/)
})
