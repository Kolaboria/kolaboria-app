export type WorkspacePrototypeRole = 'owner' | 'contributor'
export type WorkspacePrototypeProjectStatus = 'preparing' | 'in_progress' | 'completed'
export type WorkspacePrototypeTaskStatus = 'todo' | 'doing' | 'review' | 'done' | 'closed' | 'cancelled'
export type WorkspacePrototypeActivityCategory = 'project' | 'administrative'
export type WorkspacePrototypeReadiness = 'ready' | 'to_fill' | 'not_needed'
export type WorkspacePrototypeContributionStatus = 'pending_review' | 'changes_requested' | 'accepted'

export interface WorkspacePrototypePerson {
  id: string
  name: string
  initials: string
  role: string
}

export interface WorkspacePrototypeComment {
  id: string
  authorId: string
  body: string
  createdAt: string
}

export interface WorkspacePrototypeDiscussionReply extends WorkspacePrototypeComment {
  /** Exact reply this message addresses; replies remain grouped under a level-one root. */
  replyToId?: string | null
  replies: WorkspacePrototypeDiscussionReply[]
}

export interface WorkspacePrototypeTask {
  id: string
  title: string
  description: string
  status: WorkspacePrototypeTaskStatus
  assigneeId: string | null
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  comments: WorkspacePrototypeComment[]
  closeReason?: string
}

export interface WorkspacePrototypeDiscussion {
  id: string
  authorId: string
  title: string
  body: string
  createdAt: string
  replies: WorkspacePrototypeDiscussionReply[]
}

export interface WorkspacePrototypeActivity {
  id: string
  actorId: string
  text: string
  createdAt: string
  category?: WorkspacePrototypeActivityCategory
}

export interface WorkspacePrototypeRoleReadiness {
  id: string
  name: string
  required: boolean
  readiness: WorkspacePrototypeReadiness
}

export interface WorkspacePrototypeContribution {
  id: string
  contributorId: string
  role: string
  summary: string
  status: WorkspacePrototypeContributionStatus
  reviewNote: string
  isShared: boolean
  proposedAt: string
}

export interface WorkspacePrototypeProject {
  id: string
  title: string
  description: string
  ownerId: string
  taskManagerIds: string[]
  status: WorkspacePrototypeProjectStatus
  startDate: string
  dueDate: string
  roleReadiness: WorkspacePrototypeRoleReadiness[]
  memberIds: string[]
  tasks: WorkspacePrototypeTask[]
  discussions: WorkspacePrototypeDiscussion[]
  activities: WorkspacePrototypeActivity[]
  contributions: WorkspacePrototypeContribution[]
  resultSummary: string
}

export interface WorkspacePrototypeState {
  activeProjectId: string
  currentUserId: string
  people: WorkspacePrototypePerson[]
  projects: WorkspacePrototypeProject[]
}

