# API base URL audit — 16 October 2026

The migration to /v1 is correct in the current source and local environment. No migration-introduced Standards or Spec findings were identified. All 13 service modules use the shared useApi transport, directly or through delegation/injection. auth.service.ts uses relative AUTH endpoints; the Google authorization redirect targets Google, and its callback exchanges the code through /v1/auth/google.

## Evidence

- Backend: internal/http/router.go:49 registers versioned routes once, under /v1. The active bootstrap includes auth, master data, private profiles/careers, projects, applications, workspace info, and workspace discussions/replies. Swagger has 59 documented operations including root /health.
- Frontend: nuxt.config.ts:52 defaults to http://localhost:8081/v1. The current local .env sets that URL. The current .env.example leaves the variable empty, which uses the same default. A nonempty runtime environment override selects the deployed URL.
- All HTTP requests use runtimeConfig.public.apiBaseUrl in useApi.ts:114; refresh uses the same value at line 63. Editor/lifecycle composables also delegate to useApi. No production source still embeds the old API prefix.
- A temporary transport audit invoked 111 service methods across four base configurations: http://localhost:8081/v1, http://localhost:8081/v1/, https://api.dev.kolaboria.com/v1, and https://api.dev.kolaboria.com/v1/. All 444 request URLs kept the correct host and exactly one /v1 prefix.
- The audit used the real service code, useApi, and ofetch URL construction with controlled transport responses. It did not send mutations to either local or deployed backend. It validates URL formation, not database behavior or response DTO compatibility. Five discussion methods reached transport but their response mapping rejected the generic audit fixture; they count only toward URL checks.
- The full Go suite (go test ./... -count=1 -timeout=120s) and targeted route/Swagger tests passed. The version-prefix test now initializes discussion routes as the real bootstrap does and checks unauthenticated discussion/reply URLs. The 20 HTTP auth/refresh tests passed.

## Service coverage

A matching route means the HTTP method and path exist in the current backend/Swagger inventory. It does not establish full feature compatibility. Delegated aliases are counted as service methods, so these counts are not counts of distinct endpoints. loginWithGoogle is excluded from API-method counts because it is an external OAuth redirect; refresh is separately covered through useApi tests.

| Service | Methods audited | Matching backend route | Missing/mismatched route |
| --- | ---: | ---: | ---: |
| [application.service.ts](../apps/client/app/services/application.service.ts) | 7 | 7 | 0 |
| [auth.service.ts](../apps/client/app/services/auth.service.ts) | 9 | 9 | 0 |
| [career.service.ts](../apps/client/app/services/career.service.ts) | 5 | 4 | 1 |
| [experience.service.ts](../apps/client/app/services/experience.service.ts) | 11 | 0 | 11 |
| [location.service.ts](../apps/client/app/services/location.service.ts) | 2 | 2 | 0 |
| [master.service.ts](../apps/client/app/services/master.service.ts) | 5 | 5 | 0 |
| [notification.service.ts](../apps/client/app/services/notification.service.ts) | 2 | 0 | 2 |
| [portfolio.service.ts](../apps/client/app/services/portfolio.service.ts) | 5 | 0 | 5 |
| [profile.service.ts](../apps/client/app/services/profile.service.ts) | 14 | 11 | 3 |
| [project.service.ts](../apps/client/app/services/project.service.ts) | 20 | 15 | 5 |
| [skill.service.ts](../apps/client/app/services/skill.service.ts) | 2 | 2 | 0 |
| [workspace-discussion.service.ts](../apps/client/app/services/workspace-discussion.service.ts) | 9 | 9 | 0 |
| [workspace.service.ts](../apps/client/app/services/workspace.service.ts) | 20 | 2 | 18 |

## Existing integration findings

These gaps are unchanged from HEAD and were not introduced by the URL migration:

1. **P2 — Project update method mismatch:** ProjectService.updateProject sends PATCH /v1/projects/{id}, while the backend registers PUT. With method-not-allowed handling enabled, the PATCH request receives 405. The method is exposed through useProjects.updateProject. Sources: project.service.ts:58–63, useProjects.ts:114, backend internal/modules/project/routes.go:17.
2. **P2 — Project start path mismatch:** ProjectService.startProject sends POST /v1/projects/{id}/start, which is unregistered and receives 404. The active workspace start flow instead uses PATCH /v1/projects/{id}/status with version, confirm_underfilled_positions, and status in_progress; simply replacing the URL would not supply the full contract. Sources: project.service.ts:89–94, workspace.service.ts:33–39, useProjects.ts:148.
3. **P2 — Feature endpoints absent from this backend:** public profile/career, portfolio, experience, notification, project membership, and workspace task/comment/activity/member/history/evidence/finalization calls lack matching active registrations. The table below records all 45 affected service methods, including delegated aliases. Their URL prefix is correct, but those operations cannot be considered integrated with this backend.

