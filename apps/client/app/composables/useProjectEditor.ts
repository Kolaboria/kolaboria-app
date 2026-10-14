import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { z } from 'zod'
import { createBlankProjectEditorDraft } from '../data/project-editor-defaults'
import {
  getProjectEditorStepForError,
  validateProjectEditorDraft,
  validateProjectEditorStructure,
  validateProjectEditorStep
} from '../data/project-editor-validation'
import {
  toProjectDefinition,
  toProjectEditorRecord
} from '../utils/project-editor-api'
import { getApiErrorMessage, getApiErrorStatus } from '../utils/error'
import type {
  ProjectDetailResponse,
  ProjectEditorDraft,
  ProjectCreationMode,
  ProjectEditorErrors,
  ProjectEditorOptions,
  ProjectEditorRecord,
  ProjectEditorStep
} from '../types/project-editor'

const roleSchema = z.object({
  client_key: z.string().min(1),
  id: z.string().optional(),
  contribution_role_id: z.string().optional(),
  description: z.string(),
  capacity: z.number().int(),
  filled_capacity: z.number().int().nonnegative(),
  tool_ids: z.array(z.string()),
  skill_ids: z.array(z.string())
})

const draftSchema = z.object({
  creation_mode: z
    .enum(['personal', 'organization_initiated'])
    .default('personal'),
  initiator_organization_id: z.string().nullable().default(null),
  lead_expectations: z.string().default(''),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  slug: z.string(),
  project_category: z.enum([
    'product',
    'community',
    'open_source',
    'research',
    'education',
    'business',
    'other'
  ]),
  visibility: z.enum(['public', 'private', 'invite_only']),
  roles: z.array(roleSchema),
  owner_contribution_role_id: z.string().optional(),
  origin: z.enum(['personal', 'community', 'experiment', 'client']),
  why_collaborative: z.string(),
  contributor_outcome: z.string(),
  owner_commitment: z.string(),
  client_acknowledgement: z.boolean(),
  start_date: z.string().nullable(),
  deadline: z.string().nullable(),
  availability: z.enum(['flexible', 'part_time', 'weekends_only', 'full_time']),
  hours_per_week: z.union([
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(20)
  ]),
  collaboration_agreement: z.boolean()
})

const pendingCreateSchema = z.object({
  clientRequestId: z.string().uuid(),
  draft: draftSchema
})
type PendingCreate = { clientRequestId: string; draft: ProjectEditorDraft }

const getBrowserSessionStorage =
  (): ProjectEditorOptions['pendingCreateStorage'] => {
    try {
      return typeof window === 'undefined' ? null : window.sessionStorage
    } catch {
      return null
    }
  }

const readPendingCreates = (
  storage: ProjectEditorOptions['pendingCreateStorage'],
  key: string
): Map<string, PendingCreate> => {
  if (!storage) return new Map()
  try {
    const raw = storage.getItem(key)
    if (!raw) return new Map()
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      return new Map()
    const result = new Map<string, PendingCreate>()
    for (const [scope, value] of Object.entries(parsed)) {
      const validated = pendingCreateSchema.safeParse(value)
      if (validated.success) result.set(scope, validated.data as PendingCreate)
    }
    return result
  } catch {
    return new Map()
  }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const newRequestId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function')
    return globalThis.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16)
      return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16)
    }
  )
}

const snapshotDraft = (draft: ProjectEditorDraft) => JSON.stringify(draft)
const draftScope = (draft: ProjectEditorDraft) =>
  draft.creation_mode === 'personal'
    ? 'personal'
    : 'organization:' + (draft.initiator_organization_id || 'unselected')

const hasValidOrganizationFields = (draft: ProjectEditorDraft) =>
  draft.visibility === 'public' &&
  !draft.owner_commitment.trim() &&
  !draft.owner_contribution_role_id

