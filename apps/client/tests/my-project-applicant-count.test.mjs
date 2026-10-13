import assert from 'node:assert/strict'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const applicantCount = await import('../app/utils/project-applicant-count.ts').catch(() => ({}))

test('pending applicant total is unknown until every listed project has a count', () => {
  assert.equal(typeof applicantCount.sumPendingApplicantCounts, 'function')

  assert.equal(applicantCount.sumPendingApplicantCounts([], {}), 0)
  assert.equal(applicantCount.sumPendingApplicantCounts(['project-1'], {}), null)
  assert.equal(applicantCount.sumPendingApplicantCounts(['project-1'], { 'project-1': null }), null)
  assert.equal(applicantCount.sumPendingApplicantCounts(
    ['project-1', 'project-2'],
    { 'project-1': 2 }
  ), null)
  assert.equal(applicantCount.sumPendingApplicantCounts(
    ['project-1', 'project-2'],
    { 'project-1': 2, 'project-2': 0 }
  ), 2)
})
