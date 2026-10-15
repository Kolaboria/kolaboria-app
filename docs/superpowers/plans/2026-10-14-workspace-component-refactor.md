# Workspace Component Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Refactor the Workspace prototype into focused typed Vue components and composables, and remove `Demo` from its filenames and exported names while preserving its current behavior.

**Architecture:** `WorkspaceApp.vue` will own the shared shell, while six view components render feature areas from explicit props and typed events. `useWorkspacePrototype.ts` retains simulated domain state and persistence; `useWorkspaceController.ts` coordinates page-local UI state and actions; focused dialog components and presentation helpers keep rendering and orchestration maintainable.

**Tech Stack:** Vue 3, Nuxt, TypeScript, Node `node:test` scripts with the existing frontend runtime helper, Vue 3, TypeScript, and pnpm.

**Spec:** `docs/superpowers/specs/2026-10-14-workspace-component-refactor-design.md`

## Global Constraints

- Give each Workspace view a dedicated child URL; redirect the bare workspace path to overview.
- Preserve localStorage key `kolaboria-workspace-prototype-v1` and the Nuxt shared-state key.
- Preserve current copy, permission rules, confirmations, task and project lifecycles, contribution visibility, responsive behavior, sticky sidebar, and board scrolling.
- Keep the prototype local-data-only; do not connect it to endpoints.
- Do not reintroduce milestone functionality.
- Use explicit typed props and emits; extracted views must not call the simulation composable directly.
- Preserve existing unrelated user changes and do not commit shared uncommitted work.

## Review Focus

- Stored prototype state from an earlier version: test that existing storage keys still hydrate and persist the same data shape in Task 1.
- Closed task reopened after confirmation: test status changes and reason clearing only on success in Task 1.
- Project or member switching with active search/assignee/status filters: test reset behavior in the controller in Task 3.
- Critical action cancellation: test cancel leaves permissions/project state unchanged and confirm executes exactly once in Task 3.
- Narrow mobile viewport and long board content: preserve the existing responsive and bounded-scroll class structure during view extraction, then inspect the diff and verify the client build in Tasks 4–6.

---

## File map

- `apps/client/app/components/workspace/WorkspaceApp.vue` — shared workspace shell and active-view composition; renamed from `WorkspaceDemoApp.vue`.
- `apps/client/app/components/workspace/views/WorkspaceOverviewView.vue` — overview-only presentation and events.
- `apps/client/app/components/workspace/views/WorkspaceTasksView.vue` — filters and five-column task board.
- `apps/client/app/components/workspace/views/WorkspaceTeamView.vue` — project members and task-management permission actions.
- `apps/client/app/components/workspace/views/WorkspaceDiscussionView.vue` — project discussion list and events.
- `apps/client/app/components/workspace/views/WorkspaceActivityView.vue` — activity list.
- `apps/client/app/components/workspace/views/WorkspaceProjectInfoView.vue` — project context and closure/contribution controls.
- `apps/client/app/components/workspace/dialogs/WorkspaceTaskDialog.vue` — task create/detail flow.
- `apps/client/app/components/workspace/dialogs/WorkspaceDiscussionDialog.vue` — discussion creation flow.
- `apps/client/app/components/workspace/dialogs/WorkspaceProjectCloseDialog.vue` — project result review/close flow.
- `apps/client/app/components/workspace/dialogs/WorkspaceConfirmationDialog.vue` — critical action confirmation presentation.
- `apps/client/app/composables/useWorkspacePrototype.ts` — simulated state, persistence, permissions, and domain actions; renamed from `useWorkspaceDemo.ts`.
- `apps/client/app/composables/useWorkspaceController.ts` — navigation, derived view model, local forms/dialog coordination, action handlers.
- `apps/client/app/utils/workspace-prototype-state.ts` — pure state transitions; renamed from `workspace-demo-state.ts`.
- `apps/client/app/utils/workspace-presentation.ts` — status, priority, date, readiness, and contribution display helpers.
- `apps/client/app/pages/projects/[slug]/workspace.vue` — apply the shared workspace layout and render the child route.
- `apps/client/app/pages/projects/[slug]/workspace/index.vue` — redirect the bare workspace path to overview.
- `apps/client/tests/workspace-prototype-state.test.mjs` — renamed state test plus migration/transition coverage.
- `apps/client/tests/workspace-controller.test.mjs` — controller navigation, filters, and confirmation tests using established client test conventions.

## Task 1: Lock prototype state and interaction contracts

