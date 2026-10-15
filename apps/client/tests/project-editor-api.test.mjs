import assert from 'node:assert/strict'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const { createProjectEditorApi } = await import('../app/composables/useProjectEditorApi.ts')

test('project editor API uses create, atomic publish, full-definition update, publish, and slug read contracts', async () => {
  const calls = []
  const responseData = { id: 'project-id' }
  const api = createProjectEditorApi(async (path, options) => {
    calls.push({ path, options })
    return { status: 200, message: 'ok', data: responseData }
  })
  const definition = { title: 'Brief', visibility: 'public', roles: [] }
  const createRequest = { client_request_id: 'client-key', definition }
  const publishNewRequest = { client_request_id: 'publish-key', definition }
  const updateRequest = { version: 4, definition }
  const publishRequest = { version: 5 }

  await api.create(createRequest)
  await api.publishNew(publishNewRequest)
  await api.update('project/id', updateRequest)
  await api.publish('project/id', publishRequest)
  await api.loadBySlug('project name')

  assert.deepEqual(calls, [
    { path: '/projects', options: { method: 'POST', body: createRequest } },
    { path: '/projects/publish', options: { method: 'POST', body: publishNewRequest } },
    { path: '/projects/project%2Fid', options: { method: 'PUT', body: updateRequest } },
    { path: '/projects/project%2Fid/publish', options: { method: 'POST', body: publishRequest } },
    { path: '/projects/slug/project%20name', options: undefined }
  ])
})

test('project editor API converts unsuccessful envelopes to safe frontend errors', async () => {
  const api = createProjectEditorApi(async () => ({
    status: 500,
    message: 'database connection password leaked',
    data: { trace_id: 'trace-123' }
  }))

  await assert.rejects(
    api.loadBySlug('brief'),
    (error) => {
      assert.match(error.message, /layanan sedang mengalami kendala/i)
      assert.equal(error.message.includes('password'), false)
      return true
    }
  )
})
