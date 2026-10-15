import { inject, type InjectionKey } from "vue";
import type {
  WorkspaceActivityContext,
  WorkspaceController,
  WorkspaceDiscussionContext,
  WorkspaceOverviewContext,
  WorkspaceProjectInfoContext,
  WorkspaceTasksContext,
  WorkspaceTeamContext,
} from "~/composables/useWorkspaceController";

export interface WorkspaceViewContexts {
  overview: WorkspaceOverviewContext;
  tasks: WorkspaceTasksContext;
  team: WorkspaceTeamContext;
  discussion: WorkspaceDiscussionContext;
  activity: WorkspaceActivityContext;
  info: WorkspaceProjectInfoContext;
}

export interface WorkspaceRouteContext {
  controller: WorkspaceController;
  views: WorkspaceViewContexts;
}

export const workspaceRouteContextKey: InjectionKey<WorkspaceRouteContext> =
  Symbol("workspace-route-context");

export const useWorkspaceRouteContext = () => {
  const context = inject(workspaceRouteContextKey);
  if (!context) {
    throw new Error("Workspace pages must be rendered inside the Workspace layout.");
  }
  return context;
};