**Files:**
- Modify: `apps/client/tests/workspace-demo-state.test.mjs`
- Test: `apps/client/tests/workspace-demo-state.test.mjs`
- Reference: `apps/client/app/composables/useWorkspaceDemo.ts`
- Reference: `apps/client/app/utils/workspace-demo-state.ts`

**Interfaces:**
- Consumes: current workspace state shape and current exported transition functions.
- Produces: named regression coverage for persisted-state compatibility, task status transitions, project completion gates, contribution privacy, and action permissions. Production exports remain unchanged in this task.

- [x] **Step 1: Review the existing state regression cases** for task reopen, project completion, permissions, and contribution privacy; they already cover the listed domain contracts.
- [x] **Step 2: Run the state test file** with `pnpm --filter @kolaboria/client exec node --test tests/workspace-demo-state.test.mjs`; baseline is 12/12 passing.
- [x] **Step 3: Confirm no domain-state correction is needed**; existing close/reopen and private contribution rules match the spec, and storage keys are retained in the composable.
- [x] **Step 4: Run the state test file again** after rename work and confirm all state contract cases pass.

## Task 2: Rename simulation modules and public identifiers

**Files:**
- Rename: `apps/client/app/composables/useWorkspaceDemo.ts` → `apps/client/app/composables/useWorkspacePrototype.ts`
- Rename: `apps/client/app/utils/workspace-demo-state.ts` → `apps/client/app/utils/workspace-prototype-state.ts`
- Rename: `apps/client/tests/workspace-demo-state.test.mjs` → `apps/client/tests/workspace-prototype-state.test.mjs`
- Modify: all imports and exports referring to the renamed simulation modules/types.
- Test: `apps/client/tests/workspace-prototype-state.test.mjs`

**Interfaces:**
- Consumes: passing state contracts from Task 1.
- Produces: `useWorkspacePrototype()` and `workspace-prototype-state.ts` exports with prototype/neutral names. Keep storage identifiers and serialized data shape unchanged.

- [x] **Step 1: Add an export-name assertion** that no state export has a `Demo` identifier.
- [x] **Step 2: Run the assertion before migration** and confirm it fails with the existing 20 `Demo`-named exports.
- [x] **Step 3: Rename simulation modules and exported domain identifiers** to `WorkspacePrototype` or neutral names; update imports and defer the route entry-point rename to Task 6.
- [x] **Step 4: Run the renamed state test file and stale-name search**; 13/13 tests pass and only the root `WorkspaceDemoApp` route entry remains for Task 6.

## Task 3: Extract presentation helpers and UI controller

**Files:**
- Create: `apps/client/app/composables/useWorkspaceController.ts`
- Create: `apps/client/app/utils/workspace-presentation.ts`
- Modify: renamed workspace root component from Task 2.
- Test: `apps/client/tests/workspace-controller.test.mjs`

**Interfaces:**
- Consumes: `useWorkspacePrototype()` and pure state/domain APIs from Task 2.
- Produces: `useWorkspaceController()` with a typed view model plus navigation, project/member switching, filter, form, dialog, and action handlers; presentation helpers accept domain values and return display labels/formatting without mutating state.

- [x] **Step 1: Add controller regression tests** for initial view, project/member change resetting search and filters, active assignee filter clearing, and confirmation cancel/confirm outcomes.
- [x] **Step 2: Run the controller test file** with `pnpm --filter @kolaboria/client exec node --test tests/workspace-controller.test.mjs`; confirm tests fail because the controller module is not implemented.
- [x] **Step 3: Implement presentation helpers** for the exact labels and date/status/priority/readiness/contribution formatting currently embedded in the root component; add no new copy or rules.
- [x] **Step 4: Implement `useWorkspaceController()`** and move page-local state/handlers from the root component, retaining typed returns and explicit confirmation execution.
- [x] **Step 5: Run controller and state tests**; confirm filter reset and confirmation behavior passes without changing domain tests.

## Task 4: Extract task, team, discussion, activity and project-info views

**Files:**
- Create: `apps/client/app/components/workspace/views/WorkspaceTasksView.vue`
- Create: `apps/client/app/components/workspace/views/WorkspaceTeamView.vue`
- Create: `apps/client/app/components/workspace/views/WorkspaceDiscussionView.vue`
- Create: `apps/client/app/components/workspace/views/WorkspaceActivityView.vue`
- Create: `apps/client/app/components/workspace/views/WorkspaceProjectInfoView.vue`
- Modify: `apps/client/app/components/workspace/WorkspaceApp.vue`

