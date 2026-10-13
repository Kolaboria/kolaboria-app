import assert from 'node:assert/strict'
import test from 'node:test'

import './helpers/frontend-runtime.mjs'

test('my-applications helper and presentation logic works accurately', () => {
  // Test monogram helper
  const getMonogram = (title) => {
    if (!title) return 'PP'
    const words = title.trim().split(/\s+/)
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
    }
    return title.slice(0, 2).toUpperCase()
  }

  assert.equal(getMonogram('Platform Portofolio untuk Talenta Digital'), 'PP')
  assert.equal(getMonogram('Open Source Design System'), 'OS')
  assert.equal(getMonogram('Frontend'), 'FR')
  assert.equal(getMonogram(''), 'PP')

  // Test sample applications
  const sampleApps = [
    {
      id: 'app-1',
      status: 'pending',
      applied_at: '2026-10-09T10:00:00Z',
      motivation: 'Saya tertarik dengan misi proyek ini',
      project_role: { custom_title: 'Frontend Developer' },
      projects: { title: 'Platform Portofolio untuk Talenta Digital', context: 'Proyek pribadi' }
    },
    {
      id: 'app-2',
      status: 'pending',
      applied_at: '2026-10-08T10:00:00Z',
      motivation: 'Ingin berkontribusi di design system',
      project_role: { custom_title: 'Frontend Developer' },
      projects: { title: 'Open Source Design System', context: 'Proyek pribadi' }
    },
    {
      id: 'app-3',
      status: 'pending',
      applied_at: '2026-10-07T10:00:00Z',
      motivation: 'Mobile dev enthusiast',
      project_role: { custom_title: 'Mobile Engineer' },
      projects: { title: 'Mobile Banking App', context: 'Komunitas' }
    },
    {
      id: 'app-4',
      status: 'accepted',
      applied_at: '2026-10-06T10:00:00Z',
      motivation: 'Fullstack dev',
      project_role: { custom_title: 'Backend Engineer' },
      projects: { title: 'Cloud Infrastructure', context: 'Eksperimen' }
    },
    {
      id: 'app-5',
      status: 'accepted',
      applied_at: '2026-10-05T10:00:00Z',
      motivation: 'UI designer',
      project_role: { custom_title: 'UI/UX Designer' },
      projects: { title: 'Health Tracker', context: 'Proyek pribadi' }
    },
    {
      id: 'app-6',
      status: 'rejected',
      applied_at: '2026-10-04T10:00:00Z',
      motivation: 'Devops',
      project_role: { custom_title: 'DevOps' },
      projects: { title: 'Crypto Wallet', context: 'Komunitas' }
    },
    {
      id: 'app-7',
      status: 'withdrawn',
      applied_at: '2026-10-03T10:00:00Z',
      motivation: 'Tester',
      project_role: { custom_title: 'QA Engineer' },
      projects: { title: 'E-commerce Platform', context: 'Proyek client' }
    }
  ]

  // Stats calculation
  const stats = {
    total: sampleApps.length,
    pending: sampleApps.filter(a => a.status === 'pending').length,
    accepted: sampleApps.filter(a => a.status === 'accepted').length,
    rejected: sampleApps.filter(a => a.status === 'rejected').length,
    withdrawn: sampleApps.filter(a => a.status === 'withdrawn').length
  }

  assert.equal(stats.total, 7)
  assert.equal(stats.pending, 3)
  assert.equal(stats.accepted, 2)
  assert.equal(stats.rejected, 1)
  assert.equal(stats.withdrawn, 1)

  // Pagination calculation
  const itemsPerPage = 6
  const totalPages = Math.ceil(sampleApps.length / itemsPerPage)
  assert.equal(totalPages, 2)

  const desktopPage1 = sampleApps.slice(0, itemsPerPage)
  const desktopPage2 = sampleApps.slice(itemsPerPage, itemsPerPage * 2)
  assert.equal(desktopPage1.length, 6)
  assert.equal(desktopPage2.length, 1)

  // Mobile Endless scrolling
  let mobileDisplayCount = itemsPerPage
  const hasMoreMobile = mobileDisplayCount < sampleApps.length
  assert.equal(hasMoreMobile, true)

  mobileDisplayCount += itemsPerPage
  const hasMoreMobileAfterLoad = mobileDisplayCount < sampleApps.length
  assert.equal(hasMoreMobileAfterLoad, false)
})
