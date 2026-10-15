export const WORKSPACE_DISCUSSION_LIMITS = Object.freeze({
  title: 160,
  body: 10000,
  reply: 2000
})

export interface WorkspaceDiscussionAuthorDTO {
  id: string
  name: string
  avatar_url?: string | null
}

export interface WorkspaceDiscussionDTO {
  id: string
  project_id: string
  project_title: string
  title: string
  body: string
  author: WorkspaceDiscussionAuthorDTO
  reply_count: number
  participant_count: number
  last_activity_at: string
  created_at: string
  updated_at: string
  can_edit: boolean
  can_delete: boolean
}

export interface WorkspaceDiscussionListItemDTO {
  id: string
  title: string
  body_preview: string
  author: WorkspaceDiscussionAuthorDTO
  reply_count: number
  participant_count: number
  last_activity_at: string
  created_at: string
  updated_at: string
  can_edit: boolean
  can_delete: boolean
}

export interface WorkspaceDiscussionReplyDTO {
  id: string
  discussion_id: string
  parent_reply_id: string | null
  body: string
  author: WorkspaceDiscussionAuthorDTO
  created_at: string
  updated_at: string
  is_deleted: boolean
  can_edit: boolean
  can_delete: boolean
  replies: WorkspaceDiscussionReplyDTO[]
}

export interface WorkspaceDiscussionViewModel {
  id: string
  projectId: string
  projectTitle: string
  title: string
  body: string
  author: { id: string; name: string; avatarUrl: string | null }
  replyCount: number
  participantCount: number
  lastActivityAt: string
  createdAt: string
  updatedAt: string
  canEdit: boolean
  canDelete: boolean
}

export interface WorkspaceDiscussionListViewModel {
  id: string
  title: string
  bodyPreview: string
  author: { id: string; name: string; avatarUrl: string | null }
  replyCount: number
  participantCount: number
  lastActivityAt: string
  createdAt: string
  updatedAt: string
  canEdit: boolean
  canDelete: boolean
}

export interface WorkspaceDiscussionReplyViewModel {
  id: string
  discussionId: string
  parentReplyId: string | null
  body: string
  author: { id: string; name: string; avatarUrl: string | null }
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  canEdit: boolean
  canDelete: boolean
  replies: WorkspaceDiscussionReplyViewModel[]
}

export interface WorkspaceDiscussionPage<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CreateWorkspaceDiscussionInput {
  title: string
  body: string
}

export interface UpdateWorkspaceDiscussionInput {
  title?: string
  body?: string
}

export interface CreateWorkspaceDiscussionReplyInput {
  body: string
  parent_reply_id?: string | null
}

const mapAuthor = (author: WorkspaceDiscussionAuthorDTO) => ({
  id: author.id,
  name: author.name,
  avatarUrl: author.avatar_url ?? null
})

export const mapWorkspaceDiscussion = (
  discussion: WorkspaceDiscussionDTO
): WorkspaceDiscussionViewModel => ({
  id: discussion.id,
  projectId: discussion.project_id,
  projectTitle: discussion.project_title,
  title: discussion.title,
  body: discussion.body,
  author: mapAuthor(discussion.author),
  replyCount: discussion.reply_count,
  participantCount: discussion.participant_count,
  lastActivityAt: discussion.last_activity_at,
  createdAt: discussion.created_at,
  updatedAt: discussion.updated_at,
  canEdit: discussion.can_edit,
  canDelete: discussion.can_delete
})

export const mapWorkspaceDiscussionListItem = (
  discussion: WorkspaceDiscussionListItemDTO
): WorkspaceDiscussionListViewModel => ({
  id: discussion.id,
  title: discussion.title,
  bodyPreview: discussion.body_preview,
  author: mapAuthor(discussion.author),
  replyCount: discussion.reply_count,
  participantCount: discussion.participant_count,
  lastActivityAt: discussion.last_activity_at,
  createdAt: discussion.created_at,
  updatedAt: discussion.updated_at,
  canEdit: discussion.can_edit,
  canDelete: discussion.can_delete
})

export const mapWorkspaceDiscussionReply = (
  reply: WorkspaceDiscussionReplyDTO
): WorkspaceDiscussionReplyViewModel => ({
  id: reply.id,
  discussionId: reply.discussion_id,
  parentReplyId: reply.parent_reply_id,
  body: reply.is_deleted ? '' : reply.body,
  author: mapAuthor(reply.author),
  createdAt: reply.created_at,
  updatedAt: reply.updated_at,
  isDeleted: reply.is_deleted,
  canEdit: reply.can_edit,
  canDelete: reply.can_delete,
  replies: reply.replies.map(mapWorkspaceDiscussionReply)
})
