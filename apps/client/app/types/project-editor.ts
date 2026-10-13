import type { ProjectCategory, ProjectStatus, ProjectVisibility } from '~/types/project'
import type { Skill, Tool } from '~/types/skill'
import type { SystemRole } from '~/types/auth'

export type ProjectEditorMode = 'create' | 'edit'
export type ProjectCreationMode = 'personal' | 'organization_initiated'
export interface ProjectEditorCreationContext {
  system_role: SystemRole
  initiable_organizations: Array<{ id: string; name: string }>
}
export interface ProjectEditorOwnership {
  created_by_user_id: string
  initiator_user_id: string | null
  initiator_organization_id: string | null
  owner_id: string | null
  show_initiator: boolean
  can_accept_contributors: boolean
  owner_profile?: ProjectPublicProfileResponse | null
  initiator_profile?: ProjectPublicProfileResponse | null
  initiator_organization?: ProjectOrganizationResponse | null
}
export interface ProjectPublicProfileResponse {
  id: string
  username: string
  full_name: string | null
  headline: string | null
  avatar: string | null
  is_verified: boolean
}
export interface ProjectOrganizationResponse {
  id: string
  name: string
  slug: string
}
export interface ViewerApplicationResponse {
  id: string
  status: 'pending' | 'accepted'
  applied_at: string
}
export type ProjectEditorStep = 0 | 1 | 2 | 3 | 4
export type ProjectOrigin = 'personal' | 'community' | 'experiment' | 'client'
export type ProjectEditorAvailability = 'flexible' | 'part_time' | 'weekends_only' | 'full_time'
export type ProjectEditorHours = 5 | 10 | 15 | 20

export interface ProjectEditorRole {
  client_key: string
  id?: string
  contribution_role_id?: string
  description: string
  capacity: number
  filled_capacity: number
  tool_ids: string[]
  skill_ids: string[]
}

export interface ProjectEditorDraft {
  creation_mode: ProjectCreationMode
  initiator_organization_id: string | null
  title: string
  summary: string
  description: string
  slug: string
  project_category: ProjectCategory
  visibility: ProjectVisibility
  roles: ProjectEditorRole[]
  owner_contribution_role_id?: string
  origin: ProjectOrigin
  why_collaborative: string
  contributor_outcome: string
  owner_commitment: string
  lead_expectations: string
  client_acknowledgement: boolean
  start_date: string | null
  deadline: string | null
  availability: ProjectEditorAvailability
  hours_per_week: ProjectEditorHours
  collaboration_agreement: boolean
}

export interface ProjectEditorRoleOption {
  id: string
  name: string
  slug: string
  category?: string | null
}

export interface ProjectEditorReferences {
  contribution_roles: ProjectEditorRoleOption[]
  skills: Skill[]
  tools: Tool[]
}

export type ProjectEditorCatalogKey = 'contribution_roles' | 'skills' | 'tools'

export interface ProjectEditorCatalogState {
  loaded: boolean
  loading: boolean
  error: string
}

export type ProjectEditorCatalogStates = Record<
  ProjectEditorCatalogKey,
  ProjectEditorCatalogState
>

export interface ProjectEditorRecord {
  id: string
  slug: string
  status: ProjectStatus | 'awaiting_owner'
  ownership?: ProjectEditorOwnership
  draft: ProjectEditorDraft
  saved_at: string
  version: number
}

export interface ProjectRoleWriteInput {
  id: string | null
  contribution_role_id: string | null
  description: string
  capacity: number
  skill_ids: string[]
  tool_ids: string[]
}

export interface ProjectDefinitionInput {
  creation_mode: ProjectCreationMode
  initiator_organization_id: string | null
  title: string
  summary: string
  description: string
  slug: string
  project_category: ProjectCategory
  visibility: ProjectVisibility
  owner_contribution_role_id: string | null
  origin: ProjectOrigin
  why_collaborative: string
  contributor_outcome: string
  owner_commitment: string
  lead_expectations: string
  client_acknowledgement: boolean
  start_date: string | null
  deadline: string | null
  availability: ProjectEditorAvailability
  hours_per_week: ProjectEditorHours
  collaboration_agreement: boolean
  roles: ProjectRoleWriteInput[]
}

export interface CreateProjectDraftRequest {
  client_request_id: string
  definition: ProjectDefinitionInput
}

export interface UpdateProjectDefinitionRequest {
  version: number
  definition: ProjectDefinitionInput
}

export interface PublishProjectRequest {
  version: number
}

export interface ProjectEditorDetailRole {
  id: string
  contribution_role_id: string | null
  contribution_role: ProjectEditorRoleOption | null
  description: string
  capacity: number
  position: number
  skill_ids: string[]
  skills: ProjectEditorRoleOption[]
  tool_ids: string[]
  tools: ProjectEditorRoleOption[]
  filled_capacity: number
  remaining_capacity: number
  status: 'open' | 'filled' | 'archived'
}

export interface ProjectSummaryResponse {
  id: string
  slug: string
  title: string
  summary: string
  project_category: ProjectCategory
  origin: ProjectOrigin
  status: ProjectStatus
  owner_id: string | null
  owner_profile?: ProjectPublicProfileResponse | null
  initiator_organization_id: string | null
  initiator_organization?: ProjectOrganizationResponse | null
  total_capacity: number
  filled_capacity: number
  hours_per_week: number
  deadline: string | null
  skills: ProjectEditorRoleOption[]
  tools: ProjectEditorRoleOption[]
  created_at: string
}

export interface MyProjectSummaryResponse extends ProjectSummaryResponse {
  my_scope: 'owned' | 'initiated'
  roles: Array<{ name: string; capacity: number }>
  pending_application_count?: number | null
}

export interface ProjectEditorOwnerRole {
  contribution_role_id: string
  contribution_role: ProjectEditorRoleOption
}

export interface ProjectDetailResponse extends Omit<ProjectDefinitionInput, 'roles' | 'owner_contribution_role_id'> {
  id: string
  status: ProjectStatus | 'awaiting_owner'
  version: number
  created_at: string
  updated_at: string
  published_at: string | null
  ownership: ProjectEditorOwnership
  owner_role: ProjectEditorOwnerRole | null
  roles: ProjectEditorDetailRole[]
  viewer_application: ViewerApplicationResponse | null
}

export interface ProjectEditorPersistence {
  create(request: CreateProjectDraftRequest): Promise<ProjectDetailResponse>
  update(id: string, request: UpdateProjectDefinitionRequest): Promise<ProjectDetailResponse>
  publish(id: string, request: PublishProjectRequest): Promise<ProjectDetailResponse>
  loadBySlug(slug: string): Promise<ProjectDetailResponse>
}

export type ProjectEditorErrors = Record<string, string>

export interface ProjectEditorEligibility {
  email_verified: boolean
  onboarding_completed: boolean
}

export interface ProjectEditorOptions {
  mode: ProjectEditorMode
  slug?: string
  currentUserId: string
  references: ProjectEditorReferences
  initialRecord?: ProjectEditorRecord | null
  initialDraft?: ProjectEditorDraft
  eligibility?: ProjectEditorEligibility
  creationContext?: ProjectEditorCreationContext
  persistence: ProjectEditorPersistence
  contextAvailable?: () => boolean
  pendingCreateStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
}