export const createWorkspacePrototypeState = (): WorkspacePrototypeState => ({
  activeProjectId: 'platform-edukasi-digital',
  currentUserId: 'fahmi',
  people: [
    { id: 'fahmi', name: 'Fahmi Pratama', initials: 'FP', role: 'Product Lead' },
    { id: 'nisa', name: 'Nisa Aulia', initials: 'NA', role: 'UI/UX Designer' },
    { id: 'raka', name: 'Raka Putra', initials: 'RP', role: 'Frontend Developer' },
    { id: 'dina', name: 'Dina Maharani', initials: 'DM', role: 'Content Strategist' },
  ],
  projects: [
    {
      id: 'platform-edukasi-digital',
      title: 'Platform Edukasi Digital',
      description: 'Membangun pengalaman belajar digital yang mudah diakses untuk komunitas lokal.',
      ownerId: 'fahmi',
      taskManagerIds: ['raka'],
      status: 'in_progress',
      startDate: '2026-09-28',
      dueDate: '2026-10-30',
      roleReadiness: [
        { id: 'role-design', name: 'UI/UX Designer', required: true, readiness: 'ready' },
        { id: 'role-frontend', name: 'Frontend Developer', required: true, readiness: 'ready' },
        { id: 'role-content', name: 'Content Strategist', required: true, readiness: 'ready' },
        { id: 'role-research', name: 'User Researcher', required: false, readiness: 'not_needed' },
      ],
      memberIds: ['fahmi', 'nisa', 'raka', 'dina'],
      tasks: [
        { id: 'edu-task-1', title: 'Menyusun alur onboarding peserta', description: 'Petakan langkah pertama peserta sampai menemukan kelas yang sesuai.', status: 'done', assigneeId: 'nisa', priority: 'high', dueDate: '2026-10-05', comments: [{ id: 'edu-comment-1', authorId: 'fahmi', body: 'Alur sudah ditinjau bersama tim, terima kasih.', createdAt: '2026-10-06' }] },
        { id: 'edu-task-2', title: 'Membuat komponen katalog kelas', description: 'Implementasikan kartu kelas dan filter kategori untuk layar desktop dan mobile.', status: 'review', assigneeId: 'raka', priority: 'high', dueDate: '2026-10-17', comments: [{ id: 'edu-comment-2', authorId: 'raka', body: 'Komponen dan filter sudah siap dicek di branch demo.', createdAt: '2026-10-14' }] },
        { id: 'edu-task-3', title: 'Menulis panduan belajar mandiri', description: 'Siapkan konten pengantar untuk membantu peserta menyusun ritme belajar.', status: 'doing', assigneeId: 'dina', priority: 'medium', dueDate: '2026-10-20', comments: [] },
        { id: 'edu-task-4', title: 'Meninjau aksesibilitas halaman kelas', description: 'Periksa fokus keyboard, label kontrol, dan kontras teks.', status: 'todo', assigneeId: 'nisa', priority: 'medium', dueDate: '2026-10-24', comments: [] },
        { id: 'edu-task-5', title: 'Menyelaraskan navigasi dan breadcrumb', description: 'Samakan pola navigasi antar halaman utama.', status: 'todo', assigneeId: 'raka', priority: 'low', dueDate: '2026-10-27', comments: [] },
        { id: 'edu-task-6', title: 'Membuat ilustrasi untuk halaman kelas', description: 'Aset ilustrasi khusus dibatalkan setelah tim memilih memakai aset yang sudah tersedia.', status: 'closed', assigneeId: 'dina', priority: 'low', dueDate: '2026-10-12', closeReason: 'Scope visual disederhanakan; proyek memakai aset ilustrasi komunitas yang sudah tersedia.', comments: [] },
      ],
      discussions: [
        { id: 'edu-discussion-1', authorId: 'fahmi', title: 'Prioritas rilis pertama', body: 'Mari sepakati pengalaman minimum yang harus tersedia untuk uji coba komunitas bulan ini.', createdAt: '2026-10-12', replies: [
          { id: 'edu-reply-1', authorId: 'nisa', body: 'Menurutku katalog dan onboarding perlu masuk lebih dulu.', createdAt: '2026-10-12', replies: [
            { id: 'edu-reply-1a', authorId: 'raka', body: 'Setuju, keduanya juga sudah punya komponen yang bisa dipakai ulang.', createdAt: '2026-10-13', replies: [] },
          ] },
          { id: 'edu-reply-2', authorId: 'dina', body: 'Aku bisa menyiapkan panduan singkat untuk mendampingi rilis itu.', createdAt: '2026-10-14', replies: [] },
        ] },
        { id: 'edu-discussion-2', authorId: 'raka', title: 'Review komponen katalog', body: 'Komponen katalog sudah ada di Workspace. Mohon catat masukan yang berdampak ke alur pengguna.', createdAt: '2026-10-14', replies: [] },
      ],
      activities: [
        { id: 'edu-activity-1', actorId: 'raka', text: 'mengirim task katalog kelas untuk review', createdAt: '2026-10-14T09:30:00.000Z' },
        { id: 'edu-activity-2', actorId: 'dina', text: 'memperbarui panduan belajar mandiri', createdAt: '2026-10-13T14:00:00.000Z' },
        { id: 'edu-activity-3', actorId: 'fahmi', text: 'menutup task ilustrasi karena perubahan scope', createdAt: '2026-10-12T10:15:00.000Z' },
        { id: 'edu-activity-4', actorId: 'nisa', text: 'menyelesaikan alur onboarding peserta', createdAt: '2026-10-06T11:20:00.000Z' },
      ],
      contributions: [],
      resultSummary: '',
    },
    {
      id: 'website-komunitas-kreatif',
      title: 'Website Komunitas Kreatif',
      description: 'Menyiapkan website sederhana untuk memperkenalkan kegiatan dan karya anggota komunitas.',
      ownerId: 'fahmi',
      taskManagerIds: [],
      status: 'preparing',
      startDate: '2026-10-20',
      dueDate: '2026-12-05',
      roleReadiness: [
        { id: 'web-role-design', name: 'UI/UX Designer', required: true, readiness: 'ready' },
        { id: 'web-role-developer', name: 'Web Developer', required: true, readiness: 'to_fill' },
        { id: 'web-role-editor', name: 'Editor Konten', required: false, readiness: 'to_fill' },
      ],
      memberIds: ['fahmi', 'nisa', 'dina'],
      tasks: [],
      discussions: [],
      activities: [
        { id: 'web-activity-1', actorId: 'fahmi', text: 'membuat ruang persiapan proyek', createdAt: '2026-10-14T08:00:00.000Z' },
        { id: 'web-activity-2', actorId: 'nisa', text: 'bergabung sebagai UI/UX Designer', createdAt: '2026-10-14T08:20:00.000Z' },
      ],
      contributions: [],
      resultSummary: '',
    },
    {
      id: 'design-system-kolaboria',
      title: 'Design System Kolaboria',
      description: 'Menyatukan komponen dasar dan pola visual agar tim produk bekerja dengan konsisten.',
      ownerId: 'fahmi',
      taskManagerIds: [],
      status: 'completed',
      startDate: '2026-07-01',
      dueDate: '2026-08-30',
      roleReadiness: [
        { id: 'ds-role-design', name: 'Product Designer', required: true, readiness: 'ready' },
        { id: 'ds-role-engineer', name: 'Frontend Developer', required: true, readiness: 'ready' },
      ],
      memberIds: ['fahmi', 'nisa', 'raka', 'dina'],
      tasks: [
        { id: 'ds-task-1', title: 'Mendokumentasikan token warna', description: 'Dokumentasi token warna untuk kebutuhan produk dan status antarmuka.', status: 'done', assigneeId: 'nisa', priority: 'high', dueDate: '2026-07-20', comments: [] },
        { id: 'ds-task-2', title: 'Membangun komponen tombol', description: 'Komponen tombol dengan varian dan status interaksi.', status: 'done', assigneeId: 'raka', priority: 'high', dueDate: '2026-08-01', comments: [] },
        { id: 'ds-task-3', title: 'Menguji komponen pada alur utama', description: 'Kumpulkan masukan tim pada komponen inti.', status: 'done', assigneeId: 'dina', priority: 'medium', dueDate: '2026-08-15', comments: [] },
      ],
      discussions: [
        { id: 'ds-discussion-1', authorId: 'nisa', title: 'Panduan penggunaan token', body: 'Dokumentasi penggunaan token sudah siap untuk dipakai lintas fitur.', createdAt: '2026-08-25', replies: [
          { id: 'ds-reply-1', authorId: 'raka', body: 'Sudah saya terapkan pada komponen tombol.', createdAt: '2026-08-26', replies: [] },
        ] },
      ],
      activities: [
        { id: 'ds-activity-1', actorId: 'fahmi', text: 'meninjau hasil dan menutup proyek', createdAt: '2026-08-30T15:00:00.000Z' },
        { id: 'ds-activity-2', actorId: 'raka', text: 'menyelesaikan komponen tombol', createdAt: '2026-08-22T10:00:00.000Z' },
        { id: 'ds-activity-3', actorId: 'nisa', text: 'menyelesaikan dokumentasi token warna', createdAt: '2026-08-18T09:00:00.000Z' },
      ],
      contributions: [
        { id: 'ds-contribution-nisa', contributorId: 'nisa', role: 'UI/UX Designer', summary: 'Menyusun token warna dan panduan visual design system.', status: 'pending_review', reviewNote: '', isShared: false, proposedAt: '2026-08-31' },
        { id: 'ds-contribution-raka', contributorId: 'raka', role: 'Frontend Developer', summary: 'Membangun komponen tombol dan menerapkan token pada antarmuka.', status: 'accepted', reviewNote: '', isShared: true, proposedAt: '2026-08-31' },
        { id: 'ds-contribution-dina', contributorId: 'dina', role: 'Content Strategist', summary: 'Menguji bahasa dan kejelasan panduan penggunaan komponen.', status: 'changes_requested', reviewNote: 'Tambahkan contoh hasil review dan ruang lingkup pengujian.', isShared: false, proposedAt: '2026-08-31' },
      ],
      resultSummary: 'Design system dasar selesai dan dipakai sebagai acuan bersama untuk fitur Kolaboria berikutnya.',
    },
  ],
})

