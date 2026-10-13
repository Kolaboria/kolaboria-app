import { sumPendingApplicantCounts } from './project-applicant-count'

type ProjectStatsSource = {
  id: string
  status: string
  pending_application_count?: number | null
}

export const getMyProjectSummaryStats = (projects: readonly ProjectStatsSource[]) => ({
  activeProjects: projects.filter(project =>
    project.status === 'open' || project.status === 'in_progress'
  ).length,
  draftProjects: projects.filter(project => project.status === 'draft').length,
  pendingApplicants: sumPendingApplicantCounts(
    projects.map(project => project.id),
    Object.fromEntries(projects.map(project => [
      project.id,
      project.pending_application_count
    ]))
  )
})
