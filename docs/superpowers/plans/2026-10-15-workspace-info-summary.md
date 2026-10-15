# Workspace Info Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Back the project-summary and role-readiness areas of Workspace Info with authoritative project data while keeping contribution records and task/closure summaries outside this delivery.

**Architecture:** Reuse `GET /api/v1/projects/slug/:slug` and its `ProjectDetailResponse` for project facts and role occupancy. Add a derived backend readiness projection and enforce the same rule transactionally when starting a project. The FE loads by route slug, maps the API response to a small typed Info view model, and removes localStorage/manual readiness as a source for this page.

**Tech Stack:** Go, Gin, GORM, PostgreSQL migrations, Vue 3, Nuxt, TypeScript, Node `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-15-workspace-info-summary-design.md`

## Global Constraints

- Project status and role fields in API responses use explicit snake_case JSON tags.
- Project archive is a project-level status; this Info contract does not add or present position archive state.
- `filled_capacity` counts active contributor memberships assigned to the role; pending applications do not count.
- A role with at least one active accepted contributor is ready to start even when capacity remains; every returned project role must have at least one.
- `start_date` is the planned date. Do not reinterpret it as actual start time.
- Do not map `contributor_outcome` to a final project result summary.
- Contribution records, private Experience, review/correction, and sharing are explicitly held and excluded from code, DTOs, migrations, and tests in this plan.
- Task progress and closure behavior are held for the task-board scope. Keep the existing Info closure card and dummy metrics, but do not wire its review action or treat the values as authoritative API data.
- Remove the current contribution-record section and its Info-page event wiring. Do not implement persistence or delete existing local prototype data in this slice.

## Review Focus

- Route slug differs from project UUID — load the project by slug, then use returned ID/version for actions.
- A role has partial capacity (`1/2`) — show it remains recruitable while considering it ready to start.
- A role has only pending applications — keep it unready until an active accepted membership exists.
- A project has no returned roles — show a project-level blocker and do not allow start.
- Status is not `open` — readiness is non-actionable and no start action is exposed.
- Acceptance races with project start — project lock/version and transactional readiness check must allow only a consistent winner.
- A status update returns `409` because data changed — refetch and show current blockers rather than preserving stale UI state.

## Field Contract

| Info fact | Existing API field | Interpretation |
| --- | --- | --- |
| Project title and overview | `title`, `summary`, `description` | Project-authored text |
| Category and lifecycle | `project_category`, `status` | Category label and project-level state |
| Owner | `owner` | Optional profile; render a defined unavailable state if absent |
| Planned schedule | `start_date`, `deadline` | Planned start date and deadline; neither proves actual work started |
| Positions | `roles[]` | Project roles returned by the project detail endpoint |
| Recruitment occupancy | `filled_capacity`, `remaining_capacity`, `capacity`, `roles[].status` | Active accepted membership count and recruitment facts |
| Start readiness | New derived `project_start_readiness` | Computed from status and active membership occupancy; never persisted |
| Final result | Not available | Do not substitute `contributor_outcome` |
| Task/closure metrics | Not available in the Go API | Keep as visibly prototype-backed dummy data; no action wiring or API integration until task-board lifecycle is designed |
| Contribution record | Held | Remove the current Info section/actions; preserve prototype state without exposing it |

---

## File Map

### Backend (`kolaboria-api`)

- `internal/modules/project/dto.go` — add the derived project-start readiness response shape to `ProjectDetailResponse`.
- `internal/modules/project/mapper.go` — map the readiness projection from the loaded role/member counts.
- `internal/modules/project/lifecycle.go` — enforce the readiness invariant for `open` → `in_progress` inside the existing versioned transaction.
- `internal/modules/project/lifecycle_service_test.go` — test start eligibility, conflict, and role-occupancy cases.
- `internal/modules/project/dto_test.go` — verify the response uses snake_case and serializes empty blockers consistently.

### Frontend (`kolaboria-app`)

