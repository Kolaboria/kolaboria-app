# Project Lead Claim and Contributor Applications — Design Spec

> **Latest reference for overlapping applicants/applications scope:** use [13 October 2026 requirements r2](../../../../kolaboria-api/docs/applicants-api-requirements.md) and its [implementation plan](../../../../kolaboria-api/docs/superpowers/plans/2026-10-13-applicants-api-and-client.md). This 9 October document records historical context; its original statements about missing Apply/schema/capabilities do not describe the active API today. Claim details remain context for a separate dependency and must be reconciled with current user decisions and active contracts before execution.

> **Status:** Draft for user review. This document records the approved design direction and marks detailed product rules that still need confirmation. It is not implementation approval.

## 1. Problem and goal

The project detail page contains a development-only simulation path for owner, applicant, claim, cooldown, and project-status cases. The active API does not yet implement claim or application operations: project detail capabilities are currently mapped to `false`, and the registered project routes cover read, draft create/update, and publish only. The frontend already calls application endpoints, but these requests have no matching active API routes.

Remove the simulation path and make the real end-to-end journey usable: an eligible talent can claim an unowned organization project, a contributor can apply to an eligible project, and a project owner can review applications. Every visible status should use short Indonesian copy and offer the next available action. Persistent CTA buttons must not be disabled merely because the user needs to sign in or verify an email; those actions should lead to the relevant step.

## 2. Approved decisions and proposed rules

| Rule | State | Detail |
| --- | --- | --- |
| Claim assignment | **Approved by user** | Direct, first valid claim wins. The winning claim assigns the Project Lead/owner. |
| Reapplication delay | **Approved by user** | A rejected applicant waits exactly 3×24 hours before applying again to the same project. The restriction is per applicant/project, applies across roles within that project, does not block the applicant from other projects, and does not block other applicants from this project. |
| Ownerless project applications | **Existing product decision** | Contributors cannot apply until an owner/Project Lead has claimed the project. |
| Claim eligibility | **Approved with restriction** | Authenticated, active, onboarded, email-verified talent; project is public, organization-initiated, `awaiting_owner`, and has no owner. The organization initiator may claim only a project they did not create/initiate; the actor must not match the project's `created_by_user_id`/initiator identity. |
| Claim outcome | **Proposed** | One transaction assigns `owner_id`, creates the active owner membership, changes status to `open`, and increments project version. A concurrent losing claim receives a clear conflict response. |
| Application uniqueness and cooldown | **Approved by user** | One pending or accepted application per user per project, regardless of role. Rejected history is retained. A rejection blocks only that same applicant from applying to the same project for 72 hours, across roles; other projects and other applicants are unaffected. |
| Withdraw and reapply | **Proposed** | A user may withdraw a pending application and apply again immediately if the project is still eligible. Withdrawal does not create a rejection cooldown. |
| Accepting an application | **Proposed** | Acceptance creates an active contributor membership and consumes that role's capacity atomically. It does not automatically start the project; status remains `open` until a separate project-start flow is agreed. |
| Notifications and Workspace | **Out of scope** | No notification delivery, workspace operations, project completion, or experience-record behavior is added here. |

## 3. Scope

### In scope

- Remove `?simulate`, simulation fixtures, local simulated claim/application actions, and their tests from the project detail flow.
- Add persisted claim and application operations to the active Go API and PostgreSQL schema.
- Return viewer-specific application state, retry time after rejection, accurate action capabilities, and a pending-application count visible only to the project owner.
- Wire the project detail CTA, apply modal, applicant-management page, and existing My Applications page to the active API contract.
- Enforce identity, verification, project ownership, application status, role capacity, and cooldown in the API on every mutation.
- Use existing design-system components, tokens, and ticker variants. Keep user-facing messages short and non-technical.

### Out of scope

- Workspace membership tools, project start/complete/archive commands, notification delivery, invitation flows, organization curation, and changes to project creation/editor behavior.
- Changes to deprecated API repositories or schemas.
- Any development-only simulation or seeded applicant data in production code.

## 4. User flow and visible states

