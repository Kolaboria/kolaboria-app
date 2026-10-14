import type { ApiPaginationMeta, ApiResponse } from './api'

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'
export type ApplicationOrigin = 'personal' | 'community' | 'experiment' | 'client'
export type ApplicationSort = 'newest' | 'oldest'

export interface ApplicationProfileResponse {
  id: string
  username: string
  full_name: string | null
  headline: string | null
  avatar: string | null
}

export interface ApplicationMasterResponse {
  id: string
  name: string
  slug: string
}

export interface ApplicationRoleResponse {
  id: string
  contribution_role_id: string | null
  contribution_role: ApplicationMasterResponse | null
  description: string
  capacity: number
  filled_capacity: number
  remaining_capacity: number
  status: 'open' | 'full' | 'archived'
  is_archived: boolean
  skills: ApplicationMasterResponse[]
  tools: ApplicationMasterResponse[]
}

export interface ApplicationProjectResponse {
  id: string
  title: string
  slug: string
  status: string
  summary: string
  origin: ApplicationOrigin
  creation_mode: 'personal' | 'organization_initiated'
  owner_profile: ApplicationProfileResponse | null
  initiator_organization: { id: string; name: string; slug: string } | null
}

export interface ApplicantListItemResponse {
  id: string
  project_id: string
  applicant_user_id: string
  project_role_id: string
  status: ApplicationStatus
  applied_at: string
  availability: 'flexible' | 'full_time' | 'part_time' | 'weekends_only'
  estimated_hours_per_week: number | null
  motivation: string
  expected_contribution: string | null
  applicant_profile: ApplicationProfileResponse | null
  project_role: ApplicationRoleResponse
}

export interface ApplicationPermissionsResponse {
  can_accept: boolean
  can_reject: boolean
  accept_block_reason: string | null
  reject_block_reason: string | null
}

export interface ApplicationDetailResponse extends ApplicantListItemResponse {
  portfolio_links: string[]
  reviewer_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  withdrawn_at: string | null
  retry_after: string | null
  reapply_block_reason: string | null
  project: ApplicationProjectResponse
  permissions: ApplicationPermissionsResponse
}

export interface MyApplicationListItemResponse extends ApplicantListItemResponse {
  reviewer_note: string | null
  reviewed_at: string | null
  withdrawn_at: string | null
  retry_after: string | null
  reapply_block_reason: string | null
  project: ApplicationProjectResponse
}

export interface ApplicantStatsResponse {
  total: number
  pending: number
  accepted: number
  rejected: number
  withdrawn: number
}

export interface ApplicantSummaryResponse {
  project: ApplicationProjectResponse
  capacity: { total_capacity: number; filled_capacity: number; remaining_capacity: number }
  stats: ApplicantStatsResponse
  roles: Array<{
    id: string
    name: string
    capacity: number
    filled_capacity: number
    remaining_capacity: number
    status: string
    is_archived: boolean
  }>
  permissions: { can_review_applications: boolean; review_block_reason: string | null }
}

export interface MyApplicationSummaryResponse {
  stats: ApplicantStatsResponse
}

export interface ApplicationListQuery {
  page?: number
  limit?: number
  search?: string
  statuses?: ApplicationStatus[]
  project_role_ids?: string[]
  origins?: ApplicationOrigin[]
  sort?: ApplicationSort
}

export interface ReviewApplicationRequest {
  status: 'accepted' | 'rejected'
  reviewer_note?: string | null
}

export type ApiPaginatedResponse<T> = ApiResponse<T[]> & {
  data: T[]
  meta: ApiPaginationMeta
}

export interface ApplicantGateway {
  getApplicantSummary(projectId: string, signal?: AbortSignal): Promise<ApiResponse<ApplicantSummaryResponse>>
  getProjectApplicants(projectId: string, query: ApplicationListQuery, signal?: AbortSignal): Promise<ApiPaginatedResponse<ApplicantListItemResponse>>
  getApplicationDetail(id: string, signal?: AbortSignal): Promise<ApiResponse<ApplicationDetailResponse>>
  reviewApplication(id: string, request: ReviewApplicationRequest, signal?: AbortSignal): Promise<ApiResponse<ApplicationDetailResponse>>
}

export interface MyApplicationGateway {
  getMyApplications(query: ApplicationListQuery, signal?: AbortSignal): Promise<ApiPaginatedResponse<MyApplicationListItemResponse>>
  getMyApplicationSummary(signal?: AbortSignal): Promise<ApiResponse<MyApplicationSummaryResponse>>
  getApplicationDetail(id: string, signal?: AbortSignal): Promise<ApiResponse<ApplicationDetailResponse>>
  withdrawApplication(id: string, signal?: AbortSignal): Promise<ApiResponse<ApplicationDetailResponse>>
}
