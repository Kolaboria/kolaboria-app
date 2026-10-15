# Workspace Component Refactor Design

## Goal

Refactor the 2,500-line Workspace prototype into focused, typed Vue components and UI controllers, with filenames and exported identifiers no longer using the `Demo` suffix/prefix. Preserve the existing experience and simulated data behavior.

## Context and constraints

- The Workspace has a shared shell with dedicated child routes for overview, tasks, team, discussion, activity, and project info. Visiting `/workspace` redirects to `/workspace/overview`.
- The page component combines application shell, six view areas, task filtering, local UI state, action confirmation, and four modal flows.
- Prototype state and domain transitions live separately in `useWorkspaceDemo.ts` and `workspace-demo-state.ts`.
- The earlier API-backed Workspace presentation components were unused by the active routes and have been removed. The API service and data composables remain separate for future backend integration.
- The prototype remains local-data-only. This work does not introduce endpoint calls or change the API-backed workspace flow.
- Preserve the localStorage key `kolaboria-workspace-prototype-v1` and the Nuxt shared-state key so existing simulated state remains readable.
- Preserve user-facing copy, permission rules, confirmations, task lifecycle, project lifecycle, contribution visibility, mobile navigation, sticky sidebar, and Kanban scrolling behavior.
- The previously removed milestone feature must not be reintroduced.

## Architecture

### Page composition

Rename `WorkspaceDemoApp.vue` to `WorkspaceApp.vue`. It remains the shared shell for sidebar navigation, top bar, active project selector, page title/action area, mobile navigation, and notices. The workspace parent route applies the workspace layout, and child routes render their dedicated view components. The bare workspace path redirects to overview.

Move view-specific markup into typed feature components, each receiving the data it renders through props and reporting user intent through typed emits:

- `WorkspaceOverviewView.vue`: review prompt, project readiness prompt, progress cards, priorities, recent discussion, and recent activity.
- `WorkspaceTasksView.vue`: task filters, assignee avatars, search, five status columns, and task cards.
- `WorkspaceTeamView.vue`: member rows, task shortcuts, and task-management access controls.
- `WorkspaceDiscussionView.vue`: project discussions, replies, and empty state.
- `WorkspaceActivityView.vue`: the complete project activity list.
- `WorkspaceProjectInfoView.vue`: project context, role readiness, project close entry point, contribution review/sharing, and prototype controls.

Keep layout, styling, and responsive behavior close to the current markup during extraction. Components must not reach into the prototype store directly; required data and callbacks cross component boundaries through props and emits.

### UI controller and simulated domain state

Rename `useWorkspaceDemo.ts` to `useWorkspacePrototype.ts`. It remains responsible for reactive simulated state, persistence, permissions, domain actions, and user feedback.

Extract page-local navigation, derived display state, form state, and dialog/action orchestration from the Vue SFC into `useWorkspaceController.ts`. Keep domain transitions in `workspace-prototype-state.ts`; the controller coordinates the view components with the prototype composable and keeps confirmation behavior explicit. Date/status/priority/readiness/contribution presentation helpers should move to a small `workspace-presentation.ts` utility so views do not duplicate labels or formatting rules.

The controller exposes a typed view model and action handlers. It must not expose mutable prototype state broadly when a view only needs a subset; view components receive explicit props and typed events.

### Dialog components

Split the shared modal content into focused components:

- `WorkspaceTaskDialog.vue`: task creation/detail, task status, comments, close-for-scope, and delete entry points.
- `WorkspaceDiscussionDialog.vue`: create discussion form.
- `WorkspaceProjectCloseDialog.vue`: project outcome review and result summary.
- `WorkspaceConfirmationDialog.vue`: reusable confirmation presentation for critical actions.

The controller owns dialog selection, pending confirmation, and action execution. Dialog components render controlled state and emit typed submit, cancel, and intent events. The existing design-system inputs, buttons, tags, avatars, and modal remain in use.

### Naming migration

Use these names for the simulation files:

- `WorkspaceDemoApp.vue` → `WorkspaceApp.vue`
- `useWorkspaceDemo.ts` → `useWorkspacePrototype.ts`
- `workspace-demo-state.ts` → `workspace-prototype-state.ts`
- `workspace-demo-state.test.mjs` → `workspace-prototype-state.test.mjs`

Rename exported domain types and functions that currently use `WorkspaceDemo`/`Demo` to `WorkspacePrototype`/neutral domain names, updating every import and test. Keep storage identifiers stable for migration compatibility. Workspace views use their dedicated child paths, with the bare path redirecting to overview.

## Behavior and compatibility

- No task, access, review, project closure, discussion, activity, or contribution behavior changes.
- Closed tasks remain reopenable through the existing confirmed status transition; the close reason is cleared only after the transition succeeds.
- Project/member switching resets view filters and search in the same way as before.
- The board retains five columns and its current bounded scrolling behavior.
- Mobile navigation, filter controls, and modal fullscreen behavior remain equivalent.
- Existing local state continues to migrate and persist under its current browser storage key.

## Testing and acceptance criteria

- Every extracted view and dialog has typed props and emits; no extracted view imports or calls the simulation composable.
- The parent route resolves the workspace layout, each child path resolves its matching view, and the bare workspace path redirects to overview. No Workspace prototype imports point to deleted `*Demo*` filenames or `WorkspaceDemo*` exports.
- Unit tests cover state migration, task permissions and transitions, project lifecycle, contribution privacy, and persistence compatibility.
- Component/controller tests cover navigation and filter reset behavior, task interactions, confirmation cancel/confirm flows, and view event wiring.
- Existing visual contracts remain: responsive navigation, sticky desktop sidebar, mobile controls, board-only scrolling, and five status columns.
- `pnpm --filter @kolaboria/client test` and `pnpm --filter @kolaboria/client build` are run. Any baseline suite failures unrelated to this refactor are recorded separately.

## Out of scope

- Connecting prototype features to API endpoints or replacing the simulated store with backend data.
- Changing workspace business rules, UI copy, visual design, or route authorization.
- Changing the API-backed service/composable contracts.
- Adding milestone functionality.
