import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

const categories = await import('../app/constants/projectCategory.ts')

test('project category options use Indonesian labels and keep API values stable', () => {
  assert.deepEqual(
    categories.PROJECT_CATEGORY_OPTIONS,
    [
      { value: 'product', label: 'Produk' },
      { value: 'community', label: 'Komunitas' },
      { value: 'open_source', label: 'Sumber Terbuka' },
      { value: 'research', label: 'Riset' },
      { value: 'education', label: 'Pendidikan' },
      { value: 'business', label: 'Bisnis' },
      { value: 'other', label: 'Lainnya' }
    ]
  )
  assert.equal(categories.getProjectCategoryLabel('unknown-category'), 'Lainnya')
})

test('project editor review uses the shared category label mapping', async () => {
  const path = fileURLToPath(new URL('../app/components/project/editor/ProjectEditorReview.vue', import.meta.url))
  const source = await readFile(path, 'utf8')

  assert.match(source, /getProjectCategoryLabel/)
  assert.doesNotMatch(source, /const categoryNames:/)
})
