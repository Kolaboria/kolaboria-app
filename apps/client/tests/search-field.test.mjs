import assert from 'node:assert/strict'
import test from 'node:test'
import { nextTick } from 'vue'
import { mountComponent } from './helpers/frontend-runtime.mjs'

const { default: SearchField } = await import('../app/components/ui/molecules/SearchField.vue')

test('SearchField debounces eligible searches and clears active search immediately', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const searches = []
  const updates = []
  const mounted = mountComponent(SearchField, {
    modelValue: '',
    onSearch: value => searches.push(value),
    'onUpdate:modelValue': value => updates.push(value)
  })

  try {
    mounted.bindings.localValue = 'ab'
    await nextTick()
    t.mock.timers.tick(2_000)
    await nextTick()
    assert.deepEqual(searches, [])

    mounted.bindings.localValue = 'kol'
    await nextTick()
    t.mock.timers.tick(1_999)
    await nextTick()
    assert.deepEqual(searches, [])
    t.mock.timers.tick(1)
    await nextTick()
    assert.deepEqual(searches, ['kol'])

    mounted.bindings.localValue = 'ko'
    await nextTick()
    assert.deepEqual(searches, ['kol', ''])

    mounted.bindings.localValue = '猫火'
    await nextTick()
    t.mock.timers.tick(2_000)
    await nextTick()
    assert.deepEqual(searches, ['kol', ''])

    mounted.bindings.localValue = '猫火球'
    await nextTick()
    t.mock.timers.tick(2_000)
    await nextTick()
    assert.deepEqual(searches, ['kol', '', '猫火球'])
    assert.deepEqual(updates, ['ab', 'kol', 'ko', '猫火', '猫火球'])
  } finally {
    mounted.unmount()
  }
})
