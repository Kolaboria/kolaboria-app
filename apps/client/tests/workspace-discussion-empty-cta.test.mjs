import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { parse } from 'vue/compiler-sfc'

const componentPath = new URL('../app/components/workspace/views/WorkspaceDiscussionView.vue', import.meta.url)
const { descriptor } = parse(readFileSync(componentPath, 'utf8'))

const findButtons = () => {
  const buttons = []
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 1 && node.tag === 'AtomicButton') buttons.push(node)
    for (const child of node.children ?? []) visit(child)
  }

  visit(descriptor.template.ast)
  return buttons
}

const getIfCondition = (node) => node.props.find((prop) => prop.type === 7 && prop.name === 'if')?.exp?.content
const getTextContent = (node) => {
  if (node.type === 2) return node.content
  return (node.children ?? []).map(getTextContent).join('')
}

test('discussion header create action is hidden while the empty-state action remains available', () => {
  const buttons = findButtons()
  const headerCreateButton = buttons.find((button) => getTextContent(button).includes('Mulai diskusi'))
  const emptyStateCreateButton = buttons.find((button) => getTextContent(button).includes('Mulai diskusi pertama'))

  assert.equal(getIfCondition(headerCreateButton), 'canWrite && discussionPage.items.length > 0')
  assert.equal(getIfCondition(emptyStateCreateButton), 'canWrite')
})
