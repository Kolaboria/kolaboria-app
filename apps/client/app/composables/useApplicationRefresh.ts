import { computed, type Ref } from 'vue'

export const useApplicationRefresh = (accountId: Ref<string | null>) => {
  const revisions = useState<Record<string, number>>('application-revisions-by-actor', () => ({}))
  const revision = computed(() => {
    const actorId = accountId.value
    return actorId ? revisions.value[actorId] ?? 0 : 0
  })

  const notifyApplicationMutation = (actorId: string) => {
    if (!actorId) return
    revisions.value = { ...revisions.value, [actorId]: (revisions.value[actorId] ?? 0) + 1 }
  }

  return { revision, notifyApplicationMutation }
}
