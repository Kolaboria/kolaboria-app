import assert from 'node:assert/strict'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const { ProjectService } = await import('../app/services/project.service.ts')
const { useProjects } = await import('../app/composables/useProjects.ts')

const paged = (ids, page, totalPages) => ({
  status: 200,
  message: 'ok',
  data: ids.map(id => ({ id })),
  meta: { page, limit: 100, total: totalPages * 100, total_pages: totalPages }
})

test('public project discovery consumes every API summary page', async () => {
  const original = ProjectService.getProjectSummaries
  const pages = [
    ['public-1', 'public-2'],
    ['public-3'],
    ['public-4']
  ]
  const requestedPages = []
  ProjectService.getProjectSummaries = async ({ page }) => {
    requestedPages.push(page)
    return paged(pages[page - 1] ?? [], page, pages.length)
  }
  try {
    const projects = await useProjects().getPublicProjectSummaries()
    assert.deepEqual(projects.map(project => project.id), ['public-1', 'public-2', 'public-3', 'public-4'])
    assert.deepEqual(requestedPages, [1, 2, 3])
  } finally {
    ProjectService.getProjectSummaries = original
  }
})

test('my-project lists consume all pages from the combined scope', async () => {
  const original = ProjectService.getMyProjectSummaries
  const requested = []
  const data = [['owned-1', 'initiated-1'], ['owned-2', 'initiated-2']]
  ProjectService.getMyProjectSummaries = async ({ page } = {}) => {
    requested.push(page)
    return paged(data[page - 1] ?? [], page, 2)
  }
  try {
    const projects = await useProjects().getMyProjectSummaries()
    assert.deepEqual(projects.map(project => project.id).sort(), ['initiated-1', 'initiated-2', 'owned-1', 'owned-2'])
    assert.deepEqual(requested, [1, 2])
  } finally {
    ProjectService.getMyProjectSummaries = original
  }
})
