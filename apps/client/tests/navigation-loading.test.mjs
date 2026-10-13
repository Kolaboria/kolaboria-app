import assert from 'node:assert/strict'
import test from 'node:test'
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { routeLocationKey } from 'vue-router'
import { mountSetup } from './helpers/frontend-runtime.mjs'

const { ProjectService } = await import('../app/services/project.service.ts')
const { useProjects } = await import('../app/composables/useProjects.ts')
const { useInfiniteScroll } = await import('../app/composables/useInfiniteScroll.ts')
const { useExperiences } = await import('../app/composables/useExperiences.ts')
const { ExperienceService } = await import('../app/services/experience.service.ts')
const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}
const settle = async () => {
  for (let i = 0; i < 4; i++) { await nextTick(); await new Promise(resolve => setImmediate(resolve)) }
}

// Keep Vue setup/watch logic real; isolate Nuxt's documented blocking/lazy boundary
// and external API requests so unresolved network promises are deterministic.
function installNuxtBoundary() {
  const states = new Map()
  const token = `e30.${Buffer.from(JSON.stringify({ user_id: 'owner', username: 'owner' })).toString('base64url')}.signature`
  const globals = {
    computed, ref, watch, useProjects, useInfiniteScroll, useExperiences,
    definePageMeta() {}, useHead() {}, usePopup: () => ({ show() {} }),
    useToast: () => ({ error() {}, success() {} }),
    useCookie: () => ref(token),
    useRuntimeConfig: () => ({ public: { apiBaseUrl: 'http://local-fixture' } }),
    useState: (key, init = () => null) => {
      if (!states.has(key)) states.set(key, ref(init()))
      return states.get(key)
    },
    useRoute: () => reactive({ params: { slug: 'slow-project' }, path: '/projects/slow-project/applicants' }),
    useAuth: () => ({ user: ref({ id: 'owner' }), currentUserId: ref('owner') }),
    createError: options => Object.assign(new Error(options.message || options.statusMessage), options)
  }
  const asyncData = (lazy, _key, handler, options = {}) => {
    const data = ref(options.default?.())
    const error = ref(null)
    const pending = ref(true)
    const refresh = async () => {
      pending.value = true
      error.value = null
      try { data.value = await handler() } catch (failure) { error.value = failure }
      finally { pending.value = false }
    }
    const result = { data, error, pending, refresh }
    const request = refresh()
    if (options.watch) watch(options.watch, refresh)
    return Object.assign(lazy ? Promise.resolve(result) : request.then(() => result), result)
  }
  globals.useAsyncData = (...args) => asyncData(false, ...args)
  globals.useLazyAsyncData = (...args) => asyncData(true, ...args)
  const originals = Object.fromEntries(Object.keys(globals).map(key => [key, globalThis[key]]))
  Object.assign(globalThis, globals)
  return () => {
    for (const [key, original] of Object.entries(originals)) {
      if (original === undefined) delete globalThis[key]
      else globalThis[key] = original
    }
  }
}

test('my-projects displays its first batch before subsequent summary pages finish', async () => {
  const restore = installNuxtBoundary()
  const gate = deferred()
  const original = ProjectService.getMyProjectSummaries
  ProjectService.getMyProjectSummaries = async ({ page }) => {
    if (page === 2) await gate.promise
    return {
      status: 200, message: 'ok',
      data: [{ id: `project-${page}`, slug: `project-${page}`, status: 'draft', my_scope: 'owned', roles: [] }],
      meta: { page, limit: 100, total: 101, total_pages: 2 }
    }
  }
  const originalDetail = ProjectService.getProjectBySlug
  ProjectService.getProjectBySlug = async () => ({ status: 200, data: null })
  const { default: Page } = await import('../app/components/project/MyProjectsView.vue')
  const mounted = mountPage(Page)
  try {
    await settle()
    assert.ok(mounted.bindings, 'project list must not wait for every summary page')
    assert.equal(mounted.bindings.pending.value, false)
    assert.deepEqual(mounted.bindings.projects.value.map(p => p.id), ['project-1'])
    assert.equal(mounted.bindings.activeProjectsCount.value, null, 'summary must not present a partial first-page total')
    gate.resolve()
    await settle()
    assert.equal(mounted.bindings.projects.value.length, 2)
    assert.equal(mounted.bindings.activeProjectsCount.value, 0)
    assert.equal(mounted.bindings.draftProjectsCount.value, 2)
  } finally {
    gate.resolve()
    await settle()
    mounted.unmount()
    ProjectService.getMyProjectSummaries = original
    ProjectService.getProjectBySlug = originalDetail
    restore()
  }
})

function mountPage(Page, provides = []) {
  let bindings
  let failure
  const mounted = mountSetup(() => {
    Promise.resolve(Page.setup({}, { expose() {} })).then(result => { bindings = result }, error => { failure = error })
    return {}
  }, provides)
  return { get bindings() { if (failure) throw failure; return bindings }, unmount: mounted.unmount }
}

test('my-project summaries provide card data without per-project detail requests', async () => {
  const restore = installNuxtBoundary()
  const gate = deferred()
  const originalList = ProjectService.getMyProjectSummaries
  const originalDetail = ProjectService.getProjectBySlug
  const detailRequests = []
  ProjectService.getMyProjectSummaries = async ({ page }) => ({
    status: 200, data: [{ id: `project-${page}`, slug: `project-${page}`, status: 'draft', my_scope: 'owned', roles: [] }],
    meta: { page, limit: 100, total: 101, total_pages: 2 }
  })
  ProjectService.getProjectBySlug = slug => { detailRequests.push(slug); return gate.promise }
  const { default: Page } = await import('../app/components/project/MyProjectsView.vue')
  const mounted = mountPage(Page)
  try {
    await settle()
    assert.deepEqual(detailRequests, [])
  } finally {
    gate.resolve({ status: 200, data: { project_roles: [] } })
    await settle()
    mounted.unmount()
    ProjectService.getMyProjectSummaries = originalList
    ProjectService.getProjectBySlug = originalDetail
    restore()
  }
})

