import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../app/components/workspace/views/WorkspaceProjectInfoView.vue', import.meta.url), 'utf8')

test('Info view presents readiness as read-only API capacity facts', () => {
  assert.match(source, /occupancyLabel/)
  assert.match(source, /occupancyLabel/)
  assert.match(source, /remainingCapacity/)
  assert.match(source, /readinessLabel/)
  assert.doesNotMatch(source, /MoleculeDropdown/)
  assert.doesNotMatch(source, /readiness-change/)
  assert.doesNotMatch(source, /role\.required/)
})

test('Info view keeps initiator organization distinct and omits result-target section', () => {
  assert.match(source, /initiatorOrganizationName/)
  assert.match(source, /Project Owner/)
  assert.doesNotMatch(source, /Hasil yang dituju/)
  assert.doesNotMatch(source, /resultSummary/)
})

test('underfilled start confirmation lists the remaining roles and supports cancel or confirm', () => {
  assert.match(source, /confirmingStart/)
  assert.match(source, /positionCapacitySummary\.totalRemainingCapacity/)
  assert.match(source, /start-confirm/)
  assert.match(source, /start-cancel/)
  assert.match(source, /remainingCapacity/)
  assert.match(source, /<OrganismModal/)
  assert.match(source, /:model-value="confirmingStart && Boolean\(info\)"/)
  assert.match(source, /#description/)
  assert.match(source, /#footer/)
  assert.doesNotMatch(source, /fixed inset-0 z-\[100\]/)
})
