# Workspace Info Project Summary Design

## Goal

Make the project summary and role-readiness area on `/projects/:slug/workspace/info` use the persisted Project API as its source of truth. Role readiness is derived from active project positions and accepted contributors; viewers cannot change it manually.

## Current state

- `info.vue` is a route wrapper. `WorkspaceProjectInfoView.vue` renders project details, role readiness, project-closure metrics, and contribution records from `useWorkspaceController`.
- `useWorkspacePrototype.ts` hydrates a localStorage fixture. `roleReadiness` is persisted as user-editable `ready`, `to_fill`, or `not_needed` state.
- `GET /api/v1/projects/slug/:slug` already returns project title, summary, description, status, schedule dates, ownership profiles, and role capacity data.
- Project role `filled_capacity` is computed from active contributor memberships linked to that role. Application acceptance creates that membership. `roles[].status` currently describes recruitment capacity (`open` or `filled`), not project readiness.
- The project API does not provide a final result summary or an actual project-start timestamp. `contributor_outcome` describes the contributor outcome and must not be substituted for a project result.
- The current Go API repository has no Workspace task or evidence module. Frontend services name those endpoints, but this design does not assume that they are implemented by this API.

## Scope

### Included

- Load project facts for the route slug from the existing project-detail endpoint.
- Show project title, summary, description, category, project status, owner profile, planned start date, deadline, and role positions.
- Derive each role's state from current active-member occupancy. A role with at least one accepted active contributor is ready to start, even if capacity remains open. A role with zero accepted active contributors blocks start. Pending applications do not count as accepted contributors.
- Keep recruitment state distinct from start readiness. `open` and `filled` describe remaining capacity; occupancy/readiness describes whether any active contributor has been accepted.
- Enforce the same readiness rule in the backend when changing a project from `open` to `in_progress`; the FE display is advisory, the transactional backend check is authoritative.
- Keep project archival represented by the project status. Do not expose a position-archive state in this Info contract.
- Replace the manually editable readiness dropdown and stop treating localStorage readiness values as domain state.

### Deferred

- Contribution records, private Experience creation, review notes, correction, and sharing. No database fields, response fields, endpoints, composables, or UI wiring for those records are part of this work.
- Task-progress and project-closure integration. Keep the existing closure card and its local demo metrics visible as prototype data, but do not wire its review action or treat the counts as API facts. Implement the lifecycle and persisted data together with the task-board scope so task completion, scope-change closure, and project review share one consistent workflow.
- Final project result summary and actual `started_at`. They belong to project lifecycle/closure semantics, which the current detail response does not define. Keep planned `start_date` distinct and do not map either field to `contributor_outcome`.

## Data and behavior contract

Use the existing `ProjectDetailResponse` as the read source. Map `title`, `summary`, `description`, `project_category`, `status`, `owner`, `start_date`, `deadline`, and `roles` into the Info view model. The API does not currently provide `result_summary`, actual `started_at`, or task/closure metrics. Do not infer these from similarly named project inputs or contributor fields.

Each role's `filled_capacity` is the active accepted-member count for capacity purposes; `remaining_capacity` and `status` remain recruitment facts. Add a derived `project_start_readiness` response object with `can_start` and blocker entries. Role blockers identify the role ID/name; the no-roles case uses a project-level blocker with no role ID. This gives FE and BE one published rule. The object is computed on reads and is never persisted. The response remains a project summary read model: no new table or migration is needed for the derived readiness value.

For project status `open`, `can_start` is true only when the project has at least one returned role and every returned role has at least one active contributor membership. Capacity does not need to be full. A response with no roles is blocked with a project-level blocker because the project has no staffed position to start from. Pending applications do not count. For `draft`, `awaiting_owner`, `in_progress`, `completed`, and `archived`, `can_start` is false and no start action is offered. The status-change service recomputes this rule inside its transaction before accepting `in_progress`.

Project details remain snake_case in the HTTP response. `start_date` means the planned date. The FE labels it accordingly. Project summary read errors, empty role data, and owner profile absence have explicit UI states; no fallback to localStorage project fields is allowed in the API-backed summary.

## Existing Info sections and slice boundary

This slice owns project facts and role readiness only. It must not add contribution-record persistence or behavior. Remove the “Rekam kontribusi” section and its Info-page event wiring from Workspace Info. Keep any existing prototype contribution data intact for possible later work, but do not expose it on this page. Keep the “Penutupan proyek” card as an explicitly prototype-only display using local dummy task metrics; do not wire the review action or represent those values as persisted API facts. Define the closure lifecycle together with the future task-board scope. The API-backed summary should focus on project-authored facts and role readiness.

## Access and freshness

Only the authorized project owner/editor may invoke the start transition; the backend repeats authorization and readiness checks. The page loads by route slug and uses the returned project ID/version for the lifecycle request. After a role membership changes or a start succeeds, refresh project details. On a version/readiness conflict, refresh and show current blockers rather than retaining stale readiness.

## Acceptance criteria

- Info summary fields are read from the project-detail API response for the route slug.
- Role status is derived from active accepted-member occupancy, not a user mutation or localStorage field.
- Partial occupancy (`1/2`) is start-ready while the role remains open for recruitment; zero occupancy is a blocker; full occupancy is ready and full.
- A pending application without an active membership is not counted.
- The backend rejects stale or unready `open` → `in_progress` transitions and returns the standard conflict envelope.
- Project archive is a project-level state; no role-archive status is introduced to the Info response.
- Contribution records and task/closure summaries are not fetched, persisted, or implemented by this feature slice.
- The contribution card/actions are absent from Workspace Info; underlying local prototype state is preserved.
- The project-closure card remains visible as local dummy data, with no review action wiring or API claim, until task-board implementation.
# Superseded

This design was superseded by the current implementation decisions in [`KOLABORIA_WORKSPACE_INFO_IMPLEMENTATION_PLAN.md`](../../../../docs/business/KOLABORIA_WORKSPACE_INFO_IMPLEMENTATION_PLAN.md). In particular, readiness now requires each active position's full quota, underfilled positions can proceed only after explicit confirmation, and Info uses the authenticated Workspace Info API. Keep this historical document for context; do not use it as the implementation contract.