export const personFor = (state: WorkspacePrototypeState, personId: string | null) =>
  state.people.find((person) => person.id === personId) ?? null

export const projectFor = (state: WorkspacePrototypeState, projectId: string) =>
  state.projects.find((project) => project.id === projectId) ?? null

export const migrateWorkspacePrototypeState = (state: WorkspacePrototypeState) => {
  for (const project of state.projects) {
    project.taskManagerIds ??= []
    delete (project as WorkspacePrototypeProject & { leadIds?: string[] }).leadIds
    delete (project as WorkspacePrototypeProject & { milestones?: unknown }).milestones
    project.activities = project.activities
      .map((activity) => {
        let text = activity.text
        const actorName = personFor(state, activity.actorId)?.name
        while (actorName && text.startsWith(`${actorName} `)) {
          text = text.slice(actorName.length).trimStart()
        }
        const isAdministrative = /izin kelola task|izin task|izin berbagi rekam|membagikan rekam kontribusinya|rekam kembali privat/i.test(text)
        return {
          ...activity,
          text,
          category: activity.category ?? (isAdministrative ? 'administrative' : 'project'),
        }
      })
      .filter((activity) => !/\b(?:menambahkan|memperbarui|menyelesaikan|membuka kembali|menghapus) milestone\b/i.test(activity.text))
    project.discussions = (project.discussions ?? []).map((discussion) => ({
      ...discussion,
      replies: normalizeDiscussionReplies(discussion.replies ?? []),
    }))
    for (const task of project.tasks) {
      if (task.status === 'cancelled') task.status = 'closed'
    }
  }
  return state
}

