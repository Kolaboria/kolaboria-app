import { getProjectCategoryLabel } from '../constants/projectCategory'
import type { MasterItem, Project, ProjectRole } from '../types/project'
import type { ProjectDetailResponse, ProjectSummaryResponse } from '../types/project-editor'
import type { User } from '../types/auth'

const originLabels: Record<string, string> = {
  personal: 'Proyek pribadi',
  community: 'Komunitas',
  experiment: 'Eksperimen',
  client: 'Proyek client'
}

const displayDate = (value: string | null) => {
  if (!value) return undefined
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return undefined
  return `Sampai ${date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })}`
}

export const toProjectListItem = (summary: ProjectSummaryResponse) => ({
  id: summary.id,
  title: summary.title,
  slug: summary.slug,
  summary: summary.summary,
  description: summary.summary,
  acceptsContributors: summary.status === 'open' && summary.filled_capacity < summary.total_capacity,
  context: originLabels[summary.origin] ?? 'Proyek pribadi',
  type: getProjectCategoryLabel(summary.project_category),
  author: {
    name: summary.owner_profile?.full_name || summary.owner_profile?.username ||
      summary.initiator_organization?.name || 'Project Lead belum ditetapkan',
    status: summary.owner_profile?.username
      ? `@${summary.owner_profile.username}`
      : summary.initiator_organization ? 'Organisasi pemrakarsa' : 'Project Lead belum ditetapkan',
    avatar: summary.owner_profile?.avatar ?? null
  },
  skills: [...new Set([...summary.skills, ...summary.tools].map(item => item.name))],
  memberCount: `${summary.filled_capacity} dari ${summary.total_capacity}`,
  commitmentHours: summary.hours_per_week,
  deadline: displayDate(summary.deadline),
  categoryLabel: getProjectCategoryLabel(summary.project_category),
  createdAt: summary.created_at,
  filledCapacity: summary.filled_capacity,
  isBookmarked: false
})

const toMasterItem = (item: { id: string; name: string; slug: string }, category: string): MasterItem => ({
  ...item,
  category
})

export const toProjectDetailView = (detail: ProjectDetailResponse): Project => {
  const roles: ProjectRole[] = detail.roles.map(role => ({
    id: role.id,
    contribution_role_id: role.contribution_role_id,
    contribution_role: role.contribution_role
      ? toMasterItem(role.contribution_role, 'Contribution Role')
      : null,
    custom_title: null,
    description: role.description,
    capacity: role.capacity,
    filled_capacity: role.filled_capacity,
    remaining_capacity: role.remaining_capacity,
    status: role.status,
    tools: role.tools.map(item => toMasterItem(item, 'Tool')),
    skill_tags: role.skills.map(item => item.name)
  }))
  const ownerRole = detail.owner_role?.contribution_role

  return {
    id: detail.id,
    creator_id: detail.ownership.created_by_user_id,
    title: detail.title,
    slug: detail.slug,
    summary: detail.summary,
    description: detail.description,
    project_category: detail.project_category,
    visibility: detail.visibility,
    status: detail.status,
    max_slots: roles.reduce((total, role) => total + role.capacity, 0),
    availability: detail.availability,
    start_date: detail.start_date,
    deadline: detail.deadline,
    why_join: detail.why_collaborative,
    created_at: detail.created_at,
    published_at: detail.published_at,
    project_roles: roles,
    owner_contribution_role_id: detail.owner_role?.contribution_role_id ?? null,
    owner_contribution_role: ownerRole ? toMasterItem(ownerRole, 'Contribution Role') : null,
    creation_mode: detail.creation_mode,
    origin: detail.origin,
    why_collaborative: detail.why_collaborative,
    contributor_outcome: detail.contributor_outcome,
    owner_commitment: detail.owner_commitment,
    lead_expectations: detail.lead_expectations,
    hours_per_week: detail.hours_per_week,
    owner_id: detail.ownership.owner_id,
    initiator_user_id: detail.ownership.initiator_user_id,
    can_accept_contributors: detail.ownership.can_accept_contributors,
    initiator_organization_id: detail.ownership.initiator_organization_id,
    owner_profile: detail.ownership.owner_profile ?? null,
    initiator_profile: detail.ownership.show_initiator ? detail.ownership.initiator_profile ?? null : null,
    initiator_organization: detail.ownership.initiator_organization ?? null,
    viewer_application: detail.viewer_application,
    profiles: detail.ownership.owner_profile ?? undefined,
    creator: detail.ownership.show_initiator ? detail.ownership.initiator_profile ?? undefined : undefined,
  }
}

