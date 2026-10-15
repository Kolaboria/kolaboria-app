import { getProjectCategoryLabel } from '~/constants/projectCategory'
import type { WorkspaceProjectInfoDTO, WorkspaceProjectInfoViewModel } from '~/types/workspace-info'

const statusLabels: Record<WorkspaceProjectInfoDTO['project']['status'], string> = {
  draft: 'Draft',
  open: 'Open',
  awaiting_owner: 'Menunggu Project Lead',
  in_progress: 'Sedang berjalan',
  completed: 'Selesai',
  archived: 'Diarsipkan'
}

const profileName = (profile: WorkspaceProjectInfoDTO['project']['ownership']['owner_profile']) =>
  profile?.full_name?.trim() || profile?.username?.trim() || null

const dateOnlyLabel = (value: string | null): string => {
  if (!value) return 'Belum ditentukan'
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new Error(`Tanggal proyek tidak valid: ${value}`)
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
    throw new Error(`Tanggal proyek tidak valid: ${value}`)
  }
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

const validateInfo = (info: WorkspaceProjectInfoDTO): void => {
  if (!info || !info.project || !Array.isArray(info.positions) || !info.position_capacity_summary || !info.viewer?.capabilities) {
    throw new Error('Response Workspace Info tidak lengkap')
  }
  for (const position of info.positions) {
    if (!Number.isInteger(position.capacity) || position.capacity < 1 ||
        !Number.isInteger(position.active_contributor_count) || position.active_contributor_count < 0) {
      throw new Error(`Kapasitas posisi ${position.id} tidak valid`)
    }
    const remaining = Math.max(position.capacity - position.active_contributor_count, 0)
    const readiness = remaining === 0 ? 'ready' : 'to_fill'
    const recruitment = remaining === 0 ? 'filled' : 'open'
    if (position.remaining_capacity !== remaining || position.readiness_state !== readiness || position.recruitment_status !== recruitment) {
      throw new Error(`Ringkasan kapasitas posisi ${position.id} tidak konsisten`)
    }
  }
  const remaining = info.positions.reduce((total, position) => total + position.remaining_capacity, 0)
  const underfilled = info.positions.filter(position => position.remaining_capacity > 0).length
  if (remaining !== info.position_capacity_summary.total_remaining_capacity ||
      underfilled !== info.position_capacity_summary.underfilled_position_count ||
      info.position_capacity_summary.all_positions_filled !== (info.positions.length > 0 && underfilled === 0)) {
    throw new Error('Ringkasan kuota posisi tidak konsisten')
  }
}

export const mapWorkspaceProjectInfo = (info: WorkspaceProjectInfoDTO): WorkspaceProjectInfoViewModel => {
  validateInfo(info)
  const project = info.project
  const organizationId = project.ownership.initiator_organization_id ?? project.initiator_organization_id
  const organization = project.ownership.initiator_organization
  const showOrganization = project.creation_mode === 'organization_initiated' && !!organizationId

  return {
    project: {
      id: project.id,
      slug: project.slug,
      version: project.version,
      status: project.status,
      statusLabel: statusLabels[project.status],
      title: project.title,
      summary: project.summary,
      description: project.description,
      projectCategory: getProjectCategoryLabel(project.project_category),
      startDateLabel: dateOnlyLabel(project.start_date),
      deadlineLabel: dateOnlyLabel(project.deadline),
      ownerName: profileName(project.ownership.owner_profile) ?? 'Pemilik belum tersedia',
      initiatorOrganizationName: showOrganization
        ? organization?.name ?? 'Organisasi inisiator belum tersedia'
        : null,
      initiatorPersonName: project.ownership.show_initiator
        ? profileName(project.ownership.initiator_profile)
        : null
    },
    positions: info.positions.map(position => ({
      id: position.id,
      name: position.name,
      description: position.description,
      capacity: position.capacity,
      activeContributorCount: position.active_contributor_count,
      occupancyLabel: `${position.active_contributor_count}/${position.capacity}`,
      remainingCapacity: position.remaining_capacity,
      recruitmentStatus: position.recruitment_status,
      readinessState: position.readiness_state,
      readinessLabel: position.readiness_state === 'ready' ? 'Siap' : 'Masih perlu diisi'
    })),
    positionCapacitySummary: {
      allPositionsFilled: info.position_capacity_summary.all_positions_filled,
      underfilledPositionCount: info.position_capacity_summary.underfilled_position_count,
      totalRemainingCapacity: info.position_capacity_summary.total_remaining_capacity
    },
    viewerScope: info.viewer.scope,
    canStartProject: info.viewer.capabilities.can_start_project && project.status === 'open',
    canManageWorkspace: info.viewer.capabilities.can_manage_workspace
  }
}