export const projectActivityList = (project: WorkspacePrototypeProject) =>
  project.activities.filter((activity) => activity.category !== 'administrative')

export const isProjectManager = (project: WorkspacePrototypeProject, actorId: string) =>
  project.ownerId === actorId

export const canManageTasks = (project: WorkspacePrototypeProject, actorId: string) =>
  isProjectManager(project, actorId) || project.taskManagerIds.includes(actorId)

export const setTaskManagerAccess = (
  state: WorkspacePrototypeState,
  projectId: string,
  actorId: string,
  memberId: string,
  enabled: boolean
) => {
  const project = projectFor(state, projectId)
  if (!project || !isProjectManager(project, actorId) || project.status !== 'in_progress' || memberId === project.ownerId || !project.memberIds.includes(memberId)) return false
  const alreadyEnabled = project.taskManagerIds.includes(memberId)
  if (alreadyEnabled === enabled) return false
  if (enabled) project.taskManagerIds.push(memberId)
  else project.taskManagerIds = project.taskManagerIds.filter((id) => id !== memberId)
  const member = personFor(state, memberId)?.name ?? 'anggota'
  addActivity(project, actorId, `${enabled ? 'memberi' : 'mencabut'} izin kelola task untuk ${member}`, 'administrative')
  return true
}

export const toggleWorkspaceAssigneeFilter = (currentAssigneeId: string | null, selectedAssigneeId: string) =>
  currentAssigneeId === selectedAssigneeId ? null : selectedAssigneeId

