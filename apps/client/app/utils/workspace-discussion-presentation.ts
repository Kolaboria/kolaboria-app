import type { WorkspaceDiscussionReplyViewModel } from '~/types/workspace-discussion'

export const workspaceDiscussionReplyParentId = (
  reply: Pick<WorkspaceDiscussionReplyViewModel, 'id' | 'parentReplyId'>
): string => reply.parentReplyId ?? reply.id

export const formatWorkspaceDiscussionDate = (
  value: string,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone
  }).format(date)
}