- `apps/client/app/types/project-editor.ts` — type `project_start_readiness` and its role blockers.
- `apps/client/app/services/project.service.ts` — reuse `getProjectBySlug`; no duplicate project endpoint.
- `apps/client/app/composables/useWorkspaceProjectInfo.ts` — load by route slug and expose loading, error, retry, mapped summary, and start action state.
- `apps/client/app/utils/workspace-project-info.ts` — pure mapping of `ProjectDetailResponse` into view-only labels and occupancy facts.
- `apps/client/app/pages/projects/[slug]/workspace/info.vue` — use the API-backed Info composable and pass its typed view model/actions.
- `apps/client/app/components/workspace/views/WorkspaceProjectInfoView.vue` — render project facts and read-only role readiness; remove manual readiness dropdown/events and contribution section; retain the closure card as prototype-only data.
- `apps/client/tests/workspace-project-info.test.mjs` — test mapping and route-keyed view behavior.
- `apps/client/tests/workspace-project-info-view.test.mjs` — test the readiness display and loading/error/empty states.

## Task 1: Specify and test the backend readiness projection

**Interfaces:**
- Consumes: `ProjectDetailResponse`, `ProjectRoleAggregate.FilledCapacity`, and project status.
- Produces: `ProjectStartReadinessResponse{CanStart bool, Blockers []ProjectStartReadinessBlocker}`. Each blocker has a `code` and `scope` (`project` or `role`); role-specific entries include `project_role_id`, `role_name`, `accepted_member_count`, and `capacity`, while project-level entries leave role fields null. This supports the no-roles blocker without inventing a role ID.

- [ ] **Step 1: Add response DTO tests** asserting `project_start_readiness`, `can_start`, `code`, `scope`, and role-specific blocker fields serialize in snake_case; empty blockers serialize as `[]`, and project-level blockers serialize null role fields.
- [ ] **Step 2: Run the focused API test** with `go test ./internal/modules/project -run 'TestProjectStartReadinessResponse'`; confirm the new test fails before the DTO exists.
- [ ] **Step 3: Add readiness DTOs in `dto.go`** and attach the projection to `ProjectDetailResponse`.
- [ ] **Step 4: Run the focused API test** and confirm the JSON contract passes.

## Task 2: Derive readiness from role occupancy and guard project start

**Interfaces:**
- Consumes: role aggregates already loaded with `FilledCapacity` from active contributor memberships.
- Produces: a pure readiness mapper plus a transactional invariant for `ChangeStatus(..., Status: in_progress)`.

- [ ] **Step 1: Add failing table tests** for no active contributor, one of two capacity filled, full capacity, pending-only applications, zero returned roles, and a non-`open` project.
- [ ] **Step 2: Run `go test ./internal/modules/project -run 'TestProjectStartReadiness|TestChangeStatus.*Readiness'`; confirm the new readiness cases fail.**
- [ ] **Step 3: Implement the derived mapper** using active membership counts; do not count pending application rows and do not persist readiness.
- [ ] **Step 4: Add a start-transition test** proving an unready project returns conflict without changing status/version, and a ready project transitions using the existing expected version.
- [ ] **Step 5: Enforce the check in `lifecycle.go`** inside the same transaction and project lock used for status/version validation; return the standard project conflict error when a blocker remains.
- [ ] **Step 6: Run `go test ./internal/modules/project`; confirm project and application tests pass.**

## Task 3: Add the frontend contract and pure summary mapper

**Interfaces:**
- Consumes: the API `ProjectDetailResponse` keyed by slug.
- Produces: `WorkspaceProjectInfoViewModel` containing project facts, role capacity/occupancy, and `projectStartReadiness`.

- [ ] **Step 1: Add mapper tests** for project title/summary/description/status/owner/planned dates and role occupancy.
- [ ] **Step 2: Cover readiness cases**: `0/1` is blocked, `1/2` is ready while recruitment remains open, full capacity is ready, and pending applications without membership do not affect counts.
- [ ] **Step 3: Run `pnpm --filter @kolaboria/client exec node --test tests/workspace-project-info.test.mjs`; confirm the mapper tests fail before implementation.**
- [ ] **Step 4: Extend `ProjectDetailResponse` types** with the exact snake_case readiness contract.
- [ ] **Step 5: Implement `workspace-project-info.ts`** as a pure mapper; label `start_date` as a planned date and never substitute `contributor_outcome` for final result.
- [ ] **Step 6: Run the mapper tests** and confirm the typed contract passes.

## Task 4: Load Info by route slug and handle freshness

**Interfaces:**
- Consumes: `ProjectService.getProjectBySlug(slug, signal)` and `ProjectLifecycleGateway.changeStatus(id, { version, status })`.
- Produces: a page composable exposing `summary`, `loading`, `error`, `reload`, `canStart`, and `startProject`.