export const useProjectEditor = (options: ProjectEditorOptions) => {
  const pendingCreateStorage =
    options.pendingCreateStorage === undefined
      ? getBrowserSessionStorage()
      : options.pendingCreateStorage
  const pendingCreateStorageKey = `kolaboria:project-editor-pending-create:v1:${encodeURIComponent(options.currentUserId || 'unknown-account')}`
  const recoveredPendingCreates =
    options.mode === 'create'
      ? readPendingCreates(pendingCreateStorage, pendingCreateStorageKey)
      : new Map<string, PendingCreate>()
  const blankDraft = createBlankProjectEditorDraft()
  const pendingForInitialScope = recoveredPendingCreates.get(
    draftScope(options.initialDraft ?? blankDraft)
  )
  const recoveredPendingDraft =
    pendingForInitialScope?.draft ??
    (recoveredPendingCreates.size === 1
      ? [...recoveredPendingCreates.values()][0]?.draft
      : undefined)
  const initialDraft =
    options.initialRecord?.draft ??
    options.initialDraft ??
    recoveredPendingDraft ??
    blankDraft
  const record = ref<ProjectEditorRecord | null>(
    options.initialRecord ? clone(options.initialRecord) : null
  )
  const draft = ref<ProjectEditorDraft>(clone(initialDraft))
  const currentStep = ref<ProjectEditorStep>(0)
  const errors = ref<ProjectEditorErrors>({})
  const submitError = ref('')
  const storageWarning = ref('')
  const isSubmitting = ref(false)
  const saveResult = ref<{
    kind: 'draft' | 'published' | 'updated'
    message: string
  } | null>(null)
  const baseline = ref(snapshotDraft(draft.value))
  const pendingCreates = new Map<string, PendingCreate>(
    [...recoveredPendingCreates].map(([scope, pending]) => [
      `${options.currentUserId}:${scope}`,
      pending
    ])
  )
  const modeDrafts = ref(
    new Map<
      string,
      {
        draft: ProjectEditorDraft
        record: ProjectEditorRecord | null
        baseline: string
      }
    >()
  )
  const isDirty = computed(
    () =>
      snapshotDraft(draft.value) !== baseline.value ||
      [...modeDrafts.value].some(
        ([scope, saved]) =>
          scope !== draftScope(draft.value) &&
          snapshotDraft(saved.draft) !== saved.baseline
      )
  )
  const totalCapacity = computed(() =>
    draft.value.roles.reduce(
      (sum, role) =>
        sum +
        (Number.isSafeInteger(role.capacity) && role.capacity > 0
          ? role.capacity
          : 0),
      0
    )
  )
  const canPublish = computed(
    () =>
      (options.contextAvailable?.() ?? true) &&
      (draft.value.creation_mode === 'personal' ||
        selectedOrganization.value !== null) &&
      options.eligibility?.email_verified === true &&
      options.eligibility.onboarding_completed === true
  )
  const organizations = computed(() =>
    options.creationContext?.system_role === 'admin'
      ? options.creationContext.initiable_organizations
      : []
  )
  const selectedOrganization = computed(() => {
    const ownership = record.value?.ownership
    if (options.mode === 'edit' && ownership?.owner_id === options.currentUserId &&
      ownership.initiator_organization_id === draft.value.initiator_organization_id &&
      ownership.initiator_organization_id) {
      return ownership.initiator_organization ?? { id: ownership.initiator_organization_id, name: 'Organisasi pemrakarsa' }
    }
    return organizations.value.find((org) => org.id === draft.value.initiator_organization_id) ?? null
  })
  const canInitiateOrganization = computed(() => organizations.value.length > 0)

  baseline.value = snapshotDraft(draft.value)

  let roleSequence = draft.value.roles.length + 1
  let isMounted = true

  const persistenceScope = () =>
    options.currentUserId + ':' + draftScope(draft.value)

  const persistPendingCreates = () => {
    if (!pendingCreateStorage) {
      storageWarning.value =
        'Pemulihan retry create tidak tersedia di sesi browser ini. Simpan proyek sebelum meninggalkan halaman.'
      return
    }
    const prefix = `${options.currentUserId}:`
    const values: Record<string, PendingCreate> = {}
    for (const [scope, pending] of pendingCreates) {
      if (scope.startsWith(prefix)) values[scope.slice(prefix.length)] = pending
    }
    try {
      if (Object.keys(values).length)
        pendingCreateStorage.setItem(
          pendingCreateStorageKey,
          JSON.stringify(values)
        )
      else pendingCreateStorage.removeItem(pendingCreateStorageKey)
    } catch {
      storageWarning.value =
        'Pemulihan retry create tidak tersedia di sesi browser ini. Simpan proyek sebelum meninggalkan halaman.'
    }
  }

  const validateForPersistence = (published: boolean) => {
    errors.value = published
      ? validateProjectEditorDraft(draft.value, options.references)
      : validateProjectEditorStructure(draft.value)
    if (Object.keys(errors.value).length) {
      const firstInvalid = getProjectEditorStepForError(errors.value)
      if (firstInvalid !== null) currentStep.value = firstInvalid
      return false
    }
    return true
  }

  const reconcileCreateResult = (
    latest: ProjectEditorDraft,
    frozen: ProjectEditorDraft,
    persisted: ProjectEditorRecord
  ) => {
    const next = clone(latest)
    for (const role of next.roles) {
      if (role.id) continue
      const originalIndex = frozen.roles.findIndex(
        (item) => item.client_key === role.client_key
      )
      if (originalIndex >= 0) role.id = persisted.draft.roles[originalIndex]?.id
    }
    return next
  }

  const persistToServer = async (
    kind: 'draft' | 'updated'
  ): Promise<boolean> => {
    const persistence = options.persistence
    if (!(options.contextAvailable?.() ?? true)) {
      submitError.value =
        'Informasi akunmu perlu dimuat kembali sebelum menyimpan. Isian tetap tersedia.'
      return false
    }
    if (
      !validateForPersistence(
        kind === 'updated' && record.value?.status !== 'draft'
      )
    )
      return false
    if (
      (draft.value.creation_mode === 'organization_initiated' &&
        (!selectedOrganization.value ||
          !hasValidOrganizationFields(draft.value))) ||
      (draft.value.creation_mode === 'personal' &&
        draft.value.initiator_organization_id)
    ) {
      submitError.value =
        'Pilihan inisiasi tidak sesuai. Pilih organisasi yang diizinkan dan pertahankan ownership sesuai mode proyek.'
      return false
    }

    const scope = persistenceScope()
    const frozenDraft = clone(draft.value)
    try {
      let detail: Awaited<ReturnType<typeof persistence.create>>
      let frozenCreate: {
        clientRequestId: string
        draft: ProjectEditorDraft
      } | null = null
      if (options.mode === 'create' && !record.value?.id) {
        frozenCreate = pendingCreates.get(scope) ?? {
          clientRequestId: newRequestId(),
          draft: frozenDraft
        }
        pendingCreates.set(scope, frozenCreate)
        persistPendingCreates()
        detail = await persistence.create({
          client_request_id: frozenCreate.clientRequestId,
          definition: toProjectDefinition(frozenCreate.draft)
        })
      } else {
        if (!record.value?.id) {
          submitError.value =
            'Proyek belum termuat dari server. Muat ulang halaman sebelum menyimpan.'
          return false
        }
        detail = await persistence.update(record.value.id, {
          version: record.value.version,
          definition: toProjectDefinition(frozenDraft)
        })
      }

      if (
        !isMounted ||
        !(options.contextAvailable?.() ?? true) ||
        scope !== persistenceScope()
      )
        return false
      const serverRecord = toProjectEditorRecord(detail)
      let savedRecord = serverRecord
      if (frozenCreate) {
        pendingCreates.delete(scope)
        persistPendingCreates()
        const latest = clone(draft.value)
        const unchangedSinceRequest =
          snapshotDraft(latest) === snapshotDraft(frozenCreate.draft)
        draft.value = unchangedSinceRequest
          ? clone(serverRecord.draft)
          : reconcileCreateResult(latest, frozenCreate.draft, serverRecord)
        record.value = serverRecord
        baseline.value = snapshotDraft(serverRecord.draft)
        if (!unchangedSinceRequest) {
          const updatedDetail = await persistence.update(serverRecord.id, {
            version: serverRecord.version,
            definition: toProjectDefinition(draft.value)
          })
          if (
            !isMounted ||
            !(options.contextAvailable?.() ?? true) ||
            scope !== persistenceScope()
          )
            return false
          savedRecord = toProjectEditorRecord(updatedDetail)
          draft.value = clone(savedRecord.draft)
        }
      } else {
        draft.value = clone(serverRecord.draft)
      }
      record.value = savedRecord
      baseline.value = snapshotDraft(savedRecord.draft)
      submitError.value = ''
      storageWarning.value = ''
      saveResult.value = {
        kind,
        message:
          kind === 'draft'
            ? 'Draft proyek berhasil disimpan.'
            : 'Perubahan proyek berhasil disimpan.'
      }
      return true
    } catch (error: unknown) {
      const status = getApiErrorStatus(error)
      const definitiveCreateConflict =
        status === 409 && options.mode === 'create' && !record.value?.id
      if (
        (status !== undefined &&
          status >= 400 &&
          status < 500 &&
          status !== 409) ||
        definitiveCreateConflict
      ) {
        pendingCreates.delete(scope)
        persistPendingCreates()
      }
      if (
        isMounted &&
        (options.contextAvailable?.() ?? true) &&
        scope === persistenceScope()
      ) {
        submitError.value = getApiErrorMessage(
          error,
          kind === 'draft'
            ? 'Draft belum tersimpan. Coba lagi; isianmu tetap tersedia.'
            : 'Perubahan belum tersimpan. Periksa koneksi lalu coba lagi.'
        )
      }
      return false
    }
  }

  const validateStep = (step: ProjectEditorStep) => {
    const stepErrors = validateProjectEditorStep(
      step,
      draft.value,
      options.references
    )
    errors.value = { ...errors.value, ...stepErrors }
    for (const key of Object.keys(errors.value)) {
      if (!stepErrors[key]) delete errors.value[key]
    }
    return Object.keys(stepErrors).length === 0
  }

  const validateAll = () => {
    errors.value = validateProjectEditorDraft(draft.value, options.references)
    if (Object.keys(errors.value).length) {
      const firstInvalid = getProjectEditorStepForError(errors.value)
      if (firstInvalid !== null) currentStep.value = firstInvalid
      return false
    }
    return true
  }

  const goToStep = (step: number) => {
    if (!Number.isInteger(step) || step < 0 || step > 4 || isSubmitting.value)
      return false
    if (options.mode === 'create' && step > currentStep.value) {
      for (let index = currentStep.value; index < step; index += 1) {
        if (!validateStep(index as ProjectEditorStep)) {
          currentStep.value = index as ProjectEditorStep
          return false
        }
      }
    }
    currentStep.value = step as ProjectEditorStep
    submitError.value = ''
    saveResult.value = null
    return true
  }

  const next = () => {
    if (currentStep.value >= 4 || isSubmitting.value) return false
    if (!validateStep(currentStep.value)) return false
    currentStep.value = (currentStep.value + 1) as ProjectEditorStep
    submitError.value = ''
    saveResult.value = null
    return true
  }

  const back = () => goToStep(currentStep.value - 1)

  const addRole = () => {
    if (isSubmitting.value) return
    let clientKey = 'role-create-' + roleSequence
    while (draft.value.roles.some((role) => role.client_key === clientKey)) {
      roleSequence += 1
      clientKey = 'role-create-' + roleSequence
    }
    roleSequence += 1
    draft.value.roles.push({
      client_key: clientKey,
      description: '',
      capacity: 1,
      filled_capacity: 0,
      tool_ids: [],
      skill_ids: []
    })
    saveResult.value = null
  }

  const removeRole = (clientKey: string) => {
    const index = draft.value.roles.findIndex(
      (role) => role.client_key === clientKey
    )
    if (index < 0 || isSubmitting.value || draft.value.roles.length <= 1)
      return false
    if ((draft.value.roles[index]?.filled_capacity ?? 0) > 0) {
      errors.value['roles.' + clientKey + '.capacity'] =
        'Peran tidak dapat dihapus karena sudah memiliki anggota.'
      return false
    }
    draft.value.roles.splice(index, 1)
    delete errors.value['roles.' + clientKey + '.capacity']
    saveResult.value = null
    return true
  }

  const setOrigin = (origin: ProjectEditorDraft['origin']) => {
    draft.value.origin = origin
    if (origin !== 'client') draft.value.client_acknowledgement = false
    delete errors.value.origin
    delete errors.value.client_acknowledgement
    saveResult.value = null
  }

  const activateDraft = (
    mode: ProjectCreationMode,
    organizationId: string | null
  ) => {
    if (
      options.mode !== 'create' ||
      isSubmitting.value ||
      !(options.contextAvailable?.() ?? true) ||
      !['personal', 'organization_initiated'].includes(mode) ||
      (mode === 'organization_initiated' &&
        !organizations.value.some((org) => org.id === organizationId))
    )
      return false
    const nextScope =
      mode === 'personal' ? 'personal' : 'organization:' + organizationId
    if (nextScope === draftScope(draft.value)) return true
    modeDrafts.value.set(draftScope(draft.value), {
      draft: clone(draft.value),
      record: clone(record.value),
      baseline: baseline.value
    })
    const previous = modeDrafts.value.get(nextScope)
    const pending = pendingCreates.get(`${options.currentUserId}:${nextScope}`)
    draft.value = previous
      ? clone(previous.draft)
      : pending
        ? clone(pending.draft)
        : {
            ...createBlankProjectEditorDraft(),
            creation_mode: mode,
            initiator_organization_id: organizationId
          }
    record.value = previous ? clone(previous.record) : null
    baseline.value = previous?.baseline ?? snapshotDraft(draft.value)
    currentStep.value = 0
    errors.value = {}
    submitError.value = ''
    saveResult.value = null
    return true
  }
  const setCreationMode = (mode: ProjectCreationMode) =>
    activateDraft(
      mode,
      mode === 'personal' ? null : (organizations.value[0]?.id ?? null)
    )
  const selectOrganization = (id: string) =>
    draft.value.creation_mode === 'organization_initiated'
      ? activateDraft('organization_initiated', id)
      : false

  const saveDraft = async () => {
    if (isSubmitting.value || options.mode !== 'create') return false
    isSubmitting.value = true
    submitError.value = ''
    saveResult.value = null
    try {
      return await persistToServer('draft')
    } finally {
      isSubmitting.value = false
    }
  }

  const saveChanges = async () => {
    if (isSubmitting.value || options.mode !== 'edit' || !record.value)
      return false
    if (!validateAll()) return false
    isSubmitting.value = true
    submitError.value = ''
    saveResult.value = null
    try {
      return await persistToServer('updated')
    } finally {
      isSubmitting.value = false
    }
  }

  const publish = async () => {
    const publishingSavedDraft =
      options.mode === 'edit' && record.value?.status === 'draft'
    if (
      isSubmitting.value ||
      (options.mode !== 'create' && !publishingSavedDraft) ||
      !validateAll()
    )
      return false
    if (!canPublish.value) {
      submitError.value =
        'Verifikasi email dan selesaikan onboarding sebelum memublikasikan proyek.'
      return false
    }
    isSubmitting.value = true
    submitError.value = ''
    saveResult.value = null
    try {
      if (!record.value || isDirty.value) {
        const saved = await persistToServer(record.value ? 'updated' : 'draft')
        if (!saved) return false
      }
      if (isDirty.value && !(await persistToServer('updated'))) return false
      if (!canPublish.value) {
        submitError.value =
          'Persyaratan publikasi berubah. Periksa kembali informasi akun sebelum mencoba lagi.'
        return false
      }
      if (!record.value?.id || !(options.contextAvailable?.() ?? true))
        return false
      const detail = await options.persistence.publish(record.value.id, {
        version: record.value.version
      })
      if (!isMounted || !(options.contextAvailable?.() ?? true)) return false
      record.value = toProjectEditorRecord(detail)
      draft.value = clone(record.value.draft)
      baseline.value = snapshotDraft(draft.value)
      saveResult.value = {
        kind: 'published',
        message:
          detail.status === 'awaiting_owner'
            ? 'Proyek dipublikasikan dan menunggu Project Lead.'
            : 'Proyek berhasil dipublikasikan.'
      }
      return true
    } catch (error: unknown) {
      if (isMounted && (options.contextAvailable?.() ?? true)) {
        submitError.value = getApiErrorMessage(
          error,
          'Draft tersimpan, tetapi publikasi belum berhasil. Coba lagi.'
        )
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  onBeforeUnmount(() => {
    isMounted = false
  })

  const acceptServerDetail = (detail: ProjectDetailResponse) => {
    record.value = toProjectEditorRecord(detail)
    draft.value = clone(record.value.draft)
    baseline.value = snapshotDraft(draft.value)
    modeDrafts.value.clear()
    errors.value = {}
    submitError.value = ''
  }

  return {
    draft,
    record,
    currentStep,
    errors,
    submitError,
    storageWarning,
    isSubmitting,
    saveResult,
    isDirty,
    totalCapacity,
    canPublish,
    canInitiateOrganization,
    selectedOrganization,
    goToStep,
    next,
    back,
    addRole,
    removeRole,
    setOrigin,
    setCreationMode,
    selectOrganization,
    validateStep,
    validateAll,
    saveDraft,
    saveChanges,
    publish,
    acceptServerDetail
  }
}
