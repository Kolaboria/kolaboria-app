import type {
  WorkspacePrototypeDiscussion,
  WorkspacePrototypeDiscussionReply,
  WorkspacePrototypeReadiness,
  WorkspacePrototypeTask,
  WorkspacePrototypeTaskStatus,
} from "~/utils/workspace-prototype-state";

type DiscussionReplyTree = { replies: DiscussionReplyTree[] }

export const countDiscussionReplies = (replies: DiscussionReplyTree[]): number =>
  replies.reduce((total, reply) => total + 1 + countDiscussionReplies(reply.replies), 0)

export const discussionParticipantIds = (
  discussion: Pick<WorkspacePrototypeDiscussion, "authorId" | "replies">,
): string[] => {
  const participantIds = new Set([discussion.authorId])
  const collectParticipants = (replies: WorkspacePrototypeDiscussionReply[]) => {
    for (const reply of replies) {
      participantIds.add(reply.authorId)
      collectParticipants(reply.replies)
    }
  }

  collectParticipants(discussion.replies)
  return [...participantIds]
}

export const paginateItems = <T>(items: T[], requestedPage: number, pageSize = 12) => {
  const normalizedPageSize = Math.max(1, Math.trunc(pageSize))
  const pageCount = Math.ceil(items.length / normalizedPageSize)
  const page = pageCount ? Math.min(Math.max(1, Math.trunc(requestedPage)), pageCount) : 1
  const start = (page - 1) * normalizedPageSize

  return {
    items: items.slice(start, start + normalizedPageSize),
    page,
    pageCount,
    total: items.length,
  }
}

export const paginateDiscussionList = <T>(items: T[], requestedPage: number, pageSize = 12) =>
  paginateItems(items, requestedPage, pageSize)

export const dateLabel = (date: string) => {
  if (!date) return "Belum dimulai";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

export const shortDate = (date: string) =>
  date
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
      }).format(new Date(`${date}T00:00:00`))
    : "—";

export const timeLabel = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Baru saja";
  const days = Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  return dateLabel(date.slice(0, 10));
};

export const taskStatusLabel = (status: WorkspacePrototypeTaskStatus) =>
  ({
    todo: "Akan dikerjakan",
    doing: "Dikerjakan",
    review: "Perlu review",
    done: "Selesai",
    closed: "Ditutup",
    cancelled: "Ditutup",
  })[status];

export const taskStatusTone = (status: WorkspacePrototypeTaskStatus) =>
  ({
    todo: "default",
    doing: "primary",
    review: "warning",
    done: "success",
    closed: "default",
    cancelled: "default",
  })[status] as "default" | "primary" | "warning" | "success" | "danger";

export const priorityLabel = (priority: WorkspacePrototypeTask["priority"]) =>
  ({ low: "Rendah", medium: "Sedang", high: "Tinggi" })[priority];

export const readinessLabel = (readiness: WorkspacePrototypeReadiness) =>
  ({
    ready: "Siap",
    to_fill: "Masih perlu diisi",
    not_needed: "Tidak diperlukan",
  })[readiness];

export const contributionLabel = (status: string) =>
  ({
    pending_review: "Menunggu tinjauan",
    changes_requested: "Perlu koreksi",
    accepted: "Disetujui",
  })[status] ?? status;

export const contributionTone = (status: string) =>
  ({
    pending_review: "warning",
    changes_requested: "danger",
    accepted: "success",
  })[status] as "warning" | "danger" | "success";
