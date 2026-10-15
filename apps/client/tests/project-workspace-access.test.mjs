import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { parse } from 'vue/compiler-sfc'

const readComponent = path => {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const { descriptor, errors } = parse(source)
  assert.deepEqual(errors, [], `${path} should be valid Vue SFC`)
  return descriptor.template.ast
}

const findNode = (node, predicate) => {
  if (predicate(node)) return node
  for (const child of node.children ?? []) {
    const result = findNode(child, predicate)
    if (result) return result
  }
  return null
}

const directiveExpression = (node, name) =>
  node?.props.find(prop => prop.type === 7 && prop.name === name)?.exp?.content

test('open projects expose an owner action to start the project', () => {
  const ast = readComponent('../app/components/project/ProjectLifecycleActions.vue')
  const startAction = findNode(
    ast,
    node => node.type === 1 && node.tag === 'button' &&
      directiveExpression(node, 'on') === "emit('select', 'in_progress')"
  )

  assert.ok(startAction, 'open projects should offer the in-progress transition')
  assert.equal(directiveExpression(startAction, 'if'), "status === 'open'")
})

test('project cards expose workspace only to managers while the project is open or running', () => {
  const ast = readComponent('../app/components/project/MyProjectCard.vue')
  const workspaceLink = findNode(
    ast,
    node => node.type === 1 && node.tag === 'NuxtLink' &&
      directiveExpression(node, 'bind') === 'workspaceUrl'
  )

  assert.ok(workspaceLink, 'the project menu should contain a workspace link')
  assert.equal(directiveExpression(workspaceLink, 'if'), 'canAccessWorkspace')
})

test('accepted applicants get workspace access only after a project starts', () => {
  const ast = readComponent('../app/pages/projects/my-applications.vue')
  const workspaceLink = findNode(
    ast,
    node => node.type === 1 && node.tag === 'NuxtLink' &&
      directiveExpression(node, 'bind') === 'projectWorkspacePath(app.projects.slug)'
  )

  assert.ok(workspaceLink, 'accepted applications should expose workspace after start')
  assert.equal(
    directiveExpression(workspaceLink, 'if'),
    "app.status === 'accepted' && app.projects?.status === 'in_progress'"
  )
})