The synthetic identifier below represents a path parameter; it is not a real account or project.

| Service method | HTTP | Requested path |
| --- | --- | --- |
| CareerService.getPublicCareers | GET | `/v1/profiles/{id}/careers` |
| ExperienceService.listMine | GET | `/v1/experiences/me` |
| ExperienceService.getById | GET | `/v1/experiences/{id}` |
| ExperienceService.getPublic | GET | `/v1/experiences/public/{id}/{id}` |
| ExperienceService.updateVisibility | PATCH | `/v1/experiences/{id}/visibility` |
| ExperienceService.upsertReflection | PUT | `/v1/experiences/{id}/reflection` |
| ExperienceService.deleteReflection | DELETE | `/v1/experiences/{id}/reflection` |
| ExperienceService.listHighlights | GET | `/v1/experiences/{id}/highlights` |
| ExperienceService.addHighlight | POST | `/v1/experiences/{id}/highlights` |
| ExperienceService.updateHighlight | PATCH | `/v1/experiences/{id}/highlights/{id}` |
| ExperienceService.deleteHighlight | DELETE | `/v1/experiences/{id}/highlights/{id}` |
| ExperienceService.trackEvent | POST | `/v1/experiences/{id}/events` |
| NotificationService.list | GET | `/v1/notifications` |
| NotificationService.markRead | PATCH | `/v1/notifications/{id}/read` |
| PortfolioService.getPortfolio | GET | `/v1/profiles/me/portfolio` |
| PortfolioService.getPublicPortfolio | GET | `/v1/profiles/{id}/portfolio` |
| PortfolioService.pinProject | POST | `/v1/profiles/me/portfolio` |
| PortfolioService.unpinProject | DELETE | `/v1/profiles/me/portfolio/{id}` |
| PortfolioService.getMyWorkHistory | GET | `/v1/projects/{id}/workspace/my-history` |
| ProfileService.getProfileByUsername | GET | `/v1/profiles/{id}` |
| ProfileService.getPublicCareers | GET | `/v1/profiles/{id}/careers` |
| ProfileService.getPublicPortfolio | GET | `/v1/profiles/{id}/portfolio` |
| ProjectService.updateProject | PATCH | `/v1/projects/{id}` |
| ProjectService.startProject | POST | `/v1/projects/{id}/start` |
| ProjectService.leaveProject | POST | `/v1/projects/{id}/members/leave` |
| ProjectService.updateMemberStatus | PATCH | `/v1/projects/{id}/members/{id}/status` |
| ProjectService.changeMemberRole | PATCH | `/v1/projects/{id}/members/{id}/role` |
| WorkspaceService.getTasks | GET | `/v1/projects/{id}/workspace/tasks` |
| WorkspaceService.createTask | POST | `/v1/projects/{id}/workspace/tasks` |
| WorkspaceService.updateTask | PATCH | `/v1/projects/workspace/tasks/{id}` |
| WorkspaceService.deleteTask | DELETE | `/v1/projects/workspace/tasks/{id}` |
| WorkspaceService.reorderTasks | PATCH | `/v1/projects/workspace/tasks/reorder` |
| WorkspaceService.getTaskComments | GET | `/v1/projects/workspace/tasks/{id}/comments` |
| WorkspaceService.addComment | POST | `/v1/projects/workspace/tasks/{id}/comments` |
| WorkspaceService.deleteComment | DELETE | `/v1/projects/workspace/comments/{id}` |
| WorkspaceService.updateComment | PATCH | `/v1/projects/workspace/comments/{id}` |
| WorkspaceService.getActivityLogs | GET | `/v1/projects/{id}/workspace/activities` |
| WorkspaceService.getWorkspaceMembers | GET | `/v1/projects/{id}/workspace/members` |
| WorkspaceService.getMyWorkHistory | GET | `/v1/projects/{id}/workspace/my-history` |
| WorkspaceService.getDeliverables | GET | `/v1/projects/{id}/deliverables` |
| WorkspaceService.createDeliverable | POST | `/v1/projects/{id}/deliverables` |
| WorkspaceService.updateDeliverable | PATCH | `/v1/projects/{id}/deliverables/{id}` |
| WorkspaceService.deleteDeliverable | DELETE | `/v1/projects/{id}/deliverables/{id}` |
| WorkspaceService.getContributionSnapshots | GET | `/v1/projects/{id}/contribution-snapshots` |
| WorkspaceService.getFinalizationStatus | GET | `/v1/projects/{id}/finalization-status` |

## Boundaries

This audit did not inspect deployed environment variables, reverse proxies, or authenticated database-backed end-to-end behavior. Historical planning files retain old URL examples; runtime code does not read them. Existing broader client-suite failures remain documented in [the migration notes](api-base-url.md). Referenced feature-context/knowledge files and the graphify executable/graphs are unavailable in this workspace.
