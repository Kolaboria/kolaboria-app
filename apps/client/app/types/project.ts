import type { ProjectCategory } from '~/constants/projectCategory'

export type { ProjectCategory }
export type ProjectStatus =
  | 'draft'
  | 'open'
  | 'awaiting_owner'
  | 'in_progress'
  | 'completed'
  | 'archived'
export type ProjectOutcome = 'completed' | 'cancelled' | 'abandoned'
export type ProjectVisibility = 'public' | 'private' | 'invite_only'
export type ApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
export type ProjectMemberRole = 'owner' | 'contributor'
export type ProjectAvailability =
  | 'full_time'
  | 'part_time'
  | 'weekends_only'
  | 'flexible'
export type ApplicantAvailability = ProjectAvailability

export interface ViewerApplicationResponse {
  id: string
  status: ApplicationStatus
  applied_at: string
  reviewed_at?: string | null
  withdrawn_at?: string | null
  retry_after?: string | null
  retry_after_estimated?: boolean
  reapply_block_reason?: string | null
}

export interface SkillTag {
  id: string
  name: string
}

export interface MasterItem {
  id: string
  name: string
  slug: string
  category: string
}

export interface ProjectTechnology {
  tool_id: string
  is_primary: boolean
  tool: MasterItem
}

export interface ProjectRoleInput {
  id?: string
  contribution_role_id?: string
  custom_title?: string
  description?: string
  capacity: number
  tool_ids: string[]
}

export interface ProjectRole {
  id: string
  contribution_role_id: string | null
  contribution_role?: MasterItem | null
  custom_title: string | null
  description: string | null
  capacity: number
  filled_capacity: number
  remaining_capacity: number
  status: 'open' | 'filled' | 'archived'
  tools: MasterItem[]
  skill_tags?: string[]
}

export interface ProjectSkill {
  skill_tag_id: string
  is_required: boolean
  skill_tags: SkillTag
}

export interface ProjectMember {
  id: string
  project_id: string
  profile_id: string
  role: ProjectMemberRole
  project_role_id?: string | null
  contribution_role_id?: string | null
  custom_role_title?: string | null
  status?: 'active' | 'left' | 'removed'
  joined_at: string
  left_at?: string | null
  removed_at?: string | null
  project_role?: ProjectRole | null
  contribution_role?: MasterItem | null
  profiles?: {
    username: string
    full_name: string | null
    avatar: string | null
  }
}

export interface Project {
  id: string
  creator_id: string
  title: string
  slug: string
  summary: string
  description: string | null
  project_category: ProjectCategory
  visibility: ProjectVisibility
  status: ProjectStatus
  outcome?: ProjectOutcome | null
  max_slots: number
  availability?: ProjectAvailability
  start_date: string | null
  deadline: string | null
  why_join: string | null
  created_at: string
  published_at: string | null
  started_at?: string | null
  ended_at?: string | null
  completed_at?: string | null
  // Joined relations
  creator?: {
    username: string
    full_name: string | null
    avatar: string | null
    is_verified?: boolean
  }
  profiles?: {
    username: string
    full_name: string | null
    avatar: string | null
    is_verified?: boolean
  }
  project_skills?: ProjectSkill[]
  project_technologies?: ProjectTechnology[]
  project_roles?: ProjectRole[]
  project_members?: ProjectMember[]
  owner_contribution_role_id?: string | null
  owner_contribution_role?: MasterItem | null
  owner_custom_role_title?: string | null
  owner_id?: string | null
  initiator_user_id?: string | null
  initiator_organization_id?: string | null
  creation_mode?: 'personal' | 'organization_initiated'
  lead_expectations?: string
  owner_profile?: {
    id: string
    username: string
    full_name: string | null
    headline: string | null
    avatar: string | null
    is_verified: boolean
  } | null
  can_accept_contributors?: boolean
  initiator_profile?: {
    id: string
    username: string
    full_name: string | null
    headline: string | null
    avatar: string | null
    is_verified: boolean
  } | null
  initiator_organization?: { id: string; name: string; slug: string } | null
  viewer_application?: ViewerApplicationResponse | null
  capabilities?: {
    can_edit_definition: boolean
    can_publish: boolean
    allowed_status_actions: string[]
    can_apply: boolean
    can_claim: boolean
    can_manage_applications: boolean
    can_manage_workspace: boolean
  }
  origin?: 'personal' | 'community' | 'experiment' | 'client' | string | null
  why_collaborative?: string | null
  contributor_outcome?: string | null
  owner_commitment?: string | null
  hours_per_week?: number | null
}

export interface Application {
  id: string
  project_id: string
  applicant_id: string
  motivation: string
  expected_contribution: string | null
  portfolio_links: string[]
  availability: ApplicantAvailability
  status: ApplicationStatus
  reviewer_note: string | null
  applied_at: string
  project_role_id: string
  project_role?: ProjectRole | null
  estimated_hours_per_week?: number | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  withdrawn_at?: string | null
  // Joined relations
  profiles?: {
    username: string
    full_name: string | null
    avatar: string | null
    headline: string | null
    completion_score: number
  }
  projects?: Pick<Project, 'id' | 'title' | 'slug' | 'status'>
}

export interface ProjectApplicationReceipt {
  id: string
  status: 'pending'
  applied_at: string
}

// ---- Request Payloads ----
export interface CreateProjectPayload {
  title: string
  summary: string
  description?: string
  project_category: ProjectCategory
  visibility: ProjectVisibility
  start_date?: string | null
  deadline?: string | null
  why_join?: string
  skill_ids?: string[]
  tool_ids?: string[]
  roles: ProjectRoleInput[]
  owner_contribution_role_id?: string
  owner_custom_role_title?: string
  slug?: string
}

export interface ApplyProjectRequest {
  motivation: string
  expected_contribution: string | null
  portfolio_links: string[]
  availability: ApplicantAvailability
  project_role_id: string
  estimated_hours_per_week: number | null
}

// ---- Filters ----
export interface ProjectFilters {
  search?: string
  status?: ProjectStatus
  project_category?: ProjectCategory
  cursor?: string | null
  limit?: number
}

// ---- Portfolio ----
export interface PortfolioItem {
  project_id: string
  title: string
  summary: string
  project_category: ProjectCategory
  slug: string
  tools: string[]
  member_count: number
  pinned_at: string
}

export interface WorkHistory {
  activities: import('./workspace').ActivityLog[]
  my_tasks: import('./workspace').Task[]
}
