import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getStickyActionPreviewCase,
  resolveStickyActionState
} from '../app/utils/sticky-action-preview.ts'

const actualState = {
  canApply: false,
  isProjectOwner: false,
  canEditDefinition: false,
  hasUser: false,
  isVerified: false
}

test('sticky preview query selects an allowed preview case', () => {
  assert.equal(getStickyActionPreviewCase('owner'), 'owner')
  assert.equal(getStickyActionPreviewCase(['apply']), 'apply')
  assert.equal(getStickyActionPreviewCase(undefined), null)
  assert.equal(getStickyActionPreviewCase('unknown'), null)
})

test('sticky preview cases expose their expected actions without changing actual state', () => {
  assert.deepEqual(resolveStickyActionState('owner', actualState), {
    canApply: false,
    isProjectOwner: true,
    canEditDefinition: true,
    hasUser: true,
    isVerified: true
  })
  assert.deepEqual(resolveStickyActionState('apply', actualState), {
    canApply: true,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: true,
    isVerified: true
  })
  assert.deepEqual(resolveStickyActionState(null, actualState), actualState)
})

test('guest, unverified, editor, and unavailable previews map to distinct CTA states', () => {
  assert.deepEqual(resolveStickyActionState('guest', actualState), {
    canApply: true,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: false,
    isVerified: false
  })
  assert.deepEqual(resolveStickyActionState('unverified', actualState), {
    canApply: true,
    isProjectOwner: false,
    canEditDefinition: false,
    hasUser: true,
    isVerified: false
  })
  assert.deepEqual(resolveStickyActionState('editor', actualState), {
    canApply: false,
    isProjectOwner: false,
    canEditDefinition: true,
    hasUser: true,
    isVerified: true
  })
  assert.equal(resolveStickyActionState('cooldown', actualState).canApply, false)
})
