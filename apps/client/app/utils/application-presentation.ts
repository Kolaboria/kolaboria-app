import type {
  ApplicantListItemResponse,
  ApplicationDetailResponse,
  ApplicationProjectResponse,
  ApplicationRoleResponse,
  MyApplicationListItemResponse
} from '../types/application'

type RoleCardView = ApplicationRoleResponse & {
  custom_title: null
  skill_tags: string[]
}

export type ApplicantCardView = ApplicantListItemResponse & {
  profiles: ApplicantListItemResponse['applicant_profile']
  project_role: RoleCardView
}

export type MyApplicationCardView = MyApplicationListItemResponse & {
  portfolio_links?: string[]
  profiles: ApplicationProjectResponse['owner_profile']
  projects: {
    id: string
    title: string
    slug: string
    status: string
    summary: string
    context: string
    creator: { username: string; full_name: string | null; avatar: string | null } | null
  }
  project_role: RoleCardView
}

const roleCardView = (role: ApplicationRoleResponse): RoleCardView => ({
  ...role,
  custom_title: null,
  skill_tags: role.skills.map((skill) => skill.name)
})

export const toApplicantCardView = (application: ApplicantListItemResponse): ApplicantCardView => ({
  ...application,
  profiles: application.applicant_profile,
  project_role: roleCardView(application.project_role)
})

export const toMyApplicationCardView = (application: MyApplicationListItemResponse): MyApplicationCardView => ({
  ...application,
  profiles: application.project.owner_profile,
  projects: {
    id: application.project.id,
    title: application.project.title,
    slug: application.project.slug,
    status: application.project.status,
    summary: application.project.summary,
    context: application.project.origin,
    creator: application.project.owner_profile
      ? {
          username: application.project.owner_profile.username,
          full_name: application.project.owner_profile.full_name,
          avatar: application.project.owner_profile.avatar
        }
      : null
  },
  project_role: roleCardView(application.project_role)
})

export const toApplicationDetailCardView = (application: ApplicationDetailResponse): MyApplicationCardView => ({
  ...toMyApplicationCardView(application),
  portfolio_links: getSafePortfolioLinks(application.portfolio_links)
})

export const getSafePortfolioLinks = (links: string[] | null | undefined): string[] =>
  (links ?? []).filter((link) => {
    if (link.length > 2048) return false
    try {
      const url = new URL(link)
      return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
    } catch {
      return false
    }
  })
