import type {
  ProjectDefinitionInput,
  ProjectDetailResponse,
  ProjectEditorDraft,
  ProjectEditorRecord
} from '../types/project-editor'

export const toProjectDefinition = (
  draft: ProjectEditorDraft
): ProjectDefinitionInput => ({
  creation_mode: draft.creation_mode,
  initiator_organization_id: draft.initiator_organization_id,
  title: draft.title,
  summary: draft.summary,
  description: draft.description,
  slug: draft.slug,
  project_category: draft.project_category,
  visibility: draft.visibility,
  owner_contribution_role_id:
    draft.creation_mode === 'personal'
      ? draft.owner_contribution_role_id ?? null
      : null,
  origin: draft.origin,
  why_collaborative: draft.why_collaborative,
  contributor_outcome: draft.contributor_outcome,
  owner_commitment: draft.owner_commitment,
  lead_expectations: draft.lead_expectations,
  client_acknowledgement: draft.client_acknowledgement,
  start_date: draft.start_date,
  deadline: draft.deadline,
  availability: draft.availability,
  hours_per_week: draft.hours_per_week,
  collaboration_agreement: draft.collaboration_agreement,
  roles: draft.roles.map((role) => ({
    id: role.id ?? null,
    contribution_role_id: role.contribution_role_id ?? null,
    description: role.description,
    capacity: role.capacity,
    skill_ids: [...role.skill_ids],
    tool_ids: [...role.tool_ids]
  }))
})

export const toProjectEditorRecord = (
  detail: ProjectDetailResponse
): ProjectEditorRecord => ({
  id: detail.id,
  slug: detail.slug,
  status: detail.status,
  ownership: detail.ownership,
  saved_at: detail.updated_at,
  version: detail.version,
  draft: {
    creation_mode: detail.creation_mode,
    initiator_organization_id: detail.initiator_organization_id,
    title: detail.title,
    summary: detail.summary,
    description: detail.description,
    slug: detail.slug,
    project_category: detail.project_category,
    visibility: detail.visibility,
    owner_contribution_role_id:
      detail.creation_mode === 'personal' ? detail.owner_role?.contribution_role_id ?? undefined : undefined,
    origin: detail.origin,
    why_collaborative: detail.why_collaborative,
    contributor_outcome: detail.contributor_outcome,
    owner_commitment: detail.owner_commitment,
    lead_expectations: detail.lead_expectations,
    client_acknowledgement: detail.client_acknowledgement,
    start_date: detail.start_date,
    deadline: detail.deadline,
    availability: detail.availability,
    hours_per_week: detail.hours_per_week,
    collaboration_agreement: detail.collaboration_agreement,
    roles: detail.roles.map((role) => ({
      client_key: role.id,
      id: role.id,
      contribution_role_id: role.contribution_role_id ?? undefined,
      description: role.description,
      capacity: role.capacity,
      filled_capacity: role.filled_capacity,
      skill_ids: [...role.skill_ids],
      tool_ids: [...role.tool_ids]
    }))
  }
})