const addActivity = (
  project: WorkspacePrototypeProject,
  actorId: string,
  text: string,
  category: WorkspacePrototypeActivityCategory = 'project',
) => {
  project.activities.unshift({
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actorId,
    text,
    createdAt: new Date().toISOString(),
    category,
  })
}

export const setRoleReadiness = (
  state: WorkspacePrototypeState,
  projectId: string,
  roleId: string,
  readiness: WorkspacePrototypeReadiness,
  actorId: string
) => {
  const project = projectFor(state, projectId)
  if (!project || project.ownerId !== actorId || project.status !== 'preparing') return false
  const role = project.roleReadiness.find((item) => item.id === roleId)
  if (!role) return false
  role.readiness = readiness
  addActivity(project, actorId, `memperbarui kesiapan peran ${role.name.toLowerCase()}`)
  return true
}

export const startProject = (state: WorkspacePrototypeState, projectId: string, actorId: string) => {
  const project = projectFor(state, projectId)
  if (!project || project.ownerId !== actorId || project.status !== 'preparing') return false
  if (project.roleReadiness.some((role) => role.required && role.readiness === 'to_fill')) return false
  project.status = 'in_progress'
  project.startDate = new Date().toISOString().slice(0, 10)
  addActivity(project, actorId, 'memulai proyek dan membuka Workspace untuk tim')
  return true
}

export const moveTask = (
  state: WorkspacePrototypeState,
  projectId: string,
  taskId: string,
  nextStatus: Exclude<WorkspacePrototypeTaskStatus, 'cancelled' | 'closed'>,
  actorId: string
) => {
  const project = projectFor(state, projectId)
  const task = project?.tasks.find((item) => item.id === taskId)
  if (!project || !task || project.status !== 'in_progress' || task.status === 'cancelled') return false
  const isManager = isProjectManager(project, actorId)
  if (!isManager && (task.assigneeId !== actorId || nextStatus === 'done')) return false
  task.status = nextStatus
  task.closeReason = undefined
  const statusLabel = nextStatus === 'todo' ? 'akan dikerjakan' : nextStatus === 'doing' ? 'sedang dikerjakan' : nextStatus === 'review' ? 'mengirim task untuk review' : 'menyelesaikan task'
  addActivity(project, actorId, `menandai “${task.title}” ${statusLabel}`)
  return true
}

export const closeTask = (
  state: WorkspacePrototypeState,
  projectId: string,
  taskId: string,
  actorId: string,
  reason: string
) => {
  const project = projectFor(state, projectId)
  const task = project?.tasks.find((item) => item.id === taskId)
  const cleanedReason = reason.trim()
  if (!project || !isProjectManager(project, actorId) || project.status !== 'in_progress' || !task || task.status === 'done' || task.status === 'closed' || !cleanedReason) return false
  task.status = 'closed'
  task.closeReason = cleanedReason
  addActivity(project, actorId, `menutup “${task.title}” karena perubahan scope`)
  return true
}

export const canCloseProject = (project: WorkspacePrototypeProject) =>
  project.tasks.length > 0 && project.tasks.every((task) => task.status === 'done' || ((task.status === 'closed' || task.status === 'cancelled') && Boolean(task.closeReason?.trim())))

export const closeProject = (
  state: WorkspacePrototypeState,
  projectId: string,
  actorId: string,
  resultSummary: string
) => {
  const project = projectFor(state, projectId)
  const summary = resultSummary.trim()
  if (!project || !isProjectManager(project, actorId) || project.status !== 'in_progress' || !canCloseProject(project) || !summary) return false
  project.status = 'completed'
  project.resultSummary = summary
  addActivity(project, actorId, 'meninjau hasil dan menutup proyek')
  return true
}

export const createTask = (
  state: WorkspacePrototypeState,
  projectId: string,
  actorId: string,
  input: Omit<WorkspacePrototypeTask, 'id' | 'comments' | 'status'> & { status?: Exclude<WorkspacePrototypeTaskStatus, 'closed' | 'cancelled'> }
) => {
  const project = projectFor(state, projectId)
  const title = input.title.trim()
  if (!project || !canManageTasks(project, actorId) || project.status !== 'in_progress' || !title) return null
  const isManager = isProjectManager(project, actorId)
  const task: WorkspacePrototypeTask = {
    ...input,
    assigneeId: isManager ? input.assigneeId : actorId,
    priority: isManager ? input.priority : 'medium',
    dueDate: isManager ? input.dueDate : '',
    id: `task-${Date.now()}`,
    title,
    status: input.status ?? 'todo',
    comments: []
  }
  project.tasks.unshift(task)
  addActivity(project, actorId, `membuat task “${task.title}”`)
  return task
}