| Project/viewer state | Detail-page behavior |
| --- | --- |
| Owner's personal project, open, slots available, no pending applications | Show the owner actions. Hide the application-status ticker. |
| Owner's project with pending applications | Show a concise pending count and an active **Kelola Pelamar** action. The applicants page validates access through API capability/authorization, not `creator_id` equality. |
| Organization project awaiting a lead; guest viewer | Explain that the project needs a Project Lead. Offer **Masuk untuk claim** and return to the same project after login. |
| Organization project awaiting a lead; unverified viewer | Offer **Verifikasi email untuk claim** and preserve a return path to the project. Do not show a disabled claim button. |
| Organization project awaiting a lead; eligible talent | Offer **Claim sebagai Project Lead**, confirm intent, then submit the claim. On a race conflict, refresh detail and explain that another talent claimed it. |
| Project with owner, open capacity; guest viewer | Offer sign-in with a return path to apply. |
| Project with owner, open capacity; unverified talent | Offer email verification, then return to apply. The API also rejects unverified submissions. |
| Project with owner, open capacity; eligible talent, no current application | Offer **Ajukan Kontribusi** and open the existing application form. |
| Applicant has a pending application | Show **Lamaranmu sedang ditinjau** and a route to My Applications; allow withdrawal from the application-management flow. |
| Applicant was rejected less than 3 days ago | Show a short retry time/message; do not offer an unusable apply action. |
| Applicant was rejected at least 3 days ago, project otherwise eligible | Offer a new application. |
| Applicant accepted | Explain that the talent has joined. Do not offer duplicate application. |
| Role quota full but another role has room | Show available roles and allow an application only to a role with capacity. |
| All role quotas full | Show **Kuota kontributor sudah penuh** without an inert/disabled apply button. |
| Project in progress, completed, archived, draft, private, or not found | Show the appropriate concise status or existing visibility/not-found behavior. Do not expose private application details. |
| Project owner has no pending applications | Do not show an empty pending-applications ticker. |

All action CTAs remain navigable when authentication or verification is required. Temporary submission/loading protection may prevent duplicate requests while a request is actively in progress; business-state restrictions are explained in copy rather than represented by an indefinitely disabled control.

## 5. API design

All responses use the current `{ status, message, data }` envelope and snake_case fields. Authorization and eligibility are derived from persisted records on every command.

| Method and route | Access | Behavior |
| --- | --- | --- |
| `POST /api/v1/projects/:id/claim` | Authenticated, eligible talent who did not create/initiate the target project | Atomically claims a public organization-initiated project in `awaiting_owner` with no owner. No request body. |
| `POST /api/v1/projects/:id/apply` | Authenticated, eligible talent | Creates a pending application for one open role. Request follows the current frontend fields: `project_role_id`, `motivation`, `expected_contribution`, `portfolio_links`, `availability`, `estimated_hours_per_week`. |
| `GET /api/v1/projects/:id/applicants` | Project owner | Returns applicant records, role and profile summaries, status, and review metadata. |
| `GET /api/v1/applications/my-applications` | Authenticated applicant | Returns the viewer's applications and project summaries. |
| `PATCH /api/v1/applications/:id/review` | Project owner | Accepts `status` of `accepted` or `rejected` and optional `reviewer_note`. Only pending applications may be reviewed. |
| `POST /api/v1/applications/:id/withdraw` | Applicant who owns a pending application | Marks that application withdrawn. |
| Existing project detail `GET` routes | Optional authentication | Include viewer state and capabilities when authenticated; anonymous viewers get public project data only. |

The project detail response gains a nullable `viewer_application` object (status, applied/reviewed timestamps, and `retry_after` where applicable) plus `pending_application_count` for an authorized owner. `capabilities.can_claim`, `can_apply`, and `can_manage_applications` are computed from the project, viewer, application history, capacity, and persisted identity state. Counts and viewer state must not disclose other applicants to non-owners.

## 6. Persistence and transaction rules

Add a forward-only migration creating `project_applications`, linked to `projects`, `project_roles`, and applicant/reviewer users. Persist motivation, expected contribution, portfolio links, availability, estimated weekly hours, status (`pending`, `accepted`, `rejected`, `withdrawn`), reviewer note, applied/reviewed/withdrawn timestamps, and reviewer identity. Add indexes for project/status, applicant/status/history, and a partial uniqueness constraint preventing more than one pending or accepted application for the same applicant/project.

Claim locks the project row and revalidates status, visibility, creation mode, owner, and actor-versus-creator/initiator identity inside the transaction before updating the project and creating the owner membership. A project creator/initiator cannot claim that same project; another eligible talent may claim it. The existing unique active-owner index remains a second integrity boundary.

Application create/review operations lock project and role rows in a consistent order. Accept rechecks that the application is pending, the applicant is not already a member, the role belongs to the project and is open, and active membership count is below capacity; it then creates the contributor membership and marks the application accepted in the same transaction. Reject records `reviewed_at`; reapplication is denied until 72 hours after the latest rejection for that applicant/project, across all roles in that project. This cooldown must be keyed by both applicant and project: the same applicant remains free to apply to another project, and another applicant remains free to apply to this project. If capacity changes or a race makes an action invalid, return a stable conflict response and let the frontend refresh canonical detail data.

## 7. Frontend behavior and copy

