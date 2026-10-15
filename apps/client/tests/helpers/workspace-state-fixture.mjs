export const createWorkspaceTestState = () => {
  const people = [
    { id: 'fahmi', name: 'Fahmi', initials: 'FA', role: 'Frontend Developer' },
    { id: 'nisa', name: 'Nisa Putri', initials: 'NP', role: 'UI/UX Designer' },
    { id: 'raka', name: 'Raka Pratama', initials: 'RP', role: 'Backend Developer' },
    { id: 'dina', name: 'Dina Maharani', initials: 'DM', role: 'Product Designer' },
  ]
  const today = '2026-10-15'
  const inProgressProject = {
    id: 'platform-edukasi-digital',
    title: 'Platform Edukasi Digital',
    description: 'Membangun platform pembelajaran digital untuk komunitas.',
    ownerId: 'fahmi',
    taskManagerIds: [],
    status: 'in_progress',
    startDate: today,
    dueDate: '2026-11-12',
    roleReadiness: [
      { id: 'frontend', name: 'Frontend Developer', required: true, readiness: 'ready' },
      { id: 'product-design', name: 'Product Designer', required: true, readiness: 'ready' },
      { id: 'content', name: 'Content Writer', required: false, readiness: 'not_needed' },
    ],
    memberIds: people.map((person) => person.id),
    tasks: [
      {
        id: 'task-onboarding-wireframe', title: 'Finalisasi wireframe onboarding',
        description: 'Pastikan alur registrasi dan onboarding mudah dipahami.',
        status: 'review', assigneeId: 'nisa', priority: 'high', dueDate: '2026-10-16',
        comments: [{ id: 'comment-1', authorId: 'nisa', body: 'Wireframe siap untuk ditinjau.', createdAt: today }],
      },
      {
        id: 'task-dashboard', title: 'Implementasi halaman dashboard',
        description: 'Bangun dashboard responsive sesuai rancangan dan komponen Kolaboria.',
        status: 'doing', assigneeId: 'fahmi', priority: 'high', dueDate: '2026-10-18', comments: [],
      },
      {
        id: 'task-profile-endpoint', title: 'Integrasi endpoint profil',
        description: 'Hubungkan tampilan profil dengan data akun dan state kosong.',
        status: 'todo', assigneeId: 'raka', priority: 'medium', dueDate: '2026-10-20', comments: [],
      },
      {
        id: 'task-design-tokens', title: 'Susun design tokens',
        description: 'Dokumentasikan token warna dan tipografi untuk handoff.',
        status: 'done', assigneeId: 'dina', priority: 'medium', dueDate: '2026-10-13', comments: [],
      },
      {
        id: 'task-accessibility-form', title: 'Review aksesibilitas form',
        description: 'Audit label, navigasi keyboard, dan pesan validasi.',
        status: 'todo', assigneeId: 'fahmi', priority: 'medium', dueDate: '2026-10-23', comments: [],
      },
    ],
    discussions: [{
      id: 'discussion-onboarding', authorId: 'nisa', title: 'Review alur onboarding',
      body: 'Mohon feedback pada rancangan onboarding sebelum implementasi.', createdAt: today,
      replies: [{
        id: 'reply-1', authorId: 'fahmi', body: 'Langkah verifikasi profil bisa dipindahkan setelah onboarding awal.',
        createdAt: today, replyToId: null, replies: [
          { id: 'reply-2', authorId: 'dina', body: 'Setuju. Kita bisa tetap memberi konteks singkat sebelum verifikasi.', createdAt: today, replyToId: 'reply-1', replies: [] },
          { id: 'reply-3', authorId: 'raka', body: 'Keterangan singkat itu juga akan membantu mengurangi kebingungan.', createdAt: today, replyToId: 'reply-2', replies: [] },
        ],
      }],
    }],
    activities: [
      { id: 'activity-1', actorId: 'nisa', text: 'mengirim wireframe onboarding untuk direview', createdAt: today },
      { id: 'activity-2', actorId: 'dina', text: 'menyelesaikan design tokens', createdAt: '2026-10-14' },
      { id: 'activity-3', actorId: 'fahmi', text: 'memulai implementasi dashboard', createdAt: '2026-10-13' },
    ],
    contributions: [],
    resultSummary: '',
  }
  const preparingProject = {
    ...inProgressProject,
    id: 'website-komunitas-kreatif',
    title: 'Website Komunitas Kreatif',
    description: 'Website profil dan kegiatan komunitas kreatif.',
    status: 'preparing',
    startDate: '',
    dueDate: '2026-11-24',
    roleReadiness: [
      { id: 'site-ui', name: 'UI/UX Designer', required: true, readiness: 'ready' },
      { id: 'site-content', name: 'Content Writer', required: true, readiness: 'to_fill' },
      { id: 'site-dev', name: 'Frontend Developer', required: true, readiness: 'ready' },
    ],
    memberIds: ['fahmi', 'nisa'],
    tasks: [{ id: 'site-sitemap', title: 'Susun sitemap website', description: 'Tentukan struktur halaman utama dan kebutuhan konten.', status: 'todo', assigneeId: 'nisa', priority: 'medium', dueDate: '2026-10-22', comments: [] }],
    discussions: [],
    activities: [{ id: 'site-activity-1', actorId: 'fahmi', text: 'menyiapkan tim untuk memulai proyek', createdAt: today }],
  }
  const completedProject = {
    ...inProgressProject,
    id: 'design-system-kolaboria',
    title: 'Design system Kolaboria',
    description: 'Merapikan fondasi komponen agar pengalaman Kolaboria terasa konsisten.',
    status: 'completed',
    startDate: '2026-09-10',
    dueDate: '2026-10-12',
    roleReadiness: [{ id: 'system-design', name: 'Product Designer', required: true, readiness: 'ready' }],
    memberIds: ['fahmi', 'dina', 'nisa'],
    tasks: [
      { id: 'system-buttons', title: 'Audit komponen tombol', description: 'Tinjau state tombol dan aksesibilitas.', status: 'done', assigneeId: 'dina', priority: 'medium', dueDate: '2026-10-03', comments: [] },
      { id: 'system-colors', title: 'Dokumentasi palet warna', description: 'Susun panduan token warna utama.', status: 'done', assigneeId: 'nisa', priority: 'high', dueDate: '2026-10-07', comments: [] },
    ],
    discussions: [],
    activities: [{ id: 'system-activity-1', actorId: 'fahmi', text: 'menutup proyek setelah meninjau hasil', createdAt: '2026-10-12' }],
    contributions: [{
      id: 'contribution-dina-system', contributorId: 'dina', role: 'Product Designer',
      summary: 'Mengaudit komponen tombol dan merapikan dokumentasi sistem desain.',
      status: 'pending_review', reviewNote: '', isShared: false, proposedAt: '2026-10-13',
    }],
    resultSummary: 'Komponen inti dan dokumentasi sistem desain siap digunakan oleh tim produk.',
  }

  return {
    activeProjectId: inProgressProject.id,
    currentUserId: 'fahmi',
    people,
    projects: [inProgressProject, preparingProject, completedProject],
  }
}