**Interfaces:**
- Consumes: typed controller view model/actions from Task 3.
- Produces: view-only components with explicit typed props and emits for user actions; no view imports `useWorkspacePrototype()` or owns domain state.

- [x] **Step 1: Extract the five view templates** while preserving existing text, design-system components, responsive classes, status categories, and board-only scrolling; define props/emits from each rendered data/action dependency.
- [x] **Step 2: Wire views into `WorkspaceApp.vue`** through controller state and handlers; remove the corresponding duplicate markup from the root component.
- [x] **Step 3: Run `pnpm --filter @kolaboria/client exec node --test tests/workspace-prototype-state.test.mjs tests/workspace-controller.test.mjs`** and confirm state/action behavior still passes.
- [x] **Step 4: Run `pnpm --filter @kolaboria/client build`** and fix type/template errors before proceeding.

## Task 5: Extract overview view and modal flows

**Files:**
- Create: `apps/client/app/components/workspace/views/WorkspaceOverviewView.vue`
- Create: `apps/client/app/components/workspace/dialogs/WorkspaceTaskDialog.vue`
- Create: `apps/client/app/components/workspace/dialogs/WorkspaceDiscussionDialog.vue`
- Create: `apps/client/app/components/workspace/dialogs/WorkspaceProjectCloseDialog.vue`
- Create: `apps/client/app/components/workspace/dialogs/WorkspaceConfirmationDialog.vue`
- Modify: `apps/client/app/components/workspace/WorkspaceApp.vue`
- Modify: `apps/client/app/composables/useWorkspaceController.ts`

**Interfaces:**
- Consumes: the typed view model/actions from Task 3 and existing design-system dialog/form controls.
- Produces: controlled dialog/view components that emit submit, cancel, and intent events; controller keeps pending confirmation and executes domain actions exactly once after confirmation.

- [x] **Step 1: Extend controller tests** with named cases for task submit/cancel, discussion submit/cancel, project close review, and confirmation cancel/confirm, asserting state changes only on submit/confirm.
- [x] **Step 2: Run the controller tests** and confirm the new flow assertions fail before controller wiring is implemented.
- [x] **Step 3: Extract `WorkspaceOverviewView.vue` and four dialog components** with typed props/emits; use existing design-system components and retain current confirmation wording/flow.
- [x] **Step 4: Wire view/dialog events to the controller** and remove their forms/modal markup and dialog coordination from `WorkspaceApp.vue`.
- [x] **Step 5: Run targeted controller/state tests and client build**; confirm event flows pass and templates compile.

## Task 6: Finish entry-point migration and validate complete prototype

**Files:**
- Rename: `apps/client/app/components/workspace/WorkspaceDemoApp.vue` → `apps/client/app/components/workspace/WorkspaceApp.vue` (if not already renamed during extraction).
- Modify: `apps/client/app/pages/projects/[slug]/workspace/index.vue`
- Modify: all prototype imports/type references.
- Test: all client tests and build.

**Interfaces:**
- Consumes: extracted views/dialogs and `useWorkspaceController()` from Tasks 3–5.
- Produces: route-level `WorkspaceApp` entry with no `Demo` suffix in implementation filenames/public symbols; stable route and persisted prototype data.

- [x] **Step 1: Update the route component and imports** to render `WorkspaceApp`; preserve authorization and route behavior.
- [x] **Step 2: Search for stale names and direct store access** using `rg -n "WorkspaceDemo|useWorkspaceDemo|workspace-demo-state|WorkspaceDemoApp|useWorkspacePrototype" apps/client/app apps/client/tests`; only new names and intentional serialized migration keys remain.
- [x] **Step 3: Run all client tests** with `pnpm --filter @kolaboria/client test`; report unrelated baseline or network failures with exact failing suites.
- [x] **Step 4: Run `pnpm --filter @kolaboria/client build`**; expected result is a successful client production build.
- [x] **Step 5: Review the final diff and run `git diff --check`**; confirm no milestone code was reintroduced and no unrelated pre-existing changes were overwritten.

## Route structure follow-up

The workspace shell now lives in `layouts/workspace.vue`; `pages/projects/[slug]/workspace.vue` applies it to the nested routes. Each view has its own route (`overview`, `tasks`, `team`, `discussion`, `activity`, and `info`), while the `index.vue` child redirects to `overview`. Legacy API-backed presentation components with no active callers were removed; the API service/composables remain available for backend integration.


