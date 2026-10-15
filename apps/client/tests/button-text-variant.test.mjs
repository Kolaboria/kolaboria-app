import assert from 'node:assert/strict'
import test from 'node:test'
import { mountComponent } from './helpers/frontend-runtime.mjs'

const { default: Button } = await import('../app/components/ui/atoms/Button.vue')

test('text-button variant uses the primary text treatment and pointer cursor', () => {
  const mounted = mountComponent(Button, { variant: 'text-button', size: 'sm' })

  try {
    const classes = mounted.bindings.buttonClass.flat(Infinity).filter(Boolean).join(' ')
    assert.match(classes, /text-primary-700/)
    assert.match(classes, /hover:text-primary-900/)
    assert.match(classes, /hover:cursor-pointer/)
    assert.match(classes, /px-0!/)
    assert.match(classes, /py-0!/)
  } finally {
    mounted.unmount()
  }
})
