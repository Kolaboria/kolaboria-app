export type WorkspaceViewPath =
  | "overview"
  | "tasks"
  | "team"
  | "discussion"
  | "activity"
  | "info";

export const projectWorkspacePath = (
  projectSlug: string,
  view: WorkspaceViewPath = "overview",
): string =>
  `/projects/${encodeURIComponent(projectSlug)}/workspace/${view === "discussion" ? "discussions" : view}`;

export const projectWorkspaceDiscussionPath = (
  projectSlug: string,
  discussionId: string,
): string =>
  `${projectWorkspacePath(projectSlug, "discussion")}/${encodeURIComponent(discussionId)}`;
