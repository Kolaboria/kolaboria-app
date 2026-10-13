export const sumPendingApplicantCounts = (
  projectIds: readonly string[],
  countsByProject: Readonly<Record<string, number | null | undefined>>
): number | null => {
  if (projectIds.length === 0) return 0

  const counts = projectIds.map(id => countsByProject[id])
  if (counts.some(count => count == null)) return null

  return counts.reduce((total, count) => total + (count ?? 0), 0)
}
