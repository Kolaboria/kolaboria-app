import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { parse } from 'vue/compiler-sfc'

const source = readFileSync(
  new URL('../app/components/project/MyProjectCard.vue', import.meta.url),
  'utf8'
)
const { descriptor, errors } = parse(source)

const findNode = (node, predicate) => {
  if (predicate(node)) return node
  for (const child of node.children ?? []) {
    const result = findNode(child, predicate)
    if (result) return result
  }
  return null
}

test('my project card has an accessible full-area link to project detail', () => {
  assert.deepEqual(errors, [])

  const link = findNode(
    descriptor.template.ast,
    node => node.type === 1 && node.tag === 'NuxtLink' && node.props.some(
      prop => prop.type === 6 && prop.name === 'class' &&
        prop.value?.content.includes('absolute inset-0')
    )
  )

  assert.ok(link, 'card should expose a full-area detail link')
  assert.ok(link.props.some(
    prop => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'to' &&
      prop.exp?.content === '`/projects/${project.slug}`'
  ))
  assert.ok(link.props.some(
    prop => prop.type === 7 && prop.name === 'bind' &&
      prop.arg?.content === 'aria-label' &&
      prop.exp?.content === '`Buka detail proyek ${project.title}`'
  ))
})

test('my project card only presents applicant state and actions when a count is known', () => {
  const applicantState = findNode(
    descriptor.template.ast,
    node => node.type === 1 && node.props.some(
      prop => prop.type === 7 && prop.name === 'if' &&
        prop.exp?.content === 'pendingApplicantsCount !== undefined'
    )
  )

  assert.ok(applicantState, 'unknown applicant counts should not be presented as zero')

  const reviewLink = findNode(
    descriptor.template.ast,
    node => node.type === 1 && node.tag === 'NuxtLink' && node.props.some(
      prop => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'to' &&
        prop.exp?.content === '`/projects/${project.slug}/applicants`'
    )
  )
  const reviewCondition = reviewLink?.props.find(
    prop => prop.type === 7 && prop.name === 'if'
  )?.exp?.content

  assert.equal(
    reviewCondition,
    'pendingApplicantsCount !== undefined && pendingCount > 0'
  )
})
