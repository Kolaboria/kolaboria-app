import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { parse } from 'vue/compiler-sfc'

const componentUrl = new URL('../app/components/ui/molecules/Dropdown.vue', import.meta.url)
const { descriptor, errors } = parse(readFileSync(componentUrl, 'utf8'))

const findNode = (node, predicate) => {
  if (predicate(node)) return node
  for (const child of node.children ?? []) {
    const result = findNode(child, predicate)
    if (result) return result
  }
  return null
}

test('multi-select trigger can grow when selected chips wrap to another line', () => {
  assert.deepEqual(errors, [])
  const trigger = findNode(
    descriptor.template.ast,
    node => node.type === 1 && node.props.some(
      prop => prop.type === 6 && prop.name === 'class' &&
        prop.value?.content.includes('flex-wrap')
    )
  )
  const triggerClass = trigger?.props.find(
    prop => prop.type === 6 && prop.name === 'class'
  )?.value?.content

  assert.ok(triggerClass, 'dropdown trigger should have a static layout class')
  assert.match(triggerClass, /(?:^|\s)flex-wrap(?:\s|$)/)
  assert.match(triggerClass, /(?:^|\s)min-h-\[44px\](?:\s|$)/)
  assert.doesNotMatch(triggerClass, /(?:^|\s)h-11(?:\s|$)/)
})
