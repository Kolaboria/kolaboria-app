import type {
  ProjectDefinitionInput,
  ProjectDetailResponse,
  ProjectEditorPersistence
} from '../../app/types/project-editor'
import type { ProjectStatus } from '../../app/types/project'

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

const toDetail = (
  definition: ProjectDefinitionInput | ProjectDetailResponse,
  id: string,
  status: ProjectStatus,
  version: number,
  userId: string
): ProjectDetailResponse => {
  const now = new Date().toISOString()
  const ownerId = definition.creation_mode === 'personal' ? userId : null

  return {
    ...definition,
    id,
    slug: definition.slug,
    status,
    version,
    created_at: now,
    updated_at: now,
    published_at: status === 'draft' ? null : now,
    ownership: {
      created_by_user_id: userId,
      initiator_user_id: ownerId,
      initiator_organization_id: definition.initiator_organization_id,
      owner_id: ownerId,
      show_initiator: definition.creation_mode === 'organization_initiated',
      can_accept_contributors: status === 'open'
    },
    owner_role: null,
    viewer_application: null,
    roles: definition.roles.map((role, index) => ({
      id: role.id ?? `${id}-role-${index + 1}`,
      contribution_role_id: role.contribution_role_id,
      contribution_role: null,
      description: role.description,
      capacity: role.capacity,
      position: index,
      skill_ids: role.skill_ids,
      skills: [],
      tool_ids: role.tool_ids,
      tools: [],
      filled_capacity: 0,
      remaining_capacity: role.capacity,
      status: 'open'
    }))
  }
}

export const createProjectEditorTestPersistence = (
  options: { delayMs?: number; currentUserId?: string } = {}
): ProjectEditorPersistence => {
  const records = new Map<string, ProjectDetailResponse>()
  let sequence = 0
  const userId = options.currentUserId ?? 'test-user'
  const wait = () => delay(options.delayMs ?? 0)

  return {
    async create(request) {
      await wait()
      const id = `test-project-${++sequence}`
      const detail = toDetail(request.definition, id, 'draft', 1, userId)
      records.set(id, detail)
      return detail
    },
    async publishNew(request) {
      await wait()
      const id = `test-project-${++sequence}`
      const status = request.definition.creation_mode === 'organization_initiated'
        ? 'awaiting_owner'
        : 'open'
      const detail = toDetail(request.definition, id, status, 1, userId)
      records.set(id, detail)
      return detail
    },
    async update(id, request) {
      await wait()
      const current = records.get(id)
      const detail = toDetail(
        request.definition,
        id,
        current?.status ?? 'draft',
        request.version + 1,
        userId
      )
      records.set(id, detail)
      return detail
    },
    async publish(id, request) {
      await wait()
      const current = records.get(id)
      if (!current) throw new Error('Project not found')
      const status =
        current.creation_mode === 'organization_initiated'
          ? 'awaiting_owner'
          : 'open'
      const detail = toDetail(current, id, status, request.version + 1, userId)
      records.set(id, detail)
      return detail
    },
    async loadBySlug(slug) {
      await wait()
      const detail = [...records.values()].find((record) => record.slug === slug)
      if (!detail) throw new Error('Project not found')
      return detail
    }
  }
}