export const deleteTask = (state: WorkspacePrototypeState, projectId: string, taskId: string, actorId: string) => {
  const project = projectFor(state, projectId)
  const taskIndex = project?.tasks.findIndex((item) => item.id === taskId) ?? -1
  const task = taskIndex >= 0 ? project!.tasks[taskIndex] : null
  if (!project || !task || !canManageTasks(project, actorId) || project.status !== 'in_progress' || task.status === 'done' || task.status === 'closed' || task.status === 'cancelled') return false
  project.tasks.splice(taskIndex, 1)
  addActivity(project, actorId, `menghapus task “${task.title}”`)
  return true
}

export const addTaskComment = (state: WorkspacePrototypeState, projectId: string, taskId: string, actorId: string, body: string) => {
  const project = projectFor(state, projectId)
  const task = project?.tasks.find((item) => item.id === taskId)
  const text = body.trim()
  if (!project || project.status === 'preparing' || !task || task.status === 'closed' || task.status === 'cancelled' || !project.memberIds.includes(actorId) || !text) return false
  task.comments.push({ id: `comment-${Date.now()}`, authorId: actorId, body: text, createdAt: new Date().toISOString().slice(0, 10) })
  addActivity(project, actorId, `berkomentar pada “${task.title}”`)
  return true
}

export const createDiscussion = (state: WorkspacePrototypeState, projectId: string, actorId: string, title: string, body: string) => {
  const project = projectFor(state, projectId)
  const cleanTitle = title.trim()
  const cleanBody = body.trim()
  if (!project || project.status === 'preparing' || !project.memberIds.includes(actorId) || !cleanTitle || !cleanBody) return null
  const discussion: WorkspacePrototypeDiscussion = { id: `discussion-${Date.now()}`, authorId: actorId, title: cleanTitle, body: cleanBody, createdAt: new Date().toISOString().slice(0, 10), replies: [] }
  project.discussions.unshift(discussion)
  addActivity(project, actorId, `memulai diskusi “${cleanTitle}”`)
  return discussion
}

type DiscussionReplyInput = Partial<WorkspacePrototypeDiscussionReply> &
  Pick<WorkspacePrototypeComment, 'id' | 'authorId' | 'body' | 'createdAt'> & {
    replies?: DiscussionReplyInput[]
  }

const normalizeDiscussionReplies = (
  replies: DiscussionReplyInput[],
): WorkspacePrototypeDiscussionReply[] => replies.map((reply) => {
  const root: WorkspacePrototypeDiscussionReply = {
    id: reply.id,
    authorId: reply.authorId,
    body: reply.body,
    createdAt: reply.createdAt,
    replyToId: null,
    replies: [],
  }
  const pending = (reply.replies ?? []).map((child) => ({ child, parentId: reply.id })).reverse()

  while (pending.length) {
    const next = pending.pop()
    if (!next) continue
    const normalized: WorkspacePrototypeDiscussionReply = {
      id: next.child.id,
      authorId: next.child.authorId,
      body: next.child.body,
      createdAt: next.child.createdAt,
      replyToId: next.child.replyToId ?? next.parentId,
      replies: [],
    }
    root.replies.push(normalized)
    const children = (next.child.replies ?? []).map((child) => ({ child, parentId: next.child.id }))
    pending.push(...children.reverse())
  }

  root.replies.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return root
})