test('owner experience mutation updates page data without reloading or hiding the reflection editor', async () => {
  const restore = installNuxtBoundary()
  globalThis.useRoute = () => ({ params: { experienceSlug: 'my-experience' } })
  const originalList = ExperienceService.listMine
  const originalDetail = ExperienceService.getById
  const originalVisibility = ExperienceService.updateVisibility
  let detailReads = 0
  ExperienceService.listMine = async () => [{ id: 'experience-1', slug: 'my-experience' }]
  ExperienceService.getById = async () => {
    detailReads++
    return { id: 'experience-1', visibility: 'private', visibility_label: 'Privat', reflection: { body: 'Saved reflection' } }
  }
  ExperienceService.updateVisibility = async () => {}
  const { default: Page } = await import('../app/pages/profile/me/experiences/[experienceSlug].vue')
  const mounted = mountPage(Page)
  try {
    await settle()
    await mounted.bindings.saveVisibility('public')
    assert.equal(detailReads, 1, 'visibility must not re-fetch and unmount the detail editor')
    assert.equal(mounted.bindings.pending.value, false)
    assert.equal(mounted.bindings.data.value.visibility, 'public')
    assert.equal(mounted.bindings.data.value.reflection.body, 'Saved reflection')
  } finally {
    mounted.unmount()
    ExperienceService.listMine = originalList
    ExperienceService.getById = originalDetail
    ExperienceService.updateVisibility = originalVisibility
    restore()
  }
})

test('mobile project CTA remains hidden until the loaded hero has scrolled out of view', async () => {
  const restore = installNuxtBoundary()
  const gate = deferred()
  const originalFetch = globalThis.$fetch
  const originalWindow = globalThis.window
  const handlers = new Map()
  globalThis.$fetch = () => gate.promise
  globalThis.window = { innerWidth: 390, addEventListener: (event, handler) => handlers.set(event, handler), removeEventListener() {} }
  const { default: Page } = await import('../app/pages/projects/[slug]/index.vue')
  const mounted = mountPage(Page, [[routeLocationKey, reactive({ params: { slug: 'slow-project' } })]])
  try {
    await settle()
    mounted.bindings.setupScrollListener()
    handlers.get('scroll')()
    assert.equal(mounted.bindings.showStickyBar.value, false, 'an absent hero must not count as scrolled out')
    mounted.bindings.heroSection.value = { getBoundingClientRect: () => ({ bottom: 600 }) }
    await settle()
    assert.equal(mounted.bindings.showStickyBar.value, false)
    mounted.bindings.heroSection.value = { getBoundingClientRect: () => ({ bottom: 20 }) }
    await settle()
    assert.equal(mounted.bindings.showStickyBar.value, true)
  } finally {
    gate.resolve({ status: 200, data: null })
    await settle()
    mounted.unmount()
    globalThis.$fetch = originalFetch
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
    restore()
  }
})

test('applications page finishes setup and exposes loading while the API is unresolved', async () => {
  const restore = installNuxtBoundary()
  const gate = deferred()
  const original = ProjectService.getMyApplications
  ProjectService.getMyApplications = () => gate.promise
  const { default: Page } = await import('../app/pages/projects/my-applications.vue')
  const mounted = mountPage(Page)
  try {
    await settle()
    assert.ok(mounted.bindings, 'destination setup must not wait for application data')
    assert.equal(mounted.bindings.pending.value, true)
    gate.resolve({ status: 200, data: [{ id: 'application-1', status: 'pending' }] })
    await settle()
    assert.equal(mounted.bindings.pending.value, false)
    assert.equal(mounted.bindings.applications.value[0].id, 'application-1')
  } finally {
    gate.resolve({ status: 200, data: [] })
    await settle()
    mounted.unmount()
    ProjectService.getMyApplications = original
    restore()
  }
})

for (const owner of ['owner', 'another-user']) {
  test(`applicants page waits for project identity and enforces ownership (${owner})`, async () => {
    const restore = installNuxtBoundary()
    const gate = deferred()
    const originalProject = ProjectService.getProjectBySlug
    const originalApplicants = ProjectService.getProjectApplicants
    const requestedIds = []
    ProjectService.getProjectBySlug = () => gate.promise
    ProjectService.getProjectApplicants = async id => {
      requestedIds.push(id)
      return { status: 200, data: [{ id: 'applicant-1', status: 'pending' }] }
    }
    const { default: Page } = await import('../app/pages/projects/[slug]/applicants.vue')
    const mounted = mountPage(Page)
    try {
      await settle()
      assert.ok(mounted.bindings, 'destination setup must not wait for project data')
      assert.equal(mounted.bindings.pending.value, true)
      assert.deepEqual(requestedIds, [])
      gate.resolve({ status: 200, data: { id: 'project-1', title: 'Slow project', creator_id: owner } })
      await settle()
      if (owner === 'owner') {
        assert.deepEqual(requestedIds, ['project-1'])
        assert.equal(mounted.bindings.applications.value[0].id, 'applicant-1')
      } else {
        assert.deepEqual(requestedIds, [])
        assert.equal(mounted.bindings.project.value, undefined)
        assert.equal(mounted.bindings.projectError.value.statusCode, 403)
      }
    } finally {
      gate.resolve({ status: 200, data: null })
      await settle()
      mounted.unmount()
      ProjectService.getProjectBySlug = originalProject
      ProjectService.getProjectApplicants = originalApplicants
      restore()
    }
  })
}
