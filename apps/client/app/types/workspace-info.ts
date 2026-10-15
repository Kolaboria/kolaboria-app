import type { ProjectStatus } from './project'

export interface WorkspaceProjectProfile {
  id: string
  username: string
  full_name: string | null
  headline?: string | null
  avatar?: string | null
  is_verified?: boolean
}

export interface WorkspaceProjectOrganization {
  id: string
  name: string
  slug: string
}

export interface WorkspaceProjectInfoDTO {
  project: {
    id: string
    slug: string
    version: number
    status: ProjectStatus
    title: string
    summary: string
    description: string
    project_category: string
    creation_mode: 'personal' | 'organization_initiated'
    initiator_organization_id: string | null
    start_date: string | null
    deadline: string | null
    ownership: {
      owner_id: string | null
      owner_profile: WorkspaceProjectProfile | null
      initiator_organization_id: string | null
      initiator_organization: WorkspaceProjectOrganization | null
      initiator_profile: WorkspaceProjectProfile | null
      show_initiator: boolean
    }
  }
  positions: Array<{
    id: string
    name: string
    description: string
    capacity: number
    active_contributor_count: number
    remaining_capacity: number
    recruitment_status: 'open' | 'filled'
    readiness_state: 'ready' | 'to_fill'
  }>
  position_capacity_summary: {
    all_positions_filled: boolean
    underfilled_position_count: number
    total_remaining_capacity: number
  }
  viewer: {
    scope: 'owner' | 'organization_initiator' | 'member'
    capabilities: {
      can_view_info: boolean
      can_start_project: boolean
      can_manage_workspace: boolean
    }
  }
}

export interface WorkspaceProjectInfoViewModel {
  project: {
    id: string
    slug: string
    version: number
    status: ProjectStatus
    statusLabel: string
    title: string
    summary: string
    description: string
    projectCategory: string
    startDateLabel: string
    deadlineLabel: string
    ownerName: string
    initiatorOrganizationName: string | null
    initiatorPersonName: string | null
  }
  positions: Array<{
    id: string
    name: string
    description: string
    capacity: number
    activeContributorCount: number
    occupancyLabel: string
    remainingCapacity: number
    recruitmentStatus: 'open' | 'filled'
    readinessState: 'ready' | 'to_fill'
    readinessLabel: 'Siap' | 'Masih perlu diisi'
  }>
  positionCapacitySummary: {
    allPositionsFilled: boolean
    underfilledPositionCount: number
    totalRemainingCapacity: number
  }
  viewerScope: WorkspaceProjectInfoDTO['viewer']['scope']
  canStartProject: boolean
  canManageWorkspace: boolean
}
