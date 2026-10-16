import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { parse } from 'vue/compiler-sfc'

const componentPath = new URL('../app/components/workspace/views/WorkspaceDiscussionDetailView.vue', import.meta.url)
const source = readFileSync(componentPath, 'utf8')
const { descriptor } = parse(source)

const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

const findElement = (tag) => {
  let found = null
  walk(descriptor.template.ast, (node) => {
    if (!found && node.type === 1 && node.tag === tag) found = node
  })
  return found
}

const staticClass = (node) => node?.props.find((prop) => prop.type === 6 && prop.name === 'class')?.value?.content ?? ''
const staticAttribute = (node, name) => node?.props.find((prop) => prop.type === 6 && prop.name === name)?.value?.content ?? ''

test('discussion detail keeps topic, replies, and reply composer in one vertical column', () => {
  const discussionArticle = findElement('article')
  const replies = findElement('section')
  const topicComposer = findElement('WorkspaceDiscussionReplyComposer')

  assert.ok(discussionArticle, 'discussion detail container exists')
  assert.ok(replies, 'replies section exists')
  assert.ok(topicComposer, 'topic reply composer exists')
  assert.doesNotMatch(staticClass(discussionArticle), /grid-cols-/)
  assert.match(source, /WorkspaceDiscussionReplyComposer/)
  assert.match(source, /workspaceDiscussionReplyParentId\(targetReply\)/)
  assert.match(source, /:can-write="canWrite && !reply\.isDeleted && !followUp\.isDeleted"/)
  assert.equal((source.match(/:time-label="formatDate"/g) ?? []).length, 2)
  assert.match(source, /const discussionTimeZone = ref\('UTC'\)/)
  assert.match(source, /onMounted\(\(\) => \{\s*discussionTimeZone\.value = Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone/)
  assert.match(source, /Tanggapan/)
  assert.match(source, /activeReplyId === null/)
  assert.match(source, /active-reply-id/)
})
