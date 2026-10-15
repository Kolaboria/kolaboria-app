import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const taskColumnSource = readFileSync(
  new URL('../app/components/workspace/views/WorkspaceTaskColumn.vue', import.meta.url),
  'utf8',
)

test('task column passes Sortable options through the useDraggable options overload', () => {
  assert.match(taskColumnSource, /useDraggable\(taskList,\s*\{/)
  assert.match(taskColumnSource, /onEnd:\s*\(event\)\s*=>/)
})

test('task cards can start dragging without targeting the small grip control', () => {
  assert.match(taskColumnSource, /draggable:\s*'\[data-task-draggable="true"\]'/)
  assert.doesNotMatch(taskColumnSource, /\bhandle:\s*'\[data-task-drag-handle\]'/)
})

test('task column emits drops into closed so the owner can add a reason', () => {
  assert.match(taskColumnSource, /targetStatus === "closed"/)
  assert.match(taskColumnSource, /isProjectManager\.value/)
  assert.doesNotMatch(taskColumnSource, /targetStatus !== "closed"/)
})
