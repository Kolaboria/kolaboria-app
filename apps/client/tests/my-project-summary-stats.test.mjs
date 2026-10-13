import assert from 'node:assert/strict'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const { getMyProjectSummaryStats } = await import('../app/utils/my-project-summary-stats.ts')

test('summary counts active and draft projects from API status values', () => {
  const stats = getMyProjectSummaryStats([
    { id: 'open', status: 'open', pending_application_count: 2 },
    { id: 'progress', status: 'in_progress', pending_application_count: 0 },
    { id: 'awaiting', status: 'awaiting_owner', pending_application_count: null },
    { id: 'draft-1', status: 'draft', pending_application_count: 0 },
    { id: 'draft-2', status: 'draft', pending_application_count: 1 },
    { id: 'completed', status: 'completed', pending_application_count: 0 }
  ])

  assert.deepEqual(stats, {
    activeProjects: 2,
    draftProjects: 2,
    pendingApplicants: null
  })
})

test('pending application total uses exact API counts when every count is available', () => {
  const stats = getMyProjectSummaryStats([
    { id: 'one', status: 'open', pending_application_count: 2 },
    { id: 'two', status: 'completed', pending_application_count: 0 }
  ])

  assert.equal(stats.pendingApplicants, 2)
})