export const replyDiscussion = (
  state: WorkspacePrototypeState,
  projectId: string,
  discussionId: string,
  actorId: string,
  body: string,
  parentReplyId: string | null = null,
) => {
  const project = projectFor(state, projectId)
  const discussion = project?.discussions.find((item) => item.id === discussionId)
  const text = body.trim()
  if (!project || project.status === 'preparing' || !discussion || !project.memberIds.includes(actorId) || !text) return false
  let rootReply: WorkspacePrototypeDiscussionReply | null = null
  let targetReply: WorkspacePrototypeDiscussionReply | null = null
  if (parentReplyId) {
    for (const root of discussion.replies) {
      if (root.id === parentReplyId) {
        rootReply = root
        targetReply = root
        break
      }
      const nested = root.replies.find((reply) => reply.id === parentReplyId)
      if (nested) {
        rootReply = root
        targetReply = nested
        break
      }
    }
    if (!targetReply || !rootReply) return false
  }
  const targetReplies = rootReply?.replies ?? discussion.replies
  targetReplies.push({
    id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    authorId: actorId,
    body: text,
    createdAt: new Date().toISOString().slice(0, 10),
    replyToId: targetReply?.id ?? null,
    replies: [],
  })
  addActivity(project, actorId, `membalas diskusi “${discussion.title}”`)
  return true
}

export const proposeContributions = (state: WorkspacePrototypeState, projectId: string, actorId: string) => {
  const project = projectFor(state, projectId)
  if (!project || project.ownerId !== actorId || project.status !== 'completed') return []
  const existing = new Set(project.contributions.map((record) => record.contributorId))
  const newRecords = project.memberIds
    .filter((memberId) => memberId !== project.ownerId && !existing.has(memberId))
    .map((contributorId): WorkspacePrototypeContribution => {
      const contributor = personFor(state, contributorId)
      const tasks = project.tasks.filter((task) => task.assigneeId === contributorId && task.status === 'done')
      const taskSummary = tasks.length ? tasks.map((task) => task.title).join(', ') : 'berkolaborasi pada hasil proyek'
      return {
        id: `contribution-${project.id}-${contributorId}`,
        contributorId,
        role: contributor?.role ?? 'Contributor',
        summary: `Berkontribusi sebagai ${contributor?.role ?? 'Contributor'} dengan ${taskSummary}.`,
        status: 'pending_review', reviewNote: '', isShared: false, proposedAt: new Date().toISOString().slice(0, 10)
      }
    })
  project.contributions.push(...newRecords)
  if (newRecords.length) addActivity(project, actorId, 'mengusulkan rekam kontribusi untuk anggota proyek')
  return newRecords
}

export const reviewContribution = (
  state: WorkspacePrototypeState,
  projectId: string,
  contributionId: string,
  actorId: string,
  decision: 'accepted' | 'changes_requested',
  note = ''
) => {
  const project = projectFor(state, projectId)
  const record = project?.contributions.find((item) => item.id === contributionId)
  if (!project || !record || record.contributorId !== actorId || record.status === 'accepted') return false
  const reviewNote = note.trim()
  if (decision === 'changes_requested' && !reviewNote) return false
  record.status = decision
  record.reviewNote = reviewNote
  record.isShared = false
  addActivity(project, actorId, decision === 'accepted' ? 'menyetujui rekam kontribusi' : 'meminta koreksi pada rekam kontribusi')
  return true
}

export const shareContribution = (state: WorkspacePrototypeState, projectId: string, contributionId: string, actorId: string) => {
  const project = projectFor(state, projectId)
  const record = project?.contributions.find((item) => item.id === contributionId)
  if (!project || !record || record.contributorId !== actorId || record.status !== 'accepted' || record.isShared) return false
  record.isShared = true
  addActivity(project, actorId, 'memilih membagikan rekam kontribusi', 'administrative')
  return true
}

export const setContributionSharing = (
  state: WorkspacePrototypeState,
  projectId: string,
  contributionId: string,
  actorId: string,
  isShared: boolean
) => {
  const project = projectFor(state, projectId)
  const record = project?.contributions.find((item) => item.id === contributionId)
  if (!project || !record || record.contributorId !== actorId || record.status !== 'accepted' || record.isShared === isShared) return false
  record.isShared = isShared
  addActivity(project, actorId, isShared ? 'memilih membagikan rekam kontribusi' : 'menarik izin berbagi rekam kontribusi', 'administrative')
  return true
}
