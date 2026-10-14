export const sumPendingApplicantCounts = (
  projectIds: readonly string[],
  countsByProject: Readonly<Record<string, number | null | undefined>>
): number | null => {
  if (projectIds.length === 0) return 0

  let total = 0
  for (const projectId of projectIds) {
    const count = countsByProject[projectId]
    if (count === null || count === undefined) return null
    total += count
  }
  return total
}