- [ ] **Step 1: Add gateway tests** for success, slug changes, aborting an old request, API error, and `409` after a stale version.
- [ ] **Step 2: Run the focused client test** and confirm failures before the page composable exists.
- [ ] **Step 3: Implement `useWorkspaceProjectInfo(slug)`** using the existing project-detail and lifecycle APIs; do not read summary or readiness from Workspace localStorage.
- [ ] **Step 4: On start, send the returned project ID and version** with target status `in_progress`; on success reload the canonical project detail.
- [ ] **Step 5: On conflict, reload the project and surface its newest blockers**; do not optimistically set status/readiness.
- [ ] **Step 6: Run focused gateway tests** and verify the success and conflict states.

## Task 5: Render the API-backed Info summary

**Interfaces:**
- Consumes: `WorkspaceProjectInfoViewModel` and page loading/error/actions.
- Produces: read-only project facts and role readiness, plus a start action gated by server-provided readiness and the viewer's existing project-management capability.

- [ ] **Step 1: Add view tests** for loading, request failure/retry, absent owner profile, empty roles, open role with zero accepted members, partial occupancy, full capacity, and non-open project statuses.
- [ ] **Step 2: Extract the project summary into a focused component if needed** so its loading and error lifecycle stays independent of other Workspace areas.
- [ ] **Step 3: Remove the readiness dropdown, readiness events, and manual readiness options** from `WorkspaceProjectInfoView.vue` and `info.vue`.
- [ ] **Step 4: Render each role's recruitment state and occupancy separately** so `open` with `1/2` is both recruitable and ready to start.
- [ ] **Step 5: Gate the start action from `project_start_readiness.can_start` and the authorized viewer capability**; mirror the existing backend owner/editor authorization and keep backend checks authoritative.
- [ ] **Step 6: Keep the project-closure/task-progress card backed by local dummy metrics**; remove review-action wiring and label/treat it as prototype data until the task-board lifecycle is designed.
- [ ] **Step 7: Remove the contribution-record card, proposal/review/share controls, and their event wiring** from Info. Preserve underlying local prototype state for possible later work, but do not render or mutate it from this page.
- [ ] **Step 8: Add loading/error/empty UI states** without falling back to demo project values.
- [ ] **Step 9: Run focused Info tests and existing Workspace route/controller tests.**

## Task 6: Remove obsolete Info readiness state and verify boundaries

- [ ] **Step 1: Stop exporting `changeReadiness`, `setRoleReadiness`, `readinessOptions`, and `confirmReadinessChange` into the Info context.**
- [ ] **Step 2: Ensure legacy `roleReadiness` values in existing localStorage cannot overwrite API role occupancy.** Remove readiness from the typed domain/API path and ignore any legacy JSON key; preserve existing prototype data without destructive localStorage migration.
- [ ] **Step 3: Verify Info has no contribution events or project-review wiring and does not call contribution-record, Experience, task-summary, or closure APIs** as part of this delivery.
- [ ] **Step 4: Run `pnpm --filter @kolaboria/client test` and `pnpm --filter @kolaboria/client build`.**
- [ ] **Step 5: Run `go test ./...` from `kolaboria-api` and `git diff --check` in both repositories.**
- [ ] **Step 6: Review route-slug handling, status vocabulary, API snake_case tags, auth gating, and existing localStorage compatibility.**

## Deferred Work

- Contribution record creation, review/correction, privacy, sharing, and conversion from contribution snapshots to narratives. Revisit as a separate later scope.
- Task-board lifecycle, task closure due to scope changes, project completion review, and persisted Info metrics. Design and implement them together before integration; the current Go API has no persisted Workspace task/evidence modules.
- `result_summary` and actual `started_at`; define their lifecycle semantics and persistence with project-completion work.
# Superseded

This plan was superseded by the current implementation decisions in [`KOLABORIA_WORKSPACE_INFO_IMPLEMENTATION_PLAN.md`](../../../../docs/business/KOLABORIA_WORKSPACE_INFO_IMPLEMENTATION_PLAN.md). Its earlier readiness rule (one accepted member per position and blocking project start when empty) is obsolete. Keep this historical plan for context; do not use it as the implementation contract.

