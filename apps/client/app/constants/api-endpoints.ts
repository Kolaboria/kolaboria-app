/**
 * Centralized API Endpoint Registry for Kolaboria Client
 * Single Source of Truth for all API endpoints matching kolaboria-api router
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE: '/auth/google',
    ME: '/auth/me'
  },

  MASTER: {
    SKILLS: '/master-data/skills',
    TOOLS: '/master-data/tools',
    CONTRIBUTION_ROLES: '/master-data/contribution-roles',
    LOCATIONS_SEARCH: '/master-data/locations/search',
    LOCATION_DETAIL: (villageId: number | string) =>
      `/master-data/locations/${villageId}`
  },

  PROFILE: {
    ME: '/profiles/me',
    BY_USERNAME: (username: string) =>
      `/profiles/${encodeURIComponent(username)}`,
    ONBOARDING: '/profiles/onboarding',
    ONBOARDING_STATUS: '/profiles/onboarding/status',
    MY_SKILLS: '/profiles/me/skills',
    MY_SKILL_DETAIL: (id: string) => `/profiles/me/skills/${id}`,
    MY_SKILL_PRIMARY: (id: string) => `/profiles/me/skills/${id}/primary`,
    MY_TOOLS: '/profiles/me/tools',
    MY_TOOL_DETAIL: (id: string) => `/profiles/me/tools/${id}`,
    PUBLIC_CAREERS: (username: string) =>
      `/profiles/${encodeURIComponent(username)}/careers`,
    PUBLIC_PORTFOLIO: (username: string) =>
      `/profiles/${encodeURIComponent(username)}/portfolio`
  },

  CAREER: {
    MY_CAREERS: '/profiles/me/careers',
    MY_CAREER_DETAIL: (id: string) => `/profiles/me/careers/${id}`,
    PUBLIC_CAREERS: (username: string) =>
      `/profiles/${encodeURIComponent(username)}/careers`
  },

  PORTFOLIO: {
    MY_PORTFOLIO: '/profiles/me/portfolio',
    MY_PORTFOLIO_DETAIL: (projectId: string) =>
      `/profiles/me/portfolio/${projectId}`,
    PUBLIC_PORTFOLIO: (username: string) =>
      `/profiles/${encodeURIComponent(username)}/portfolio`
  },

  PROJECT: {
    LIST_OR_CREATE: '/projects',
    DETAIL_BY_ID: (id: string) => `/projects/${id}`,
    DETAIL_BY_SLUG: (slug: string) =>
      `/projects/slug/${encodeURIComponent(slug)}`,
    MY_PROJECTS: '/projects/my-projects',
    EDITOR_CREATE: '/projects',
    EDITOR_UPDATE: (id: string) => `/projects/${encodeURIComponent(id)}`,
    EDITOR_PUBLISH: (id: string) => `/projects/${encodeURIComponent(id)}/publish`,
    STATUS: (id: string) => `/projects/${id}/status`,
    PUBLISH: (id: string) => `/projects/${id}/publish`,
    START: (id: string) => `/projects/${id}/start`,
    APPLY: (id: string) => `/projects/${id}/apply`,
    APPLICANTS: (id: string) => `/projects/${id}/applicants`,
    APPLICANT_SUMMARY: (id: string) => `/projects/${id}/applicants/summary`
  },

  APPLICATION: {
    MY_APPLICATIONS: '/applications/my-applications',
    MY_APPLICATION_SUMMARY: '/applications/my-applications/summary',
    DETAIL: (id: string) => `/applications/${id}`,
    REVIEW: (id: string) => `/applications/${id}/review`,
    WITHDRAW: (id: string) => `/applications/${id}/withdraw`
  },

  WORKSPACE: {
    TASKS: (projectId: string) => `/projects/${projectId}/workspace/tasks`,
    ACTIVITIES: (projectId: string) =>
      `/projects/${projectId}/workspace/activities`,
    MEMBERS: (projectId: string) => `/projects/${projectId}/workspace/members`,
    MY_HISTORY: (projectId: string) =>
      `/projects/${projectId}/workspace/my-history`,
    TASKS_REORDER: '/projects/workspace/tasks/reorder',
    TASK_DETAIL: (taskId: string) => `/projects/workspace/tasks/${taskId}`,
    TASK_COMMENTS: (taskId: string) =>
      `/projects/workspace/tasks/${taskId}/comments`,
    COMMENT_DETAIL: (commentId: string) =>
      `/projects/workspace/comments/${commentId}`
  },

  EVIDENCE: {
    DELIVERABLES: (projectId: string) => `/projects/${projectId}/deliverables`,
    DELIVERABLE_DETAIL: (projectId: string, deliverableId: string) =>
      `/projects/${projectId}/deliverables/${deliverableId}`,
    SNAPSHOTS: (projectId: string) =>
      `/projects/${projectId}/contribution-snapshots`,
    FINALIZATION_STATUS: (projectId: string) =>
      `/projects/${projectId}/finalization-status`
  },

  EXPERIENCE: {
    LIST_MINE: '/experiences/me',
    DETAIL: (id: string) => `/experiences/${id}`,
    PUBLIC: (username: string, slug: string) =>
      `/experiences/public/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`,
    VISIBILITY: (id: string) => `/experiences/${id}/visibility`,
    REFLECTION: (id: string) => `/experiences/${id}/reflection`,
    HIGHLIGHTS: (id: string) => `/experiences/${id}/highlights`,
    HIGHLIGHT_DETAIL: (id: string, highlightId: string) =>
      `/experiences/${id}/highlights/${highlightId}`,
    EVENTS: (id: string) => `/experiences/${id}/events`
  },

  NOTIFICATION: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`
  }
} as const
