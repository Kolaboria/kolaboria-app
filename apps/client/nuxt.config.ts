import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/icon'],
  // The application shell and authenticated product areas are client-rendered
  // by default. Public routes opt back into SSR below.
  ssr: false,
  devtools: { enabled: true },
  devServer: {
    host: '127.0.0.1'
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  icon: {
    provider: 'none',
    clientBundle: {
      // Keep icon names static in markup so scan can bundle them automatically.
      scan: true,
      includeCustomCollections: false
    }
  },
  components: [
    {
      path: '~/components/ui/atoms',
      prefix: 'Atomic',
      global: true
    },
    {
      path: '~/components/ui/molecules',
      prefix: 'Molecule',
      global: true
    },
    {
      path: '~/components/ui/organisms',
      prefix: 'Organism',
      global: true
    },
    {
      path: '~/components/ui/icon',
      prefix: 'Icon',
      global: true
    },
    '~/components'
  ],
  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/v1',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID
    }
  },
  routeRules: {
    // Public acquisition and discovery surfaces.
    '/': { ssr: true, prerender: true },
    '/privacy-policy': { ssr: true, prerender: true },
    '/terms-of-service': { ssr: true, prerender: true },
    '/projects': { ssr: true, swr: 300 },
    '/projects/*': { ssr: true },
    '/profile/*': { ssr: true },
    '/@/**': { ssr: true },

    // Reserved/private routes must remain client-rendered even though they
    // share a prefix with public project/profile routes above.
    '/projects/my-projects': { ssr: false },
    '/my-projects': { ssr: false },
    '/projects/my-applications': { ssr: false },
    '/projects/create': { ssr: false },
    '/projects/*/edit': { ssr: false },
    '/projects/*/applicants': { ssr: false },
    '/projects/*/workspace': { ssr: false },
    '/profile/me': { ssr: false },
    '/profile/me/**': { ssr: false }
  },
  app: {
    head: {
      title: 'Kolaboria - Connect. Collaborate. Create.',
      meta: [
        {
          name: 'description',
          content:
            'The ultimate platform connecting talents and project initiators to collaborate on amazing projects.'
        }
      ]
    }
  }
})