- Remove simulation imports, query watchers, scenario selector, local fake applicant rows/reviews, and the `simulation` prop/branch in the application modal.
- Derive owner/applicant/claim/apply states from the canonical project detail response and application endpoints; do not infer permission from a client-side owner ID comparison.
- Replace the disabled verification-gated apply button with a verification route action. Guest actions go to login with the project return path. Claim and apply submissions stay in existing modals/flows and show mapped Indonesian success/error copy.
- Keep owner management and applicant review reachable through the existing applicants route, but enforce owner access on the API and check the actual `can_manage_applications` capability in the page.
- Keep labels short, for example: “Butuh Project Lead”, “Lamaranmu sedang ditinjau”, “Kamu bisa mengajukan lagi dalam 2 hari”, “Kuota kontributor sudah penuh”, and “Proyek sedang berjalan”. Copy must not expose route, server, or database terminology.
- Reuse current `AtomicButton`, `MoleculeTicker`, modal, semantic color tokens, and existing responsive patterns; do not add custom design-system components or raw colors.

## 8. Security and privacy

- Claim/apply/review/withdraw endpoints require authentication; claim and application submission additionally require an active, onboarded, email-verified talent account.
- A user cannot claim an already-owned project or a project they created/initiated, apply to a project they own, apply while already an active member, or review applications for a project they do not own.
- Only the applicant and authorized project owner receive private application data. Public detail receives no applicant identity or reviewer notes.
- Never trust `can_*` values sent by the client; re-check status, ownership, capacity, verification, and cooldown inside the service transaction.
- Error responses follow the API error envelope and map expected conflict/eligibility errors to concise Indonesian user messages.

## 9. Acceptance criteria

1. No project detail route or modal reads `simulate` query state or renders local simulation fixtures.
2. A first eligible claim succeeds exactly once under concurrent requests; the project becomes owned/open and detail capabilities refresh.
3. Guests and unverified talents have an enabled next step (login or verification) instead of an inert disabled CTA.
4. Eligible talent can apply to an open role and sees the persisted pending state after refresh/re-login.
5. A second active application, application by owner/member, application without an owner, application after project closure, and application before cooldown expiry are rejected with stable responses.
6. Owner can see only their project's applicants; accept reserves exactly one available role slot and creates a contributor membership; reject starts a 72-hour cooldown only for that applicant/project pair, across roles. The same applicant can apply elsewhere and other applicants can still apply to this project.
7. Withdrawn applications can be re-submitted immediately if the project remains eligible; accepted applications cannot be duplicated.
8. Owners with no pending applications do not see an empty ticker; owners with pending applications have a working management CTA.
9. Detail copy covers unclaimed, open/available, pending, accepted, rejected/cooldown, full, in-progress, completed, archived, guest, and unverified cases in concise Indonesian.
10. Frontend access checks and backend authorization agree; changing client state or URL does not grant claim, apply, or review rights.
11. Existing detail/editor behavior outside claim/application operations remains intact.

## 10. Verification design

- API unit/service tests for claim eligibility, races/conflicts, cooldown timing, duplicate/withdrawn submissions, status transitions, review authorization, and capacity boundaries.
- PostgreSQL integration tests against the repository's explicitly isolated project-editor test database; verify migration replay and rollback safety there only.
- Handler/DTO contract tests for envelope shape, snake_case fields, optional-auth detail state, and owner-only applicant data.
- Frontend Node tests for state-to-copy/action mapping, login/verification return paths, removal of simulation branches, and application/claim command handling.
- Run the complete client test suite, Go tests/vet, API build, Vue type checks, and client production build. Perform browser verification for guest, unverified, eligible talent, owner, rejected-cooldown, and full-capacity flows if a local runtime/API/DB can be configured.
- Report database/browser evidence separately; source tests or a successful build alone do not prove the complete API/database journey.

## 11. Open questions for spec review

| Question | Proposed default | Why it needs review |
| --- | --- | --- |
| Can a withdrawn applicant apply again immediately? | Yes, if the project remains eligible. | This preserves the distinction between a user withdrawing and an owner rejecting. |
| Does accepting an application automatically move the project to `in_progress`? | No; acceptance creates membership but leaves project `open`. | The requested case includes accepted/current slots while a project is not yet running; a start transition is outside this scope. |

## 12. Source evidence

- Current API route registration: `kolaboria-api/internal/modules/project/routes.go`.
- Current project capability mapper: `kolaboria-api/internal/modules/project/mapper.go`.
- Current active API milestone and migration baseline: `kolaboria-api/docs/project-editor.md`, `kolaboria-api/migrations/000009_create_project_editor_tables.up.sql`.
- Current project and membership constraints: `kolaboria-api/internal/modules/project/entity.go`, `kolaboria-api/internal/modules/project/repository.go`.
- Existing frontend application consumers/contracts: `kolaboria-app/apps/client/app/types/project.ts`, `app/services/project.service.ts`, `app/services/application.service.ts`, `app/components/project/ApplyModal.vue`, `app/pages/projects/[slug]/applicants.vue`.
- Current agreed user decisions in this thread: remove detail simulations; claim is direct/first-valid-claim-wins; an organization initiator may claim only projects they did not create/initiate; rejection cooldown is exactly 72 hours per applicant/project across roles, without affecting other projects or applicants; simplify case copy; no persistent disabled CTA for a user who has a valid next step.
