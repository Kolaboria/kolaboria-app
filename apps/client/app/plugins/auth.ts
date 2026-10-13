export default defineNuxtPlugin(async () => {
  const currentPath = import.meta.server
    ? useRequestURL().pathname
    : window.location.pathname
  const isProfileOverview = /^\/profile\/[^/]+\/?$/.test(currentPath)

  // These forms have no initial data dependency. Protected-route guards
  // hydrate the session when the visitor enters the product.
  if (/^\/(login|register)\/?$/.test(currentPath)) return

  // Public profile routes stay anonymous; the API does not expose a public profile endpoint yet.
  if (isProfileOverview) return

  // Applicant management uses local demo fixtures until API integration is requested.
  if (/^\/projects\/[^/]+\/applicants\/?$/.test(currentPath)) return

  // The create route hydrates through its guards and retryable account loader.
  if (/^\/projects\/create\/?$/.test(currentPath)) return

  const { fetchCurrentUser } = useAuth()
  await fetchCurrentUser()
})
