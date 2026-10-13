import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const presentation = await import('../app/utils/project-presentation.ts').catch(() => ({}))
const projectDetailSource = readFileSync(
  new URL('../app/pages/projects/[slug]/index.vue', import.meta.url),
  'utf8'
)

test('project detail presents only the outcome written for contributors', () => {
  assert.equal(typeof presentation.getProjectContributorOutcome, 'function')

  assert.equal(
    presentation.getProjectContributorOutcome({
      contributor_outcome: '  Portofolio kolaborasi dan pengalaman praktik.  '
    }),
    'Portofolio kolaborasi dan pengalaman praktik.'
  )
})

test('project detail omits the contributor outcome section when it is empty', () => {
  assert.equal(presentation.getProjectContributorOutcome({ contributor_outcome: '  ' }), null)
  assert.equal(presentation.getProjectContributorOutcome({}), null)
})

test('project detail hides application unavailability notice from the project lead', () => {
  assert.match(
    projectDetailSource,
    /<template v-else-if="!isProjectOwner">\s*<MoleculeTicker/
  )
})

test('project detail calls the creator the owner only for self-owned personal projects', () => {
  assert.equal(typeof presentation.getProjectOwnerAttribution, 'function')

  assert.equal(presentation.getProjectOwnerAttribution({
    creation_mode: 'personal',
    owner_id: 'user-1',
    creator_id: 'user-1'
  }), 'Pemilik proyek')
  assert.equal(presentation.getProjectOwnerAttribution({
    creation_mode: 'organization_initiated',
    owner_id: 'user-1',
    creator_id: 'user-1'
  }), 'Project Lead')
  assert.equal(presentation.getProjectOwnerAttribution({
    creation_mode: 'personal',
    owner_id: 'user-2',
    creator_id: 'user-1'
  }), 'Project Lead')
  assert.equal(presentation.getProjectOwnerAttribution({
    creation_mode: 'personal',
    owner_id: null,
    creator_id: 'user-1'
  }), 'Kepemilikan belum ditetapkan')
})
