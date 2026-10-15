interface PendingDiscussionMutation {
  fingerprint: string
  key: string
}

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

export const stableDiscussionMutationKey = (
  pending: Map<string, PendingDiscussionMutation>,
  scope: string,
  payload: unknown,
  createKey: () => string
): string => {
  const fingerprint = stableSerialize(payload)
  const existing = pending.get(scope)
  if (existing?.fingerprint === fingerprint) return existing.key

  const key = createKey()
  pending.set(scope, { fingerprint, key })
  return key
}

export const clearDiscussionMutationKey = (
  pending: Map<string, PendingDiscussionMutation>,
  scope: string
): void => {
  pending.delete(scope)
}