export const getProjectApplicationStatusCopy = (
  status: string | null | undefined,
  projectStatus?: string | null
): { title: string; message: string } | null => {
  if (status === 'pending') {
    return {
      title: 'Lamaran sedang ditinjau',
      message: 'Pemilik proyek sedang meninjau lamaranmu.'
    }
  }

  if (status === 'accepted') {
    if (projectStatus === 'open') {
      return {
        title: 'Lamaran diterima',
        message: 'Lamaranmu diterima. Proyek belum dimulai; Workspace akan tersedia setelah Project Lead memulai proyek.'
      }
    }

    if (projectStatus === 'in_progress') {
      return {
        title: 'Lamaran diterima',
        message: 'Lamaranmu diterima dan proyek sudah berjalan. Buka Workspace dari halaman Pengajuan Saya untuk mulai berkolaborasi.'
      }
    }

    return {
      title: 'Lamaran diterima',
      message: 'Lamaranmu sudah diterima.'
    }
  }

  return null
}

export const getProjectApplicationUnavailableTitle = (context: {
  projectStatus: Project['status'] | null | undefined
  applicationStatus: string | null | undefined
  isProjectOwner: boolean
  isInitiatorOrganizationAdmin: boolean
}): string => {
  const applicationCopy = getProjectApplicationStatusCopy(context.applicationStatus)
  if (applicationCopy) return applicationCopy.title
  if (context.isProjectOwner) return 'Kamu Project Lead'
  if (context.isInitiatorOrganizationAdmin) return 'Proyek dari organisasimu'
  if (context.projectStatus === 'awaiting_owner') return 'Menunggu Project Lead'
  return 'Lamaran belum tersedia'
}

export const getProjectOwnerAttribution = (
  project: Pick<Project, 'creation_mode' | 'owner_id' | 'creator_id'>
): string => {
  if (!project.owner_id) return 'Kepemilikan belum ditetapkan'
  if (
    project.creation_mode === 'personal' &&
    project.owner_id === project.creator_id
  ) return 'Pemilik proyek'
  return 'Project Lead'
}

export const getProjectContributorOutcome = (
  project: Pick<Project, 'contributor_outcome'>
): string | null => project.contributor_outcome?.trim() || null

export const isProjectDefinitionEditableBy = (
  project: Pick<Project, 'status' | 'creation_mode' | 'owner_id' | 'creator_id' | 'initiator_organization_id'>,
  viewer: User | null | undefined
): boolean => {
  if (!viewer || !['draft', 'open', 'awaiting_owner'].includes(project.status)) return false
  if (project.owner_id) return project.owner_id === viewer.id
  if (project.creation_mode === 'personal') return false
  return project.creator_id === viewer.id
    && Boolean(project.initiator_organization_id)
    && (viewer.initiableOrganizations ?? []).some(
      organization => organization.id === project.initiator_organization_id
    )
}

export const getProjectContributionAvailabilityMessage = (
  status: Project['status'],
  visibility: Project['visibility'],
  remainingSlots: number,
  roleCount: number,
  hasOwner: boolean
): string => {
  if (status === 'awaiting_owner') {
    return 'Proyek ini menunggu Project Lead sebelum kolaborasi dibuka.'
  }
  if (status === 'in_progress') {
    return 'Proyek sudah berjalan dan tidak menerima kontributor baru.'
  }
  if (status === 'completed') {
    return 'Proyek sudah selesai dan tidak menerima kontributor baru.'
  }
  if (status === 'archived') {
    return 'Proyek ini sudah diarsipkan.'
  }
  if (status === 'draft') {
    return 'Proyek ini masih berupa draf dan belum dibuka untuk kolaborasi.'
  }
  if (status === 'open' && visibility !== 'public') {
    return 'Proyek ini tidak membuka lamaran publik.'
  }
  if (status === 'open' && !hasOwner) {
    return 'Proyek ini menunggu Project Lead sebelum kolaborasi dibuka.'
  }
  if (status === 'open' && roleCount === 0) {
    return 'Belum ada peran kontributor yang dibuka.'
  }
  if (remainingSlots <= 0) {
    return 'Kuota kontributor untuk proyek ini sudah terpenuhi.'
  }
  return 'Lamaran untuk proyek ini belum dapat diajukan saat ini.'
}
