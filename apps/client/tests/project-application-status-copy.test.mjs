import assert from 'node:assert/strict'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const presentation = await import('../app/utils/project-presentation.ts').catch(() => ({}))

test('application status copy describes pending and accepted applications accurately', () => {
  assert.equal(typeof presentation.getProjectApplicationStatusCopy, 'function')

  assert.deepEqual(presentation.getProjectApplicationStatusCopy('pending'), {
    title: 'Lamaran sedang ditinjau',
    message: 'Pemilik proyek sedang meninjau lamaranmu.'
  })
  assert.deepEqual(presentation.getProjectApplicationStatusCopy('accepted'), {
    title: 'Lamaran diterima',
    message: 'Lamaranmu sudah diterima.'
  })
  assert.equal(presentation.getProjectApplicationStatusCopy(null), null)
})

test('unavailable application title describes the reason applications are unavailable', () => {
  assert.equal(typeof presentation.getProjectApplicationUnavailableTitle, 'function')

  assert.equal(presentation.getProjectApplicationUnavailableTitle({
    projectStatus: 'open',
    applicationStatus: null,
    isProjectOwner: false,
    isInitiatorOrganizationAdmin: true
  }), 'Proyek dari organisasimu')
  assert.equal(presentation.getProjectApplicationUnavailableTitle({
    projectStatus: 'open',
    applicationStatus: null,
    isProjectOwner: true,
    isInitiatorOrganizationAdmin: false
  }), 'Kamu Project Lead')
  assert.equal(presentation.getProjectApplicationUnavailableTitle({
    projectStatus: 'awaiting_owner',
    applicationStatus: null,
    isProjectOwner: false,
    isInitiatorOrganizationAdmin: false
  }), 'Menunggu Project Lead')
  assert.equal(presentation.getProjectApplicationUnavailableTitle({
    projectStatus: 'open',
    applicationStatus: 'pending',
    isProjectOwner: true,
    isInitiatorOrganizationAdmin: false
  }), 'Lamaran sedang ditinjau')
})
